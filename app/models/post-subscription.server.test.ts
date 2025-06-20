import type { Post, User } from "@prisma/client";
import { prisma } from "~/services/db.server";
import {
  createSubscription,
  deleteSubscription,
  hasSubscription,
  autoSubscribeIfEnabled,
} from "./post-subscription.server";

import * as Fixtures from "~/lib/test/fixtures";

describe("hasSubscription", () => {
  let user: User;
  let post: Post;

  beforeEach(async () => {
    const category = await Fixtures.Category();
    user = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: user.id,
      categoryId: category.id,
    });
  });

  test("with subscription", async () => {
    await prisma.postSubscription.create({
      data: {
        userId: user.id,
        postId: post.id,
      },
    });
    const result = await hasSubscription({
      userId: user.id,
      postId: post.id,
    });
    expect(result).toBe(true);
  });

  test("without subscription", async () => {
    const result = await hasSubscription({
      userId: user.id,
      postId: post.id,
    });
    expect(result).toBe(false);
  });
});

describe("createSubscription", () => {
  let user: User;
  let post: Post;

  beforeEach(async () => {
    const category = await Fixtures.Category();
    user = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: user.id,
      categoryId: category.id,
    });
  });

  test("with existing subscription", async () => {
    const sub = await prisma.postSubscription.create({
      data: {
        userId: user.id,
        postId: post.id,
      },
    });
    const result = await createSubscription({
      userId: user.id,
      postId: post.id,
    });
    expect(result?.id).toBe(sub.id);
  });

  test("without subscription", async () => {
    const result = await createSubscription({
      userId: user.id,
      postId: post.id,
    });
    expect(result?.userId).toBe(user.id);
    expect(result?.postId).toBe(post.id);
  });
});

describe("deleteSubscription", () => {
  let user: User;
  let post: Post;

  beforeEach(async () => {
    const category = await Fixtures.Category();
    user = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: user.id,
      categoryId: category.id,
    });
  });

  test("with existing subscription", async () => {
    await prisma.postSubscription.create({
      data: {
        userId: user.id,
        postId: post.id,
      },
    });
    await deleteSubscription({
      userId: user.id,
      postId: post.id,
    });
    const newSub = await prisma.postSubscription.findFirst({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });
    expect(newSub).toBeNull();
  });

  test("without subscription", async () => {
    await deleteSubscription({
      userId: user.id,
      postId: post.id,
    });
    const newSub = await prisma.postSubscription.findFirst({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });
    expect(newSub).toBeNull();
  });
});

describe("autoSubscribeIfEnabled", () => {
  let user: User;
  let post: Post;

  beforeEach(async () => {
    const category = await Fixtures.Category();
    user = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: user.id,
      categoryId: category.id,
    });
  });

  test("subscribes user when autoSubscribeComments is enabled", async () => {
    // Enable auto-subscribe for the user
    await prisma.user.update({
      where: { id: user.id },
      data: { autoSubscribeComments: true },
    });

    await autoSubscribeIfEnabled({
      userId: user.id,
      postId: post.id,
    });

    const subscription = await prisma.postSubscription.findFirst({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });
    expect(subscription).toBeDefined();
  });

  test("does not subscribe user when autoSubscribeComments is disabled", async () => {
    // Ensure auto-subscribe is disabled
    await prisma.user.update({
      where: { id: user.id },
      data: { autoSubscribeComments: false },
    });

    await autoSubscribeIfEnabled({
      userId: user.id,
      postId: post.id,
    });

    const subscription = await prisma.postSubscription.findFirst({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });
    expect(subscription).toBeNull();
  });

  test("does not create duplicate subscriptions", async () => {
    // Enable auto-subscribe for the user
    await prisma.user.update({
      where: { id: user.id },
      data: { autoSubscribeComments: true },
    });

    // Create an existing subscription
    await createSubscription({
      userId: user.id,
      postId: post.id,
    });

    await autoSubscribeIfEnabled({
      userId: user.id,
      postId: post.id,
    });

    const subscriptions = await prisma.postSubscription.findMany({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });
    expect(subscriptions.length).toBe(1);
  });
});
