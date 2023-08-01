import type { Category, Feed, Post, User } from "@prisma/client";
import { prisma } from "~/services/db.server";
import {
  createPost,
  getPost,
  getPostList,
  syndicatePost,
  updatePost,
} from "~/models/post.server";
import * as Fixtures from "~/lib/test/fixtures";

describe("getPost", () => {
  let author: User;
  let otherAuthor: User;
  let admin: User;
  let category: Category;
  let otherUnpublishedPost: Post;
  let deletedPost: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    category = await Fixtures.Category();
    await prisma.post.create({
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
    deletedPost = await prisma.post.create({
      data: {
        title: "Foo",
        content: "**Bar**",
        published: false,
        deleted: true,
        authorId: otherAuthor.id,
        categoryId: category.id,
      },
    });
  });

  describe("an admin user", () => {
    beforeEach(async () => {
      admin = await prisma.user.create({
        data: {
          email: "admin@example.com",
          admin: true,
        },
      });
    });

    test("can view deleted posts", async () => {
      let result = await getPost({
        userId: admin.id,
        id: deletedPost.id,
      });
      expect(result?.id).toBe(deletedPost.id);
    });
  });

  describe("a normal user", () => {
    test("can view a draft", async () => {
      let result = await getPost({
        userId: author.id,
        id: otherUnpublishedPost.id,
      });
      expect(result?.id).toBe(otherUnpublishedPost.id);
    });

    test("cannot view a draft with onlyPublished", async () => {
      let result = await getPost({
        userId: author.id,
        id: otherUnpublishedPost.id,
        onlyPublished: true,
      });
      expect(result).toBe(null);
    });

    test("cannot view deleted posts", async () => {
      let result = await getPost({
        userId: author.id,
        id: deletedPost.id,
      });
      expect(result).toBe(null);
    });
  });
});

describe("getPostList", () => {
  let author: User;
  let otherAuthor: User;
  let admin: User;
  let category: Category;
  let post: Post;
  let otherUnpublishedPost: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    category = await Fixtures.Category();
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

describe("createPost", () => {
  let author: User;
  let category: Category;

  beforeEach(async () => {
    author = await Fixtures.User();
    category = await Fixtures.Category();
  });

  it("creates a post", async () => {
    let post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
    });
    expect(post).toBeDefined();
    expect(post.title).toBe("test");
    expect(post.content).toBe("test content");
    expect(post.feeds.length).toBe(0);
  });

  test("creates default subscription", async () => {
    let post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test",
      title: "test",
    });
    const subs = await prisma.postSubscription.findMany({
      where: { postId: post.id },
    });
    expect(subs.length).toBe(1);
    expect(subs[0].userId).toBe(author.id);
  });

  test("creates default revision", async () => {
    let post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
    });
    const revs = await prisma.postRevision.findMany({
      where: { postId: post.id },
    });
    expect(revs.length).toBe(1);
    expect(revs[0].content).toBe("test content");
    expect(revs[0].title).toBe("test");
  });

  it("creates feed links", async () => {
    let feed = await Fixtures.Feed();
    let post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
      feedIds: [feed.id],
    });
    expect(post).toBeDefined();
    expect(post.feeds.length).toBe(1);
    expect(post.feeds[0].id).toBe(feed.id);
  });
});

describe("updatePost", () => {
  let post: Post;

  beforeEach(async () => {
    post = await Fixtures.Post();
  });

  it("updates the title", async () => {
    let updatedPost = await updatePost({
      id: post.id,
      userId: post.authorId,
      title: "updates a post",
    });
    expect(updatedPost).toBeDefined();
    expect(updatedPost.title).toBe("updates a post");
  });

  it("adds feedIds", async () => {
    let feed = await Fixtures.Feed();
    let updatedPost = await updatePost({
      id: post.id,
      userId: post.authorId,
      feedIds: [feed.id],
    });
    expect(updatedPost).toBeDefined();
    expect(updatedPost.feeds.length).toBe(1);
    expect(updatedPost.feeds[0].id).toBe(feed.id);
  });

  it("removes feedIds", async () => {
    let feed = await Fixtures.Feed();
    await prisma.post.update({
      where: { id: post.id },
      data: {
        feeds: {
          connect: [{ id: feed.id }],
        },
      },
    });
    let updatedPost = await updatePost({
      id: post.id,
      userId: post.authorId,
      feedIds: [],
    });
    expect(updatedPost).toBeDefined();
    expect(updatedPost.feeds.length).toBe(0);

    const newFeed = await prisma.feed.findFirst({
      where: { id: feed.id },
    });
    expect(newFeed).toBeDefined();
  });
});

describe("syndicatePost", () => {
  let author: User;
  let category: Category;
  let feed: Feed;

  beforeEach(async () => {
    author = await Fixtures.User();
    category = await Fixtures.Category();
    feed = await Fixtures.Feed({
      webhookUrl: "https://example.com/notify",
    });
  });

  it("POSTs to webhookUrl", async () => {
    let post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
      feedIds: [feed.id],
    });

    const fetchSpy = vi.spyOn(global, "fetch");

    await syndicatePost(post);

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toBeCalledWith("https://example.com/notify", {
      method: "POST",
    });
  });
});
