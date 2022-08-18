import { faker } from "@faker-js/faker";

import { prisma } from "~/db.server";

export const User = async ({ ...data } = {}) => {
  return await prisma.user.create({
    data: {
      name: faker.name.firstName(),
      email: faker.internet.email(),
      ...data,
    },
  });
};

export const Category = async ({ ...data } = {}) => {
  return await prisma.category.create({
    data: {
      name: faker.lorem.word(),
      slug: faker.lorem.slug(),
      ...data,
    },
  });
};

export const Post = async ({ ...data } = {}) => {
  if (!data.categoryId) data.categoryId = (await Category()).id;
  if (!data.authorId) data.authorId = (await User()).id;
  return await prisma.post.create({
    data: {
      title: faker.lorem.words(3),
      content: faker.lorem.paragraphs(),
      deleted: false,
      published: true,
      ...data,
    },
  });
};

export const PostComment = async ({ ...data } = {}) => {
  if (!data.postId) {
    const post = await Post();
    data.postId = post.id;

    if (!data.authorId) data.authorId = post.authorId;
  }
  if (!data.authorId) data.authorId = (await User()).id;

  return await prisma.postComment.create({
    data: {
      content: faker.lorem.paragraphs(),
      deleted: false,
      ...data,
    },
  });
};
