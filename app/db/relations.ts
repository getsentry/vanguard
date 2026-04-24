import { relations } from "drizzle-orm";
import {
  categories,
  categoryEmails,
  categoryMetas,
  categorySlacks,
  feedToPost,
  feeds,
  postComments,
  postMetas,
  postReactions,
  postRevisions,
  postSubscriptions,
  posts,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(postComments),
  revisions: many(postRevisions),
  reactions: many(postReactions),
  subscriptions: many(postSubscriptions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
  revisions: many(postRevisions),
  slackConfig: many(categorySlacks),
  emailConfig: many(categoryEmails),
  metaConfig: many(categoryMetas),
}));

export const categorySlacksRelations = relations(categorySlacks, ({ one }) => ({
  category: one(categories, {
    fields: [categorySlacks.categoryId],
    references: [categories.id],
  }),
}));

export const categoryEmailsRelations = relations(categoryEmails, ({ one }) => ({
  category: one(categories, {
    fields: [categoryEmails.categoryId],
    references: [categories.id],
  }),
}));

export const categoryMetasRelations = relations(categoryMetas, ({ one }) => ({
  category: one(categories, {
    fields: [categoryMetas.categoryId],
    references: [categories.id],
  }),
}));

export const feedsRelations = relations(feeds, ({ many }) => ({
  feedToPost: many(feedToPost),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  revisions: many(postRevisions),
  meta: many(postMetas),
  comments: many(postComments),
  reactions: many(postReactions),
  subscriptions: many(postSubscriptions),
  feedToPost: many(feedToPost),
}));

export const postMetasRelations = relations(postMetas, ({ one }) => ({
  post: one(posts, { fields: [postMetas.postId], references: [posts.id] }),
}));

export const postRevisionsRelations = relations(postRevisions, ({ one }) => ({
  post: one(posts, {
    fields: [postRevisions.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postRevisions.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [postRevisions.categoryId],
    references: [categories.id],
  }),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(posts, {
    fields: [postReactions.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postReactions.authorId],
    references: [users.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postComments.authorId],
    references: [users.id],
  }),
  parent: one(postComments, {
    fields: [postComments.parentId],
    references: [postComments.id],
    relationName: "CommentChildren",
  }),
  children: many(postComments, { relationName: "CommentChildren" }),
}));

export const postSubscriptionsRelations = relations(postSubscriptions, ({ one }) => ({
  post: one(posts, {
    fields: [postSubscriptions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postSubscriptions.userId],
    references: [users.id],
  }),
}));

export const feedToPostRelations = relations(feedToPost, ({ one }) => ({
  feed: one(feeds, { fields: [feedToPost.A], references: [feeds.id] }),
  post: one(posts, { fields: [feedToPost.B], references: [posts.id] }),
}));
