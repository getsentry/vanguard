import type { User, Post, PostComment } from "@prisma/client";
import invariant from "tiny-invariant";

import { prisma } from "~/services/db.server";
import { notifyComment } from "~/lib/email";

export type { PostComment } from "@prisma/client";

export async function getCommentList({
  userId,
  postId,

  offset = 0,
  limit = 50,
}: {
  userId: User["id"];
  postId: string;

  offset?: number;
  limit?: number;
}): Promise<PostComment[]> {
  const where: { [key: string]: any } = { deleted: false };

  if (postId) where.postId = postId;

  return await prisma.postComment.findMany({
    include: {
      author: true,
      post: !postId, // we are prob too clever here
    },
    where,
    orderBy: {
      createdAt: "asc",
    },
    skip: offset,
    take: limit,
  });
}

export async function countCommentsForPosts({
  userId,
  postList,
}: {
  userId: User["id"];
  postList: Post[];
}): Promise<{
  [postId: string]: number;
}> {
  const postIds = postList.map((p) => p.id);
  const counts = await prisma.postComment.groupBy({
    by: ["postId"],
    where: {
      deleted: false,
      postId: { in: postIds },
    },
    _count: {
      postId: true,
    },
  });

  const results: {
    [postId: string]: number;
  } = {};
  postIds.forEach((pId) => (results[pId] = 0));
  counts.forEach((row) => {
    results[row.postId] = row._count.postId;
  });
  return results;
}

export async function announceComment(
  post: Post,
  comment: PostComment,
  parent?: PostComment,
) {
  const mailConfig = await prisma.categoryEmail.findMany({
    where: {
      categoryId: post.categoryId,
    },
  });
  notifyComment({ post, comment, parent, mailConfig });
}

export async function createComment({
  userId,
  postId,
  content,
  parentId = null,
}: {
  userId: User["id"];
  postId: Post["id"];
  content: string;
  parentId?: PostComment["id"];
}): Promise<PostComment | null> {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
    },
    include: {
      author: true,
      category: true,
    },
  });
  invariant(post, "post not found");

  if (post.allowComments && post.category.allowComments) {
    const parent = parentId
      ? await prisma.postComment.findFirst({
          where: { postId, id: parentId },
          include: { author: true },
        })
      : null;

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: userId,
        content,
        parentId: parent ? parent.id : null,
      },
      include: {
        author: true,
      },
    });

    announceComment(post, comment, parent);

    return comment;
  }
  return null;
}

export async function deleteComment({
  userId,
  id,
}: {
  userId: User["id"];
  id: Comment["id"];
}) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  const where: { [key: string]: any } = { id };
  if (!user.admin) where.authorId = userId;

  const comment = await prisma.postComment.findFirst({ where });
  invariant(comment, "comment not found");

  await prisma.postComment.update({
    where: { id },
    data: {
      deleted: true,
    },
  });
}
