import { db } from "~/db/client";
import { categories, users } from "~/db/schema";
import { getCategory, getCategoryList } from "~/models/category.server";

describe("getCategoryList", () => {
  let category: typeof categories.$inferSelect;
  let user: typeof users.$inferSelect;

  beforeEach(async () => {
    const userRows = await db.insert(users).values({ email: "foo@example.com" }).returning();
    user = userRows[0];
    const catRows = await db.insert(categories).values({ name: "Bar", slug: "foo" }).returning();
    category = catRows[0];
  });

  describe("query", () => {
    describe("with a normal user", () => {
      test("matches slug", async () => {
        const result = await getCategoryList({ userId: user.id, query: "foo" });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(category.id);
      });
      test("matches name", async () => {
        const result = await getCategoryList({ userId: user.id, query: "bar" });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(category.id);
      });
      test("doesnt match everything", async () => {
        const result = await getCategoryList({ userId: user.id, query: "baz" });
        expect(result.length).toBe(0);
      });
    });
  });
});

describe("getCategory", () => {
  let category: typeof categories.$inferSelect;

  beforeEach(async () => {
    const rows = await db.insert(categories).values({ name: "Bar", slug: "foo" }).returning();
    category = rows[0];
  });

  test("matches id", async () => {
    const result = await getCategory({ id: category.id });
    expect(result?.id).toBe(category.id);
  });

  test("matches slug", async () => {
    const result = await getCategory({ slug: category.slug });
    expect(result?.id).toBe(category.id);
  });

  test("doesnt match with invalid id", async () => {
    const result = await getCategory({ id: "invalid id" });
    expect(result).toBe(null);
  });

  test("doesnt match with invalid slug", async () => {
    const result = await getCategory({ slug: "invalid slug" });
    expect(result).toBe(null);
  });

  test("doesnt match with no params", async () => {
    const result = await getCategory({});
    expect(result).toBe(null);
  });
});
