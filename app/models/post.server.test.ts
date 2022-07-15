import type { Category, Post, User } from "@prisma/client";
import { prisma } from "~/db.server";
import { getPostList, getReactionsForPosts } from "~/models/post.server";

const THUMBSUP = "👍";
const HEART = "❤️";

describe("getPostList", () => {
  let author: User;
  let otherAuthor: User;
  let admin: User;
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
  });
  describe("an admin", () => {
    beforeEach(async () => {
      admin = await prisma.user.create({
        data: {
          email: "admin@example.com",
          admin: true,
        },
      });
    });

    describe("published", () => {
      test("can find unpublished posts of others", async () => {
        const result = await getPostList({
          userId: admin.id,
          published: false,
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(otherUnpublishedPost.id);
      });
    });
  });

  describe("a normal user", () => {
    describe("query", () => {
      test("matches title", async () => {
        let result = await getPostList({
          userId: author.id,
          query: "Test",
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(post.id);
      });
      test("matches content", async () => {
        let result = await getPostList({
          userId: author.id,
          query: "Content",
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(post.id);
      });
      test("doesnt match everything", async () => {
        let result = await getPostList({
          userId: author.id,
          query: "Fiction",
        });
        expect(result.length).toBe(0);
      });
    });

    describe("authorId", () => {
      test("matches", async () => {
        const result = await getPostList({
          userId: author.id,
          authorId: author.id,
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(post.id);
      });

      test("doesnt match everything", async () => {
        const result = await getPostList({
          userId: author.id,
          authorId: "invalid id",
        });
        expect(result.length).toBe(0);
      });
    });

    describe("categoryId", () => {
      test("matches", async () => {
        const result = await getPostList({
          userId: author.id,
          categoryId: category.id,
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(post.id);
      });

      test("doesnt match everything", async () => {
        const result = await getPostList({
          userId: author.id,
          categoryId: "invalid id",
        });
        expect(result.length).toBe(0);
      });
    });

    describe("published", () => {
      test("cannot find unpublished posts of others", async () => {
        const result = await getPostList({
          userId: author.id,
          published: false,
        });
        expect(result.length).toBe(0);
      });

      test("cannot find unpublished posts of themselves", async () => {
        const result = await getPostList({
          userId: otherAuthor.id,
          published: false,
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(otherUnpublishedPost.id);
      });
    });
  });
});

describe("getReactionsForPosts", () => {
  let author: User;
  let otherAuthor: User;
  let admin: User;
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
