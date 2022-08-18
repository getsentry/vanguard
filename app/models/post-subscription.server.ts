import type { PostSubsription } from "@prisma/client";
import { prisma } from "~/db.server";

export type { PostComment } from "@prisma/client";

export async function hasSubscription({
  userId,
  postId,
}: {
  userId: PostSubscription["userId"];
  postId: PostSubscription["postId"];
}): Promise<PostSubsription> {
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

export async function createSubscription({
  userId,
  postId,
}: {
  userId: PostSubscription["userId"];
  postId: PostSubscription["postId"];
}): Promise<PostSubsription> {
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
