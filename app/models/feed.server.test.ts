import type { Feed, User } from "@prisma/client";
import { prisma } from "~/services/db.server";
import { getFeed, getFeedList } from "~/models/feed.server";

describe("getFeedList", () => {
  let feed: Feed;
  let user: User;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: "foo@example.com",
      },
    });
    feed = await prisma.feed.create({
      data: {
        name: "Bar",
      },
    });
  });

  describe("query", () => {
    describe("with a normal user", () => {
      test("restricts query on name", async () => {
        let result = await getFeedList({
          userId: user.id,
          query: "foo",
        });
        expect(result.length).toBe(0);
      });

      test("matches name", async () => {
        let result = await getFeedList({
          userId: user.id,
          query: "bar",
        });
        expect(result.length).toBe(1);
        expect(result[0].id).toBe(feed.id);
      });
    });
  });
});

describe("getFeed", () => {
  let feed: Feed;

  beforeEach(async () => {
    feed = await prisma.feed.create({
      data: {
        name: "Bar",
      },
    });
  });

  test("matches id", async () => {
    let result = await getFeed({
      id: feed.id,
    });
    expect(result?.id).toBe(feed.id);
  });

  test("doesnt match with no params", async () => {
    let result = await getFeed({});
    expect(result).toBe(null);
  });
});
