// @ts-nocheck
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { db } from "~/db/client";
import { categories, feeds, postComments, posts, users } from "~/db/schema";

// Suffix faker output with a cuid to guarantee uniqueness across fixture calls
// (faker has a small word list and will collide within a single test run).
const uniq = (base: string) => `${base}-${createId().slice(0, 8)}`;

export const User = async ({ ...data } = {}) => {
  const rows = await db
    .insert(users)
    .values({
      name: faker.name.firstName(),
      email: faker.internet.email(),
      ...data,
    })
    .returning();
  return rows[0];
};

export const Category = async ({ ...data } = {}) => {
  const rows = await db
    .insert(categories)
    .values({
      name: uniq(faker.lorem.word()),
      slug: uniq(faker.lorem.slug()),
      ...data,
    })
    .returning();
  return rows[0];
};

export const Feed = async ({ ...data } = {}) => {
  const rows = await db
    .insert(feeds)
    .values({
      name: uniq(faker.lorem.word()),
      ...data,
    })
    .returning();
  return rows[0];
};

export const Post = async ({ ...data }: Record<string, any> = {}) => {
  if (!data.categoryId) data.categoryId = (await Category()).id;
  if (!data.authorId) data.authorId = (await User()).id;
  const rows = await db
    .insert(posts)
    .values({
      title: faker.lorem.words(3),
      content: faker.lorem.paragraphs(),
      deleted: false,
      published: true,
      ...data,
    })
    .returning();
  const post = rows[0];
  const authorRows = await db
    .select()
    .from(users)
    .where(eq(users.id, post.authorId));
  return { ...post, author: authorRows[0] ?? null };
};

export const PostComment = async ({ ...data }: Record<string, any> = {}) => {
  if (!data.postId) {
    const post = await Post();
    data.postId = post.id;
    if (!data.authorId) data.authorId = post.authorId;
  }
  if (!data.authorId) data.authorId = (await User()).id;

  const rows = await db
    .insert(postComments)
    .values({
      content: faker.lorem.paragraphs(),
      deleted: false,
      ...data,
    })
    .returning();
  const comment = rows[0];

  // Fetch author for compatibility with tests that expect comment.author
  const authorRows = await db
    .select()
    .from(users)
    .where(eq(users.id, comment.authorId));
  return { ...comment, author: authorRows[0] ?? null };
};
