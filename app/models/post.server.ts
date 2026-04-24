import invariant from "tiny-invariant";
import { and, eq, inArray, or, sql } from "drizzle-orm";

import * as email from "../lib/email";
import * as slack from "../lib/slack";
import { db } from "~/db/client";
import {
  categories,
  categoryEmails,
  categorySlacks,
  feedToPost,
  feeds,
  postMetas,
  postRevisions,
  postSubscriptions,
  posts,
  users,
} from "~/db/schema";
import { error } from "~/lib/logging";
import { waitUntil } from "~/lib/wait-until";

export type Post = typeof posts.$inferSelect;
export type PostMeta = typeof postMetas.$inferSelect;
export type PostRevision = typeof postRevisions.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Feed = typeof feeds.$inferSelect;

export interface PostQueryType extends Post {
  author: User;
  category: Category;
  meta: PostMeta[];
  feeds: Feed[];
}

export function announcePost(post: PostQueryType): void {
  waitUntil(
    (async () => {
      const emailConfig = await db.query.categoryEmails.findMany({
        where: eq(categoryEmails.categoryId, post.categoryId),
      });
      await Promise.all(
        emailConfig.map((config) => email.notify({ post, config: config as email.EmailConfig })),
      );

      let slackConfig: slack.SlackConfig[] = await db.query.categorySlacks.findMany({
        where: eq(categorySlacks.categoryId, post.categoryId),
      });
      if (!slackConfig.length && process.env.SLACK_WEBHOOK_URL) {
        slackConfig = [{ webhookUrl: process.env.SLACK_WEBHOOK_URL }];
      }
      await Promise.all(
        slackConfig.map((config) => slack.notify({ post, config: config as slack.SlackConfig })),
      );
    })(),
  );
}

export async function syndicatePost(post) {
  post.feeds.forEach(async (feed) => {
    if (feed.webhookUrl) {
      const res = await fetch(feed.webhookUrl, {
        method: "POST",
      });

      if (res.status !== 200) {
        let data: any;
        try {
          data = await res.json();
        } catch {
          data = res.body;
        }
        error("feed webhook failed", {
          context: { webhook: data },
          tags: { statusCode: res.status },
        });
      }
    }
  });
}

export async function getPost({
  id,
  userId,
  onlyPublished = false,
}: Pick<Post, "id"> & {
  userId: User["id"];
  onlyPublished?: boolean;
}): Promise<PostQueryType | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  invariant(user, "user not found");

  let whereCondition;
  if (onlyPublished) {
    if (user.admin) {
      whereCondition = eq(posts.id, id);
    } else {
      whereCondition = and(
        eq(posts.id, id),
        or(
          and(eq(posts.authorId, userId), eq(posts.deleted, false)),
          and(eq(posts.published, true), eq(posts.deleted, false)),
        ),
      );
    }
  } else {
    if (user.admin) {
      whereCondition = eq(posts.id, id);
    } else {
      whereCondition = and(eq(posts.id, id), eq(posts.deleted, false));
    }
  }

  const result = await db.query.posts.findFirst({
    where: whereCondition,
    with: {
      author: true,
      category: true,
      meta: true,
      feedToPost: {
        with: { feed: true },
      },
    },
  });

  if (!result) return null;
  return {
    ...result,
    feeds: result.feedToPost.map((ftp: any) => ftp.feed),
  } as PostQueryType;
}

export async function getPostList({
  userId,
  published,
  authorId,
  categoryId,
  categoryIds,
  feedId,
  query,
  offset = 0,
  limit = 50,
}: {
  userId?: User["id"];
  published?: boolean | null;
  authorId?: User["id"];
  categoryId?: Category["id"];
  categoryIds?: Category["id"][];
  feedId?: Feed["id"];
  query?: string;
  offset?: number;
  limit?: number;
}): Promise<PostQueryType[]> {
  const user = userId ? await db.query.users.findFirst({ where: eq(users.id, userId) }) : null;

  if (!user && !feedId) {
    throw new Error("Cannot query posts without either userId or feedId");
  }

  const conditions = [eq(posts.deleted, false)];

  if (published !== undefined && published !== null) {
    conditions.push(eq(posts.published, published));
  }

  if (published !== true && !user?.admin) {
    conditions.push(eq(posts.authorId, userId!));
  }

  if (authorId) {
    conditions.push(eq(posts.authorId, authorId));
  }

  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId));
  } else if (categoryIds && categoryIds.length > 0) {
    conditions.push(inArray(posts.categoryId, categoryIds));
  }

  if (feedId) {
    // Filter posts that belong to this feed via the junction table
    const postIdsInFeed = db
      .select({ postId: feedToPost.B })
      .from(feedToPost)
      .where(eq(feedToPost.A, feedId));
    conditions.push(inArray(posts.id, postIdsInFeed));
  }

  if (query !== undefined && query !== "") {
    conditions.push(
      sql`(
        to_tsvector('english', ${posts.title}) @@ plainto_tsquery('english', ${query})
        OR to_tsvector('english', coalesce(${posts.content}, '')) @@ plainto_tsquery('english', ${query})
      )`,
    );
  }

  const results = await db.query.posts.findMany({
    where: and(...conditions),
    with: {
      author: true,
      category: true,
      meta: true,
      feedToPost: {
        with: { feed: true },
      },
    },
    limit,
    offset,
    orderBy: (p, { desc }) => desc(p.publishedAt),
  });

  return results.map((r) => ({
    ...r,
    feeds: r.feedToPost.map((ftp: any) => ftp.feed),
  })) as PostQueryType[];
}

