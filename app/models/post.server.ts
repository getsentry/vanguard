import type { User, Post, Category } from "@prisma/client";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";

export type { Post } from "@prisma/client";

export async function getPost({
  id,
  userId,
}: Pick<Post, "id"> & {
  userId: User["id"];
}) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  return await prisma.post.findFirst({
    where: {
      OR: [
        { id, authorId: userId },
        { id, published: true },
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
  offset = 0,
  limit = 50,
}: {
  userId: User["id"];
  published?: boolean | null;
  authorId?: User["id"];
  categoryId?: Category["id"];
  offset: number;
  limit: number;
}) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  const where: { [key: string]: any } = {};
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

  return await prisma.post.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      author: true,
      category: true,
      published: true,
      publishedAt: true,
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
}: {
  id: Post["id"];
  userId: User["id"];
  title?: Post["title"];
  content?: Post["content"];
  categoryId?: Post["categoryId"];
  published?: Post["published"];
}) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");

  const where: { [key: string]: any } = { id };
  if (!user.admin) where.authorId = userId;

  const post = await prisma.post.findFirst({
    where,
  });
  invariant(post, "post not found");

  const data: { [key: string]: any } = {};
  if (published !== undefined) data.published = !!published;
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (categoryId !== undefined) data.categoryId = categoryId;

  if (data.published && !post.publishedAt) data.publishedAt = new Date();

  return await prisma.post.update({
    where: {
      id,
    },
    data,
  });
}

export function createPost({
  content,
  title,
  categoryId,
  userId,
  published = false,
}: Pick<Post, "content" | "title"> & {
  published?: Post["published"];
  userId: User["id"];
  categoryId: Category["id"];
}) {
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

  return await prisma.post.deleteMany({
    where,
  });
}
