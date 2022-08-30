import type { Category, Post, User } from "@prisma/client";
import { prisma } from "~/services/db.server";
import {
  countReactionsForPosts,
  getReactionsForPosts,
} from "~/models/post-reactions.server";

const THUMBSUP = "👍";
const HEART = "❤️";

describe("getReactionsForPosts", () => {
  let author: User;
  let otherAuthor: User;
  let category: Category;
  let post: Post;
  let otherUnpublishedPost: Post;

  beforeEach(async () => {
    author = await prisma.user.create({
      data: {
        email: "foo@example.com",
      },
    });
    otherAuthor = await prisma.user.create({
      data: {
        email: "bar@example.com",
      },
    });
    category = await prisma.category.create({
      data: {
        name: "Foo Category",
        slug: "foo-category",
      },
    });
    post = await prisma.post.create({
      data: {
        title: "Test",
        content: "**Content**",
        deleted: false,
        published: true,
        authorId: author.id,
        categoryId: category.id,
      },
    });
    otherUnpublishedPost = await prisma.post.create({
      data: {
        title: "Foo",
        content: "**Bar**",
        published: false,
        deleted: false,
        authorId: otherAuthor.id,
        categoryId: category.id,
      },
    });
    await prisma.postReaction.create({
      data: {
        postId: post.id,
        emoji: HEART,
        authorId: author.id,
      },
    });
    await prisma.postReaction.create({
      data: {
        postId: post.id,
        emoji: HEART,
        authorId: otherAuthor.id,
      },
    });
    await prisma.postReaction.create({
      data: {
        postId: post.id,
        emoji: THUMBSUP,
        authorId: otherAuthor.id,
      },
    });
  });

  test("returns reaction counts for single post", async () => {
    const result = await getReactionsForPosts({
      userId: author.id,
      postList: [post],
    });
    expect(result[post.id]).toBeDefined();
    expect(result[otherUnpublishedPost.id]).toBeUndefined();
    expect(result[post.id].length).toBe(2);
    result[post.id].sort((a, b) => b.total - a.total);
    const firstEmoji = result[post.id][0];
    expect(firstEmoji.emoji).toBe(HEART);
    expect(firstEmoji.total).toBe(2);
    expect(firstEmoji.user).toBe(true);

    const secondEmoji = result[post.id][1];
    expect(secondEmoji.emoji).toBe(THUMBSUP);
    expect(secondEmoji.total).toBe(1);
    expect(secondEmoji.user).toBe(false);
  });
});

describe("countReactionsForPosts", () => {
  let author: User;
  let otherAuthor: User;
  let category: Category;
  let post: Post;
  let otherUnpublishedPost: Post;

  beforeEach(async () => {
    author = await prisma.user.create({
      data: {
        email: "foo@example.com",
      },
    });
    otherAuthor = await prisma.user.create({
      data: {
        email: "bar@example.com",
      },
    });
    category = await prisma.category.create({
      data: {
        name: "Foo Category",
        slug: "foo-category",
      },
    });
    post = await prisma.post.create({
      data: {
        title: "Test",
        content: "**Content**",
        deleted: false,
        published: true,
        authorId: author.id,
        categoryId: category.id,
      },
    });
    otherUnpublishedPost = await prisma.post.create({
      data: {
        title: "Foo",
        content: "**Bar**",
        published: false,
        deleted: false,
        authorId: otherAuthor.id,
        categoryId: category.id,
      },
    });
    await prisma.postReaction.create({
      data: {
        postId: post.id,
        emoji: HEART,
        authorId: author.id,
      },
    });
    await prisma.postReaction.create({
      data: {
        postId: post.id,
        emoji: HEART,
        authorId: otherAuthor.id,
      },
    });
    await prisma.postReaction.create({
      data: {
        postId: post.id,
        emoji: THUMBSUP,
        authorId: otherAuthor.id,
      },
    });
  });

  test("returns reaction counts for single post", async () => {
    const result = await countReactionsForPosts({
      userId: author.id,
      postList: [post],
    });
    expect(result[post.id]).toBeDefined();
    expect(result[post.id]).toBe(3);
    expect(result[otherUnpublishedPost.id]).toBeUndefined();
  });

  test("returns reaction counts for multiple posts", async () => {
    const result = await countReactionsForPosts({
      userId: author.id,
      postList: [post, otherUnpublishedPost],
    });
    expect(result[post.id]).toBeDefined();
    expect(result[post.id]).toBe(3);
    expect(result[otherUnpublishedPost.id]).toBeDefined();
    expect(result[otherUnpublishedPost.id]).toBe(0);
  });
});