export async function updatePost({
  id,
  userId,
  title,
  content,
  categoryId,
  feedIds,
  published,
  deleted,
  meta = [],
}: {
  id: Post["id"];
  userId: User["id"];
  title?: Post["title"];
  content?: Post["content"];
  categoryId?: Post["categoryId"];
  feedIds?: Feed["id"][];
  published?: Post["published"];
  deleted?: Post["deleted"];
  meta?: Pick<PostMeta, "name" | "content">[];
}): Promise<PostQueryType> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  invariant(user, "user not found");

  const whereCondition = user.admin
    ? eq(posts.id, id)
    : and(eq(posts.id, id), eq(posts.authorId, userId), eq(posts.deleted, false));

  const post = await db.query.posts.findFirst({ where: whereCondition });
  invariant(post, "post not found");

  const data: Partial<Post> = {};
  if (published !== undefined && published !== post.published) data.published = !!published;
  if (title !== undefined && title !== post.title) data.title = title;
  if (content !== undefined && content !== post.content) data.content = content;
  if (categoryId !== undefined && categoryId !== post.categoryId) data.categoryId = categoryId;
  if (data.published && !post.publishedAt) data.publishedAt = new Date();

  if (user.admin || deleted !== undefined) {
    if (deleted !== undefined && post.deleted !== deleted) data.deleted = !!deleted;
  }

  const updatedPost = await db.transaction(async (tx) => {
    // Update post fields if any changed
    let result = post;
    if (Object.keys(data).length > 0) {
      const [updated] = await tx
        .update(posts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();
      result = updated;
    }

    // Always create a revision
    await tx.insert(postRevisions).values({
      postId: id,
      authorId: userId,
      title: data.title ?? post.title,
      content: data.content ?? post.content,
      categoryId: data.categoryId ?? post.categoryId,
    });

    // Update feeds M:M via junction table
    if (feedIds !== undefined) {
      await tx.delete(feedToPost).where(eq(feedToPost.B, id));
      if (feedIds.length > 0) {
        await tx.insert(feedToPost).values(feedIds.map((feedId) => ({ A: feedId, B: id })));
      }
    }

    // Replace meta
    if (meta !== undefined) {
      await tx.delete(postMetas).where(eq(postMetas.postId, id));
      if (meta.length > 0) {
        await tx
          .insert(postMetas)
          .values(meta.map((m) => ({ postId: id, name: m.name, content: m.content })));
      }
    }

    return result.id;
  });

  const fullPost = await db.query.posts.findFirst({
    where: eq(posts.id, updatedPost),
    with: {
      author: true,
      category: true,
      meta: true,
      feedToPost: { with: { feed: true } },
    },
  });
  return {
    ...fullPost!,
    feeds: fullPost!.feedToPost.map((ftp: any) => ftp.feed),
  } as PostQueryType;
}

export async function createPost({
  userId,
  content,
  title,
  categoryId,
  feedIds,
  published = false,
  meta = [],
}: Pick<Post, "content" | "title"> & {
  userId: User["id"];
  published?: Post["published"];
  feedIds?: Feed["id"][];
  categoryId: Category["id"];
  meta?: Pick<PostMeta, "name" | "content">[];
}): Promise<PostQueryType> {
  const post = await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(posts)
      .values({
        title,
        content,
        published,
        publishedAt: published ? new Date() : null,
        authorId: userId,
        categoryId,
      })
      .returning();

    await tx.insert(postRevisions).values({
      postId: post.id,
      authorId: userId,
      title,
      content,
      categoryId,
    });

    if (feedIds && feedIds.length > 0) {
      await tx.insert(feedToPost).values(feedIds.map((feedId) => ({ A: feedId, B: post.id })));
    }

    await tx.insert(postSubscriptions).values({
      postId: post.id,
      userId,
    });

    if (meta.length > 0) {
      await tx.insert(postMetas).values(
        meta.map((m) => ({
          postId: post.id,
          name: m.name,
          content: m.content,
        })),
      );
    }

    return post.id;
  });
  const fullPost = await db.query.posts.findFirst({
    where: eq(posts.id, post),
    with: {
      author: true,
      category: true,
      meta: true,
      feedToPost: { with: { feed: true } },
    },
  });
  return {
    ...fullPost,
    feeds: fullPost!.feedToPost.map((ftp: any) => ftp.feed),
  } as PostQueryType;
}

export async function deletePost({ id, userId }: Pick<Post, "id"> & { userId: User["id"] }) {
  updatePost({
    id,
    userId,
    deleted: true,
  });
}
