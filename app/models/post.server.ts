import type { User, Post, Category } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Post } from "@prisma/client";

export function getPost({
  id,
  userId,
}: Pick<Post, "id"> & {
  userId: User["id"];
}) {
  return prisma.post.findFirst({
    where: {
      OR: [
        { id, authorId: userId },
        { id, published: true },
      ],
    },
  });
}

export function getPostList({
  userId,
  published = true,
  authorId,
}: {
  userId: User["id"];
  published?: boolean | null;
  authorId?: User["id"];
}) {
  const where: { [key: string]: any } = published
    ? {
        published,
      }
    : published === false
    ? { OR: [{ authorId: userId }, { published }] }
    : { authorId: userId };
  if (authorId) {
    where.AND = [...(where.AND || []), { authorId }];
  }

  return prisma.post.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      author: true,
      published: true,
    },
    orderBy: { updatedAt: "desc" },
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

export function deletePost({
  id,
  userId,
}: Pick<Post, "id"> & { userId: User["id"] }) {
  return prisma.post.deleteMany({
    where: { id, authorId: userId },
  });
}
