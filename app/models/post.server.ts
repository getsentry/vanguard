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
  deleted,
}: {
  id: Post["id"];
  userId: User["id"];
  title?: Post["title"];
  content?: Post["content"];
  categoryId?: Post["categoryId"];
  published?: Post["published"];
  deleted?: Post["deleted"];
}) {
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
