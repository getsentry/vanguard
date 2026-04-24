import { and, eq } from "drizzle-orm";
import { db } from "~/db/client";
import { postSubscriptions } from "~/db/schema";
import {
  createSubscription,
  deleteSubscription,
  hasSubscription,
} from "./post-subscription.server";
import * as Fixtures from "~/lib/test/fixtures";

describe("hasSubscription", () => {
  let user: Awaited<ReturnType<typeof Fixtures.User>>;
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    const category = await Fixtures.Category();
    user = await Fixtures.User();
    post = await Fixtures.Post({ authorId: user.id, categoryId: category.id });
  });

  test("with subscription", async () => {
    await db.insert(postSubscriptions).values({ userId: user.id, postId: post.id });
    const result = await hasSubscription({ userId: user.id, postId: post.id });
    expect(result).toBe(true);
  });

  test("without subscription", async () => {
    const result = await hasSubscription({ userId: user.id, postId: post.id });
    expect(result).toBe(false);
  });
});

describe("createSubscription", () => {
  let user: Awaited<ReturnType<typeof Fixtures.User>>;
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    const category = await Fixtures.Category();
    user = await Fixtures.User();
    post = await Fixtures.Post({ authorId: user.id, categoryId: category.id });
  });

  test("with existing subscription", async () => {
    const [sub] = await db
      .insert(postSubscriptions)
      .values({ userId: user.id, postId: post.id })
      .returning();
    const result = await createSubscription({ userId: user.id, postId: post.id });
    expect(result?.id).toBe(sub.id);
  });

  test("without subscription", async () => {
    const result = await createSubscription({ userId: user.id, postId: post.id });
    expect(result?.userId).toBe(user.id);
    expect(result?.postId).toBe(post.id);
  });
});

describe("deleteSubscription", () => {
  let user: Awaited<ReturnType<typeof Fixtures.User>>;
  let post: Awaited<ReturnType<typeof Fixtures.Post>>;

  beforeEach(async () => {
    const category = await Fixtures.Category();
    user = await Fixtures.User();
    post = await Fixtures.Post({ authorId: user.id, categoryId: category.id });
  });

  test("with existing subscription", async () => {
    await db.insert(postSubscriptions).values({ userId: user.id, postId: post.id });
    await deleteSubscription({ userId: user.id, postId: post.id });
    const rows = await db
      .select()
      .from(postSubscriptions)
      .where(and(eq(postSubscriptions.userId, user.id), eq(postSubscriptions.postId, post.id)));
    expect(rows.length).toBe(0);
  });

  test("without subscription", async () => {
    await deleteSubscription({ userId: user.id, postId: post.id });
    const rows = await db
      .select()
      .from(postSubscriptions)
      .where(and(eq(postSubscriptions.userId, user.id), eq(postSubscriptions.postId, post.id)));
    expect(rows.length).toBe(0);
  });
});
