import { db } from "~/db/client";
import { feeds, users } from "~/db/schema";
import { getFeed, getFeedList } from "~/models/feed.server";

describe("getFeedList", () => {
  let feed: typeof feeds.$inferSelect;
  let user: typeof users.$inferSelect;

  beforeEach(async () => {
    const userRows = await db.insert(users).values({ email: "foo@example.com" }).returning();
    user = userRows[0];
    const feedRows = await db.insert(feeds).values({ name: "Bar" }).returning();
    feed = feedRows[0];
  });

  describe("query", () => {
    describe("with a normal user", () => {
      test("restricts query on name", async () => {
        const result = await getFeedList({ user, query: "foo" });
        expect(result.length).toBe(0);
      });

      test("matches name", async () => {
        const result = await getFeedList({ user, query: "bar" });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(feed.id);
      });
    });
  });
});

describe("getFeed", () => {
  let feed: typeof feeds.$inferSelect;

  beforeEach(async () => {
    const rows = await db.insert(feeds).values({ name: "Bar" }).returning();
    feed = rows[0];
  });

  test("matches id", async () => {
    const result = await getFeed({ id: feed.id });
    expect(result?.id).toBe(feed.id);
  });

  test("doesnt match with no params", async () => {
    const result = await getFeed({});
    expect(result).toBe(null);
  });
});
