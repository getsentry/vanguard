import type { Post, User } from "@prisma/client";
import { prisma } from "~/db.server";
import { setDefaultTestIdentity, setTestIdentity } from "~/lib/__mocks__/iap";
import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";

import { action } from "./reactions";

const THUMBSUP = "👍";
const HEART = "❤️";

describe("POST /api/posts/$postId/reactions", () => {
  let author: User;
  let post: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: author.id,
    });
  });

  beforeEach(() => {
    setDefaultTestIdentity();
  });

  it("requires user", async () => {
    setTestIdentity(null);
    await expectRequiresUser(
      action({
        request: new Request(
          `http://localhost/api/posts/${post.id}/reactions`,
          {
            method: "POST",
          }
        ),
        params: { postId: post.id },
        context: {},
      })
    );
  });

  it("creates a new reaction", async () => {
    const response: Response = await action({
      request: new Request(`http://localhost/api/posts/${post.id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji: HEART }),
      }),
      params: { postId: post.id },
      context: {},
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.emoji).toBe(HEART);
    expect(data.delta).toBe(1);

    const reactions = await prisma.postReaction.findMany();
    expect(reactions.length).toEqual(1);
    const reaction = reactions[0];
    expect(reaction.postId).toBe(post.id);
    expect(reaction.emoji).toBe(HEART);
    expect(reaction.authorId).toBe(DefaultFixtures.DUMMY_USER.id);
  });

  it("deletes a new reaction that exists", async () => {
    await prisma.postReaction.create({
      data: {
        emoji: HEART,
        postId: post.id,
        authorId: DefaultFixtures.DUMMY_USER.id,
      },
    });

    const response: Response = await action({
      request: new Request(`http://localhost/api/posts/${post.id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji: HEART }),
      }),
      params: { postId: post.id },
      context: {},
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.emoji).toBe(HEART);
    expect(data.delta).toBe(-1);

    const reactions = await prisma.postReaction.findMany();
    expect(reactions.length).toEqual(0);
    const reaction = reactions[0];
  });

  it("does not delete differing emojis", async () => {
    await prisma.postReaction.create({
      data: {
        emoji: HEART,
        postId: post.id,
        authorId: DefaultFixtures.DUMMY_USER.id,
      },
    });

    const response: Response = await action({
      request: new Request(`http://localhost/api/posts/${post.id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ emoji: THUMBSUP }),
      }),
      params: { postId: post.id },
      context: {},
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.emoji).toBe(THUMBSUP);
    expect(data.delta).toBe(1);

    const reactions = await prisma.postReaction.findMany();
    expect(reactions.length).toEqual(2);
  });
});
