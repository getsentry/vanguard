import { eq } from "drizzle-orm";
import { db } from "~/db/client";
import {
  feedToPost,
  postRevisions,
  postSubscriptions,
  posts,
  users,
} from "~/db/schema";
import {
  createPost,
  getPost,
  getPostList,
  syndicatePost,
  updatePost,
} from "~/models/post.server";
import * as Fixtures from "~/lib/test/fixtures";

describe("getPost", () => {
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let otherAuthor: Awaited<ReturnType<typeof Fixtures.User>>;
  let admin: Awaited<ReturnType<typeof Fixtures.User>>;
  let category: Awaited<ReturnType<typeof Fixtures.Category>>;
  let otherUnpublishedPost: typeof posts.$inferSelect;
  let deletedPost: typeof posts.$inferSelect;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    category = await Fixtures.Category();
    await db.insert(posts).values({
      title: "Test",
      content: "**Content**",
      deleted: false,
      published: true,
      authorId: author.id,
      categoryId: category.id,
    });
    [otherUnpublishedPost] = await db
      .insert(posts)
      .values({
        title: "Foo",
        content: "**Bar**",
        published: false,
        deleted: false,
        authorId: otherAuthor.id,
        categoryId: category.id,
      })
      .returning();
    [deletedPost] = await db
      .insert(posts)
      .values({
        title: "Foo",
        content: "**Bar**",
        published: false,
        deleted: true,
        authorId: otherAuthor.id,
        categoryId: category.id,
      })
      .returning();
  });

  describe("an admin user", () => {
    beforeEach(async () => {
      admin = await db
        .insert(users)
        .values({ email: "admin@example.com", admin: true })
        .returning()
        .then((r) => r[0]);
    });

    test("can view deleted posts", async () => {
      const result = await getPost({ userId: admin.id, id: deletedPost.id });
      expect(result?.id).toBe(deletedPost.id);
    });
  });

  describe("a normal user", () => {
    test("can view a draft", async () => {
      const result = await getPost({
        userId: author.id,
        id: otherUnpublishedPost.id,
      });
      expect(result?.id).toBe(otherUnpublishedPost.id);
    });

    test("cannot view a draft with onlyPublished", async () => {
      const result = await getPost({
        userId: author.id,
        id: otherUnpublishedPost.id,
        onlyPublished: true,
      });
      expect(result).toBe(null);
    });

    test("cannot view deleted posts", async () => {
      const result = await getPost({ userId: author.id, id: deletedPost.id });
      expect(result).toBe(null);
    });
  });
});

