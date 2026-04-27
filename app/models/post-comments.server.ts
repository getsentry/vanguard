import { eq, and, asc, inArray, sql } from "drizzle-orm";
import invariant from "tiny-invariant";

import { db } from "~/db/client";
import { postComments, posts, users, categoryEmails } from "~/db/schema";
import type { User } from "~/models/user.server";
import { PUBLIC_USER_COLUMNS } from "~/models/user.server";
import type { PostQueryType } from "~/models/post.server";
import { notifyComment } from "~/lib/email";
import { waitUntil } from "~/lib/wait-until";

export type PostComment = typeof postComments.$inferSelect;
export type PostCommentWithAuthor = PostComment & {
  author: Pick<typeof users.$inferSelect, "id" | "email" | "name" | "picture">;
};

export async function getCommentList({
  userId: _userId,
  postId,
  offset = 0,
  limit = 50,
}: {
  userId: string;
  postId: string;
  offset?: number;
  limit?: number;
}): Promise<PostCommentWithAuthor[]> {
  return db.query.postComments.findMany({
    where: and(eq(postComments.deleted, false), eq(postComments.postId, postId)),
    with: { author: { columns: PUBLIC_USER_COLUMNS } },
    orderBy: asc(postComments.createdAt),
    offset,
    limit,
  });
}

export async function countCommentsForPosts({
  userId: _userId,
  postList,
}: {
  userId: string;
  postList: { id: string }[];
}): Promise<{ [postId: string]: number }> {
  const postIds = postList.map((p) => p.id);
  const counts = await db
    .select({ postId: postComments.postId, count: sql<number>`count(*)::int` })
    .from(postComments)
    .where(and(eq(postComments.deleted, false), inArray(postComments.postId, postIds)))
    .groupBy(postComments.postId);

  const results: { [postId: string]: number } = {};
  postIds.forEach((id) => (results[id] = 0));
  counts.forEach((row) => {
    results[row.postId] = row.count;
  });
  return results;
}

export function announceComment(
  post: PostQueryType,
  comment: PostCommentWithAuthor,
  parent?: PostCommentWithAuthor | null,
): void {
  waitUntil(
    (async () => {
      const mailConfig = await db.query.categoryEmails.findMany({
        where: eq(categoryEmails.categoryId, post.categoryId),
      });
      await Promise.all(
        mailConfig.map((config) =>
          notifyComment({ post, comment, parent: parent ?? null, config }),
        ),
      );
    })(),
  );
}

export async function createComment({
  userId,
  postId,
  content,
  parentId = null,
}: {
  userId: string;
  postId: string;
  content: string;
  parentId?: string | null;
}): Promise<PostComment | null> {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: { author: true, category: true },
  });
  invariant(post, "post not found");

  if (post.allowComments && post.category.allowComments) {
    const parent = parentId
      ? await db.query.postComments.findFirst({
          where: and(eq(postComments.postId, postId), eq(postComments.id, parentId)),
          with: { author: { columns: PUBLIC_USER_COLUMNS } },
        })
      : null;

    const [comment] = await db
      .insert(postComments)
      .values({
        postId,
        authorId: userId,
        content,
        parentId: parent ? parent.id : null,
      })
      .returning();

    const commentWithAuthor = await db.query.postComments.findFirst({
      where: eq(postComments.id, comment.id),
      with: { author: { columns: PUBLIC_USER_COLUMNS } },
    });

    announceComment(post as unknown as PostQueryType, commentWithAuthor!, parent);

    return commentWithAuthor!;
  }
  return null;
}

export async function deleteComment({ user, id }: { user: User; id: string }) {
  const where = user.admin
    ? eq(postComments.id, id)
    : and(eq(postComments.id, id), eq(postComments.authorId, user.id));

  const comment = await db.query.postComments.findFirst({ where });
  invariant(comment, "comment not found");

  await db.update(postComments).set({ deleted: true }).where(eq(postComments.id, id));
}
