import { eq } from "drizzle-orm";
import { db } from "~/db/client";
import { postComments } from "~/db/schema";
import {
  countCommentsForPosts,
  createComment,
  deleteComment,
  getCommentList,
} from "./post-comments.server";
import * as Fixtures from "~/lib/test/fixtures";

describe("getCommentList", () => {
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let otherAuthor: Awaited<ReturnType<typeof Fixtures.User>>;
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    post = await Fixtures.Post({ authorId: author.id });
    await db.insert(postComments).values({
      postId: post.id,
      authorId: author.id,
      content: "test",
    });
    await db.insert(postComments).values({
      postId: post.id,
      authorId: otherAuthor.id,
      content: "test2",
    });
    await db.insert(postComments).values({
      postId: post.id,
      authorId: author.id,
      content: "test3",
      deleted: true,
    });
  });

  test("for single post", async () => {
    const result = await getCommentList({ userId: author.id, postId: post.id });
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
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let otherAuthor: Awaited<ReturnType<typeof Fixtures.User>>;
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;
  let otherUnpublishedPost: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    author = await Fixtures.User();
    otherAuthor = await Fixtures.User();
    post = await Fixtures.Post({ authorId: author.id });
    otherUnpublishedPost = await Fixtures.Post({ authorId: otherAuthor.id });
    await db.insert(postComments).values({ content: "test", authorId: author.id, postId: post.id });
    await db
      .insert(postComments)
      .values({ content: "test 2", authorId: otherAuthor.id, postId: post.id });
  });

  test("returns counts for single post", async () => {
    const result = await countCommentsForPosts({ userId: author.id, postList: [post] });
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

describe("createComment", () => {
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    author = await Fixtures.User();
    post = await Fixtures.Post({ authorId: author.id });
  });

  test("without a parent", async () => {
    const comment = await createComment({
      userId: author.id,
      postId: post.id,
      content: "hello world!",
    });
    expect(comment?.authorId).toBe(author.id);
    expect(comment?.postId).toBe(post.id);
    expect(comment?.parentId).toBe(null);
    expect(comment?.deleted).toBe(false);
    expect(comment?.content).toBe("hello world!");
  });

  test("with a parent", async () => {
    const parent = await Fixtures.PostComment({ postId: post.id });
    const comment = await createComment({
      userId: author.id,
      postId: post.id,
      content: "hello world!",
      parentId: parent.id,
    });
    expect(comment?.authorId).toBe(author.id);
    expect(comment?.postId).toBe(post.id);
    expect(comment?.parentId).toBe(parent.id);
    expect(comment?.deleted).toBe(false);
    expect(comment?.content).toBe("hello world!");
  });
});

describe("deleteComment", () => {
  let author: Awaited<ReturnType<typeof Fixtures.User>>;
  let admin: Awaited<ReturnType<typeof Fixtures.User>>;
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    author = await Fixtures.User();
    admin = await Fixtures.User({ admin: true });
    const category = await Fixtures.Category();
    post = await Fixtures.Post({ authorId: author.id, categoryId: category.id });
  });

  test("can delete comment as admin", async () => {
    const [comment] = await db
      .insert(postComments)
      .values({ content: "test", authorId: author.id, postId: post.id })
      .returning();
    await deleteComment({ userId: admin.id, id: comment.id });
    const [newComment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, comment.id));
    expect(newComment?.deleted).toBe(true);
  });

  test("can delete comment as author", async () => {
    const [comment] = await db
      .insert(postComments)
      .values({ content: "test", authorId: author.id, postId: post.id })
      .returning();
    await deleteComment({ userId: author.id, id: comment.id });
    const [newComment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, comment.id));
    expect(newComment?.deleted).toBe(true);
  });

  test("cannot delete comment as non author", async () => {
    const [comment] = await db
      .insert(postComments)
      .values({ content: "test", authorId: admin.id, postId: post.id })
      .returning();
    try {
      await deleteComment({ userId: author.id, id: comment.id });
    } catch {}
    const [newComment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, comment.id));
    expect(newComment?.deleted).toBe(false);
  });
});
