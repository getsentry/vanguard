import { Category, User } from "@prisma/client";
import { prisma } from "~/db.server";
import { getCategory, getCategoryList } from "~/models/category.server";

describe("getCategoryList", () => {
  let category: Category;
  let user: User;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: "foo@example.com",
      },
    });
    category = await prisma.category.create({
      data: {
        name: "Bar",
        slug: "foo",
      },
    });
  });

  describe("query", () => {
    describe("with a normal user", () => {
      test("matches slug", async () => {
        let result = await getCategoryList({
          userId: user.id,
          query: "foo",
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(category.id);
      });
      test("matches name", async () => {
        let result = await getCategoryList({
          userId: user.id,
          query: "bar",
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(category.id);
      });
      test("doesnt match everything", async () => {
        let result = await getCategoryList({
          userId: user.id,
          query: "baz",
        });
        expect(result.length).toBe(0);
      });
    });
  });
});

describe("getCategory", () => {
  let category: Category;

  beforeEach(async () => {
    category = await prisma.category.create({
      data: {
        name: "Bar",
        slug: "foo",
      },
    });
  });

  test("matches id", async () => {
    let result = await getCategory({
      id: category.id,
    });
    expect(result?.id).toBe(category.id);
  });

  test("matches slug", async () => {
    let result = await getCategory({
      slug: category.slug,
    });
    expect(result?.id).toBe(category.id);
  });

  test("doesnt match with invalid id", async () => {
    let result = await getCategory({ id: "invalid id" });
    expect(result).toBe(null);
  });

  test("doesnt match with invalid slug", async () => {
    let result = await getCategory({ slug: "invalid slug" });
    expect(result).toBe(null);
  });

  test("doesnt match with no params", async () => {
    let result = await getCategory({});
    expect(result).toBe(null);
  });
});
