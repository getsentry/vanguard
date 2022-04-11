import type { User, Post, Category } from "@prisma/client";
import invariant from "tiny-invariant";

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
    include: {
      author: true,
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

export async function updatePost({
  id,
  userId,
  published,
}: {
  id: Post["id"];
  userId: User["id"];
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

  return prisma.post.update({
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

  return prisma.post.deleteMany({
    where,
  });
}
