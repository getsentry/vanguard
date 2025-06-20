import type { PostSubscription, User } from "@prisma/client";
import { prisma } from "~/services/db.server";

export type { PostSubscription } from "@prisma/client";

export async function hasSubscription({
  userId,
  postId,
}: {
  userId: PostSubscription["userId"];
  postId: PostSubscription["postId"];
}): Promise<boolean> {
  const sub = await prisma.postSubscription.findFirst({
    select: {
      id: true,
    },
    where: {
      userId,
      postId,
    },
  });
  return !!sub;
}

export async function getSubscriptions({
  postId,
}: {
  postId: PostSubscription["postId"];
}): Promise<User[]> {
  return (
    await prisma.postSubscription.findMany({
      select: {
        user: true,
      },
      where: {
        postId,
      },
    })
  ).map((ps) => ps.user);
}

export async function createSubscription({
  userId,
  postId,
}: {
  userId: PostSubscription["userId"];
  postId: PostSubscription["postId"];
}): Promise<PostSubscription> {
  return await prisma.postSubscription.upsert({
    where: {
      // lol what is this syntax?
      postId_userId: {
        postId,
        userId,
      },
    },
    update: {},
    create: {
      postId,
      userId,
    },
  });
}

export async function deleteSubscription({
  userId,
  postId,
}: {
  userId: PostSubscription["userId"];
  postId: PostSubscription["postId"];
}) {
  await prisma.postSubscription.deleteMany({
    where: {
      userId,
      postId,
    },
  });
}

export async function autoSubscribeIfEnabled({
  userId,
  postId,
}: {
  userId: PostSubscription["userId"];
  postId: PostSubscription["postId"];
}): Promise<void> {
  // Check if user has auto-subscribe enabled and isn't already subscribed
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      autoSubscribeComments: true,
    },
  });

  if (user?.autoSubscribeComments) {
    const existingSubscription = await hasSubscription({ userId, postId });
    if (!existingSubscription) {
      await createSubscription({ userId, postId });
    }
  }
}
