import type { User, Post, Category, PostReaction } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";

export type { Category, Post, PostReaction, User } from "@prisma/client";

export interface PostQueryType extends Post {
  author: User;
  category: Category;
}

export async function getPost({
  id,
  userId,
}: Pick<Post, "id"> & {
  userId: User["id"];
}): Promise<PostQueryType | null> {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  return await prisma.post.findFirst({
    where: {
      OR: [
        { id, authorId: userId, deleted: false },
        { id, published: true, deleted: false },
        ...(user.admin ? [{ id }] : []),
      ],
    },
    include: {
      author: true,
      category: true,
    },
  });
}

export async function getPostList({
  userId,
  published,
  authorId,
  categoryId,
  query,
  offset = 0,
  limit = 50,
}: {
  userId: User["id"];
  published?: boolean | null;
  authorId?: User["id"];
  categoryId?: Category["id"];
  query?: string;
  offset: number;
  limit: number;
}): Promise<PostQueryType[]> {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  const where: { [key: string]: any } = { deleted: false };
  if (published !== undefined) {
    where.published = published;
  }
  if (!user.admin) where.authorId = userId;
  if (authorId) {
    where.AND = [...(where.AND || []), { authorId }];
  }
  if (categoryId) {
    where.AND = [...(where.AND || []), { categoryId }];
  }
  if (query !== undefined) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          {
            title: { search: query },
          },
          {
            content: { search: query },
          },
        ],
      },
    ];
  }

  return await prisma.post.findMany({
    where,
    // TODO(dcramer): would be nice to not require all of these
    select: {
      id: true,
      title: true,
      content: true,
      author: true,
      category: true,
      published: true,
      publishedAt: true,
      authorId: true,
      categoryId: true,
      deleted: true,
      createdAt: true,
      updatedAt: true,
    },
    skip: offset,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

export async function updatePost({
  id,
  userId,
  title,
  content,
  categoryId,
  published,
  deleted,
}: {
  id: Post["id"];
  userId: User["id"];
  title?: Post["title"];
  content?: Post["content"];
  categoryId?: Post["categoryId"];
  published?: Post["published"];
  deleted?: Post["deleted"];
}): Promise<Post> {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  const where: { [key: string]: any } = { id };
  if (!user.admin) {
    where.authorId = userId;
    where.deleted = false;
  }

  const post = await prisma.post.findFirst({
    where,
  });
  invariant(post, "post not found");

  const data: { [key: string]: any } = {};
  if (published !== undefined && published !== post.published)
    data.published = !!published;
  if (title !== undefined && title != post.title) data.title = title;
  if (content !== undefined && content != post.content) data.content = content;
  if (categoryId !== undefined && categoryId != post.categoryId)
    data.categoryId = categoryId;
  if (data.published && !post.publishedAt) data.publishedAt = new Date();

  if (user.admin || deleted) {
    if (deleted !== undefined && post.deleted != deleted)
      data.deleted = !!deleted;
  }

  data.revisions = {
    create: [
      {
        authorId: userId,
        title: data.title ?? post.title,
        content: data.content ?? post.content,
        categoryId: data.categoryId ?? post.categoryId,
      },
    ],
  };

  return prisma.post.update({
    where: {
      id,
    },
    data,
  });
}

export function createPost({
  userId,
  content,
  title,
  categoryId,
  published = false,
}: Pick<Post, "content" | "title"> & {
  userId: User["id"];
  published?: Post["published"];
  categoryId: Category["id"];
}): Promise<Post> {
  return prisma.post.create({
    data: {
      title,
      content,
      published,
      publishedAt: published ? new Date() : null,
      author: {
        connect: {
          id: userId,
        },
      },
      category: {
        connect: {
          id: categoryId,
        },
      },
      revisions: {
        create: [
          {
            authorId: userId,
            title,
            content,
            categoryId,
          },
        ],
      },
    },
  });
}

export async function deletePost({
  id,
  userId,
}: Pick<Post, "id"> & { userId: User["id"] }) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  const where: { [key: string]: any } = { id };
  if (!user.admin) where.authorId = userId;

  updatePost({
    id,
    userId,
    deleted: true,
  });

  // return await prisma.post.deleteMany({
  //   where,
  // });
}

export async function getReactionsForPosts({
  userId,
  postList,
}: {
  userId: User["id"];
  postList: Post[];
}) {
  const postIds = postList.map((p) => p.id);
  const reactionCounts = await prisma.postReaction.groupBy({
    by: ["emoji", "postId"],
    where: {
      postId: { in: postIds },
    },
    _count: {
      emoji: true,
    },
  });
  const userReactions = await prisma.postReaction.findMany({
    select: {
      emoji: true,
      postId: true,
    },
    where: {
      postId: { in: postIds },
      authorId: userId,
    },
  });
  const userReactionsByPost: { [postId: string]: Set<string> } = {};
  userReactions.forEach(({ emoji, postId }) => {
    if (!userReactionsByPost[postId]) userReactionsByPost[postId] = new Set();
    userReactionsByPost[postId].add(emoji);
  });

  const results: {
    [postId: string]: { emoji: string; total: number; user: boolean }[];
  } = {};
  postIds.forEach((pId) => (results[pId] = []));
  reactionCounts.forEach((row) => {
    results[row.postId].push({
      emoji: row.emoji,
      total: row._count.emoji,
      user: !!userReactionsByPost[row.postId]?.has(row.emoji),
    });
  });
  return results;
}

export async function togglePostReaction({
  postId,
  userId,
  emoji,
}: Pick<PostReaction, "postId" | "userId" | "emoji">) {
  try {
    await prisma.postReaction.create({
      data: { postId, authorId: userId, emoji },
    });
    return 1;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (e.code === "P2002") {
        await prisma.postReaction.deleteMany({
          where: { postId, authorId: userId, emoji },
        });
        return -1;
      }
    }
    throw e;
  }
}
