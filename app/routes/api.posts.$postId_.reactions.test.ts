// @ts-nocheck
import { db } from "~/db/client";
import { postReactions } from "~/db/schema";
import type { Post } from "~/models/post.server";
import type { User } from "~/models/user.server";
import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";

import { action } from "./api.posts.$postId_.reactions";
import { buildRequest } from "~/lib/test/request";

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

  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: await buildRequest(`http://localhost/api/posts/${post.id}/reactions`, {
          method: "POST",
        }),
        params: { postId: post.id },
        context: {},
      }),
    );
  });

  it("creates a new reaction", async () => {
    const response: Response = await action({
      request: await buildRequest(
        `http://localhost/api/posts/${post.id}/reactions`,
        { method: "POST", body: JSON.stringify({ emoji: HEART }) },
        { user: DefaultFixtures.DEFAULT_USER },
      ),
      params: { postId: post.id },
      context: { user: DefaultFixtures.DEFAULT_USER },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.emoji).toBe(HEART);
    expect(data.delta).toBe(1);

    const reactions = await db.select().from(postReactions);
    expect(reactions.length).toEqual(1);
    const reaction = reactions[0];
    expect(reaction.postId).toBe(post.id);
    expect(reaction.emoji).toBe(HEART);
    expect(reaction.authorId).toBe(DefaultFixtures.DEFAULT_USER.id);
  });

  it("deletes a new reaction that exists", async () => {
    await db.insert(postReactions).values({
      emoji: HEART,
      postId: post.id,
      authorId: DefaultFixtures.DEFAULT_USER.id,
    });

    const response: Response = await action({
      request: await buildRequest(
        `http://localhost/api/posts/${post.id}/reactions`,
        { method: "POST", body: JSON.stringify({ emoji: HEART }) },
        { user: DefaultFixtures.DEFAULT_USER },
      ),
      params: { postId: post.id },
      context: { user: DefaultFixtures.DEFAULT_USER },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.emoji).toBe(HEART);
    expect(data.delta).toBe(-1);

    const reactions = await db.select().from(postReactions);
    expect(reactions.length).toEqual(0);
  });

  it("does not delete differing emojis", async () => {
    await db.insert(postReactions).values({
      emoji: HEART,
      postId: post.id,
      authorId: DefaultFixtures.DEFAULT_USER.id,
    });

    const response: Response = await action({
      request: await buildRequest(
        `http://localhost/api/posts/${post.id}/reactions`,
        { method: "POST", body: JSON.stringify({ emoji: THUMBSUP }) },
        { user: DefaultFixtures.DEFAULT_USER },
      ),
      params: { postId: post.id },
      context: { user: DefaultFixtures.DEFAULT_USER },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.emoji).toBe(THUMBSUP);
    expect(data.delta).toBe(1);

    const reactions = await db.select().from(postReactions);
    expect(reactions.length).toEqual(2);
  });
});