describe("getPostList", () => {
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let otherAuthor: Awaited<ReturnType<typeof Fixtures.User>>;
  let admin: Awaited<ReturnType<typeof Fixtures.User>>;
  let category: Awaited<ReturnType<typeof Fixtures.Category>>;
  let post: typeof posts.$inferSelect;
  let otherUnpublishedPost: typeof posts.$inferSelect;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    category = await Fixtures.Category();
    [post] = await db
      .insert(posts)
      .values({
        title: "Test",
        content: "**Content**",
        deleted: false,
        published: true,
        authorId: author.id,
        categoryId: category.id,
      })
      .returning();
    [otherUnpublishedPost] = await db
      .insert(posts)
      .values({
        title: "Foo",
        content: "**Bar**",
        published: false,
        deleted: false,
        authorId: otherAuthor.id,
        categoryId: category.id,
      })
      .returning();
  });

  describe("an admin", () => {
    beforeEach(async () => {
      admin = await db
        .insert(users)
        .values({ email: "admin@example.com", admin: true })
        .returning()
        .then((r) => r[0]);
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
        const result = await getPostList({ userId: author.id, query: "Test" });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(post.id);
      });
      test("matches content", async () => {
        const result = await getPostList({
          userId: author.id,
          query: "Content",
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(post.id);
      });
      test("doesnt match everything", async () => {
        const result = await getPostList({
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
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let category: Awaited<ReturnType<typeof Fixtures.Category>>;

  beforeEach(async () => {
    author = await Fixtures.User();
    category = await Fixtures.Category();
  });

  it("creates a post", async () => {
    const post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
    });
    expect(post).toBeDefined();
    expect(post.title).toBe("test");
    expect(post.content).toBe("test content");
    // Verify no feed associations
    const feedLinks = await db
      .select()
      .from(feedToPost)
      .where(eq(feedToPost.B, post.id));
    expect(feedLinks.length).toBe(0);
  });

  test("creates default subscription", async () => {
    const post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test",
      title: "test",
    });
    const subs = await db
      .select()
      .from(postSubscriptions)
      .where(eq(postSubscriptions.postId, post.id));
    expect(subs.length).toBe(1);
    expect(subs[0].userId).toBe(author.id);
  });

  test("creates default revision", async () => {
    const post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
    });
    const revs = await db
      .select()
      .from(postRevisions)
      .where(eq(postRevisions.postId, post.id));
    expect(revs.length).toBe(1);
    expect(revs[0].content).toBe("test content");
    expect(revs[0].title).toBe("test");
  });

  it("creates feed links", async () => {
    const feed = await Fixtures.Feed();
    const post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
      feedIds: [feed.id],
    });
    expect(post).toBeDefined();
    const feedLinks = await db
      .select()
      .from(feedToPost)
      .where(eq(feedToPost.B, post.id));
    expect(feedLinks.length).toBe(1);
    expect(feedLinks[0].A).toBe(feed.id);
  });
});

describe("updatePost", () => {
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    post = await Fixtures.Post();
  });

  it("updates the title", async () => {
    const updatedPost = await updatePost({
      id: post.id,
      userId: post.authorId,
      title: "updates a post",
    });
    expect(updatedPost).toBeDefined();
    expect(updatedPost.title).toBe("updates a post");
  });

  it("adds feedIds", async () => {
    const feed = await Fixtures.Feed();
    await updatePost({
      id: post.id,
      userId: post.authorId,
      feedIds: [feed.id],
    });
    const feedLinks = await db
      .select()
      .from(feedToPost)
      .where(eq(feedToPost.B, post.id));
    expect(feedLinks.length).toBe(1);
    expect(feedLinks[0].A).toBe(feed.id);
  });

  it("removes feedIds", async () => {
    const feed = await Fixtures.Feed();
    // First add a feed
    await db.insert(feedToPost).values({ A: feed.id, B: post.id });
    await updatePost({
      id: post.id,
      userId: post.authorId,
      feedIds: [],
    });
    const feedLinks = await db
      .select()
      .from(feedToPost)
      .where(eq(feedToPost.B, post.id));
    expect(feedLinks.length).toBe(0);
    // Feed itself still exists
    const feedRow = await db.query.feeds.findFirst({
      where: (f, { eq }) => eq(f.id, feed.id),
    });
    expect(feedRow).toBeDefined();
  });
});

describe("syndicatePost", () => {
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let category: Awaited<ReturnType<typeof Fixtures.Category>>;
  let feed: Awaited<ReturnType<typeof Fixtures.Feed>>;

  beforeEach(async () => {
    author = await Fixtures.User();
    category = await Fixtures.Category();
    feed = await Fixtures.Feed({ webhookUrl: "https://example.com/notify" });
  });

  it("POSTs to webhookUrl", async () => {
    const post = await createPost({
      userId: author.id,
      categoryId: category.id,
      content: "test content",
      title: "test",
      feedIds: [feed.id],
    });

    const fetchSpy = vi.spyOn(global, "fetch");

    // syndicatePost expects a post object with feeds array
    await syndicatePost({ ...post, feeds: [feed] });

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toBeCalledWith("https://example.com/notify", {
      method: "POST",
    });
  });
});
