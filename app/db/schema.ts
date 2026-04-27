import { createId } from "@paralleldrive/cuid2";
import { boolean, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  passwordHash: varchar("passwordHash", { length: 255 }),
  externalId: text("externalId").unique(),
  picture: text("picture"),
  email: text("email").notNull().unique(),
  name: text("name"),
  canPostRestricted: boolean("canPostRestricted").notNull().default(false),
  admin: boolean("admin").notNull().default(false),
  notifyReplies: boolean("notifyReplies").notNull().default(true),
});

export const categories = pgTable("Category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  deleted: boolean("deleted").notNull().default(false),
  restricted: boolean("restricted").notNull().default(false),
  colorHex: varchar("colorHex", { length: 7 }),
  allowComments: boolean("allowComments").notNull().default(true),
  defaultEmojis: text("defaultEmojis").array().notNull().default([]),
});

export const categorySlacks = pgTable("CategorySlack", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id),
  webhookUrl: text("webhookUrl").notNull(),
  username: text("username"),
  iconUrl: text("iconUrl"),
  channel: text("channel"),
});

export const categoryEmails = pgTable("CategoryEmail", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id),
  to: text("to").notNull(),
  subjectPrefix: text("subjectPrefix"),
});

export const categoryMetas = pgTable("CategoryMeta", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(false),
});

export const feeds = pgTable("Feed", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  restricted: boolean("restricted").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  url: text("url"),
  webhookUrl: text("webhookUrl"),
});

export const posts = pgTable("Post", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  publishedAt: timestamp("publishedAt").defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  published: boolean("published").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id),
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id),
  allowComments: boolean("allowComments").default(true),
});

export const postMetas = pgTable("PostMeta", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  postId: text("postId")
    .notNull()
    .references(() => posts.id),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export const postRevisions = pgTable("PostRevision", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  postId: text("postId")
    .notNull()
    .references(() => posts.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  categoryId: text("categoryId").references(() => categories.id),
});

export const postReactions = pgTable(
  "PostReaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    postId: text("postId")
      .notNull()
      .references(() => posts.id),
    authorId: text("authorId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    emoji: varchar("emoji", { length: 8 }).notNull(),
  },
  (t) => [unique().on(t.postId, t.authorId, t.emoji)],
);

export const postComments = pgTable("PostComment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  postId: text("postId")
    .notNull()
    .references(() => posts.id),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  deleted: boolean("deleted").notNull().default(false),
  content: text("content").notNull(),
  parentId: text("parentId"),
});

export const postSubscriptions = pgTable(
  "PostSubscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    postId: text("postId")
      .notNull()
      .references(() => posts.id),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [unique().on(t.postId, t.userId)],
);

export const feedToPost = pgTable("_FeedToPost", {
  A: text("A")
    .notNull()
    .references(() => feeds.id),
  B: text("B")
    .notNull()
    .references(() => posts.id),
});
