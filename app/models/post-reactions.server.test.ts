import { db } from "~/db/client";
import { categories, postReactions, posts, users } from "~/db/schema";
import {
  countReactionsForPosts,
  getReactionsForPosts,
} from "~/models/post-reactions.server";

const THUMBSUP = "👍";
const HEART = "❤️";

async function setupReactionFixtures() {
  const [author] = await db.insert(users).values({ email: "foo@example.com" }).returning();
  const [otherAuthor] = await db.insert(users).values({ email: "bar@example.com" }).returning();
  const [category] = await db.insert(categories).values({ name: "Foo Category", slug: "foo-category" }).returning();
  const [post] = await db.insert(posts).values({
    title: "Test",
    content: "**Content**",
    deleted: false,
    published: true,
    authorId: author.id,
    categoryId: category.id,
  }).returning();
  const [otherUnpublishedPost] = await db.insert(posts).values({
    title: "Foo",
    content: "**Bar**",
    published: false,
    deleted: false,
    authorId: otherAuthor.id,
    categoryId: category.id,
  }).returning();
  await db.insert(postReactions).values({ postId: post.id, emoji: HEART, authorId: author.id });
  await db.insert(postReactions).values({ postId: post.id, emoji: HEART, authorId: otherAuthor.id });
  await db.insert(postReactions).values({ postId: post.id, emoji: THUMBSUP, authorId: otherAuthor.id });
  return { author, otherAuthor, post, otherUnpublishedPost };
}

describe("getReactionsForPosts", () => {
  test("returns reaction counts for single post", async () => {
    const { author, post, otherUnpublishedPost } = await setupReactionFixtures();
    const result = await getReactionsForPosts({ userId: author.id, postList: [post] });
    expect(result[post.id]).toBeDefined();
    expect(result[otherUnpublishedPost.id]).toBeUndefined();
    expect(result[post.id].length).toBe(2);
    result[post.id].sort((a: any, b: any) => b.total - a.total);
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
  test("returns reaction counts for single post", async () => {
    const { author, post, otherUnpublishedPost } = await setupReactionFixtures();
    const result = await countReactionsForPosts({ userId: author.id, postList: [post] });
    expect(result[post.id]).toBeDefined();
    expect(result[post.id]).toBe(3);
    expect(result[otherUnpublishedPost.id]).toBeUndefined();
  });

  test("returns reaction counts for multiple posts", async () => {
    const { author, post, otherUnpublishedPost } = await setupReactionFixtures();
    const result = await countReactionsForPosts({ userId: author.id, postList: [post, otherUnpublishedPost] });
    expect(result[post.id]).toBeDefined();
    expect(result[post.id]).toBe(3);
    expect(result[otherUnpublishedPost.id]).toBeDefined();
    expect(result[otherUnpublishedPost.id]).toBe(0);
  });
});
