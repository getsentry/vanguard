import type { User } from "@prisma/client";
import { prisma } from "~/db.server";
import { getUserList } from "~/models/user.server";

describe("getUserList", () => {
  let user: User;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: "foo@example.com",
        name: "Bar",
      },
    });
  });

  describe("query", () => {
    test("matches email", async () => {
      let result = await getUserList({
        query: "foo",
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(user.id);
    });
    test("matches name", async () => {
      let result = await getUserList({
        query: "bar",
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(user.id);
    });
    test("doesnt match everything", async () => {
      let result = await getUserList({
        query: "baz",
      });
      expect(result.length).toBe(0);
    });
  });
});
