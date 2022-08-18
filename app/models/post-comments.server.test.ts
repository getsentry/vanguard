import type { Category, Post, User } from "@prisma/client";
import { prisma } from "~/db.server";
import {
  countCommentsForPosts,
  deleteComment,
  getCommentList,
} from "./post-comments.server";

import * as Fixtures from "~/lib/test/fixtures";

describe("getCommentList", () => {
  let author: User;
  let otherAuthor: User;
  let post: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: author.id,
    });
    await prisma.postComment.create({
      data: {
        postId: post.id,
        authorId: author.id,
        content: "test",
      },
    });
    await prisma.postComment.create({
      data: {
        postId: post.id,
        authorId: otherAuthor.id,
        content: "test2",
      },
    });
    await prisma.postComment.create({
      data: {
        postId: post.id,
        authorId: author.id,
        content: "test3",
        deleted: true,
      },
    });
  });

  test("for single post", async () => {
    const result = await getCommentList({
      userId: author.id,
      postId: post.id,
    });
    expect(result.length).toBe(2);
    const firstComment = result[0];
    expect(firstComment.authorId).toBe(author.id);
    expect(firstComment.content).toBe("test");

    const secondComment = result[1];
    expect(secondComment.authorId).toBe(otherAuthor.id);
    expect(secondComment.content).toBe("test2");
  });
});

describe("countCommentsForPosts", () => {
  let author: User;
  let otherAuthor: User;
  let post: Post;
  let otherUnpublishedPost: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: author.id,
    });
    otherUnpublishedPost = await Fixtures.Post({
      authorId: otherAuthor.id,
    });
    await prisma.postComment.create({
      data: {
        content: "test",
        authorId: author.id,
        postId: post.id,
      },
    });
    await prisma.postComment.create({
      data: {
        content: "test 2",
        authorId: otherAuthor.id,
        postId: post.id,
      },
    });
  });

  test("returns counts for single post", async () => {
    const result = await countCommentsForPosts({
      userId: author.id,
      postList: [post],
    });
    expect(result[post.id]).toBeDefined();
    expect(result[post.id]).toBe(2);
    expect(result[otherUnpublishedPost.id]).toBeUndefined();
  });

  test("returns counts for multiple posts", async () => {
    const result = await countCommentsForPosts({
      userId: author.id,
      postList: [post, otherUnpublishedPost],
    });
    expect(result[post.id]).toBeDefined();
    expect(result[post.id]).toBe(2);
    expect(result[otherUnpublishedPost.id]).toBeDefined();
    expect(result[otherUnpublishedPost.id]).toBe(0);
  });
});

describe("deleteComment", () => {
  let author: User;
  let admin: User;
  let category: Category;
  let post: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    admin = await Fixtures.User({ admin: true });
    category = await Fixtures.Category();
    post = await Fixtures.Post({
      authorId: author.id,
      categoryId: category.id,
    });
  });

  test("can delete comment as admin", async () => {
    const comment = await prisma.postComment.create({
      data: {
        content: "test",
        authorId: author.id,
        postId: post.id,
      },
    });
    await deleteComment({
      userId: admin.id,
      id: comment.id,
    });

    const newComment = await prisma.postComment.findFirst({
      where: { id: comment.id },
    });
    expect(newComment?.deleted).toBe(true);
  });

  test("can delete comment as author", async () => {
    const comment = await prisma.postComment.create({
      data: {
        content: "test",
        authorId: author.id,
        postId: post.id,
      },
    });
    await deleteComment({
      userId: author.id,
      id: comment.id,
    });

    const newComment = await prisma.postComment.findFirst({
      where: { id: comment.id },
    });
    expect(newComment?.deleted).toBe(true);
  });

  test("cannot delete comment as non author", async () => {
    const comment = await prisma.postComment.create({
      data: {
        content: "test",
        authorId: admin.id,
        postId: post.id,
      },
    });
    try {
      await deleteComment({
        userId: author.id,
        id: comment.id,
      });
    } catch (err) {}

    const newComment = await prisma.postComment.findFirst({
      where: { id: comment.id },
    });
    expect(newComment?.deleted).toBe(false);
  });
});
