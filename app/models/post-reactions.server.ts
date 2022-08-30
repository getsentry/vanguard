import type { User, Post, PostReaction } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { prisma } from "~/services/db.server";

export type { PostReaction } from "@prisma/client";

export async function getReactionsForPosts({
  userId,
  postList,
}: {
  userId: User["id"];
  postList: Post[];
}): Promise<{
  [postId: string]: { emoji: string; total: number; user: boolean }[];
}> {
  const postIds = postList.map((p) => p.id);
  const reactionCounts = await prisma.postReaction.groupBy({
    by: ["emoji", "postId"],
    where: {
      postId: { in: postIds },
    },
    _count: {
      emoji: true,
    },
  });
  const userReactions = await prisma.postReaction.findMany({
    select: {
      emoji: true,
      postId: true,
    },
    where: {
      postId: { in: postIds },
      authorId: userId,
    },
  });
  const userReactionsByPost: { [postId: string]: Set<string> } = {};
  userReactions.forEach(({ emoji, postId }) => {
    if (!userReactionsByPost[postId]) userReactionsByPost[postId] = new Set();
    userReactionsByPost[postId].add(emoji);
  });

  const results: {
    [postId: string]: { emoji: string; total: number; user: boolean }[];
  } = {};
  postIds.forEach((pId) => (results[pId] = []));
  reactionCounts.forEach((row) => {
    results[row.postId].push({
      emoji: row.emoji,
      total: row._count.emoji,
      user: !!userReactionsByPost[row.postId]?.has(row.emoji),
    });
  });
  return results;
}

export async function countReactionsForPosts({
  userId,
  postList,
}: {
  userId: User["id"];
  postList: Post[];
}): Promise<{
  [postId: string]: number;
}> {
  const postIds = postList.map((p) => p.id);
  const reactionCounts = await prisma.postReaction.groupBy({
    by: ["postId"],
    where: {
      postId: { in: postIds },
    },
    _count: {
      postId: true,
    },
  });

  const results: {
    [postId: string]: number;
  } = {};
  postIds.forEach((pId) => (results[pId] = 0));
  reactionCounts.forEach((row) => {
    results[row.postId] = row._count.postId;
  });
  return results;
}

export async function togglePostReaction({
  postId,
  userId,
  emoji,
}: Pick<PostReaction, "postId" | "userId" | "emoji">) {
  try {
    await prisma.postReaction.create({
      data: { postId, authorId: userId, emoji },
    });
    return 1;
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (e.code === "P2002") {
        await prisma.postReaction.deleteMany({
          where: { postId, authorId: userId, emoji },
        });
        return -1;
      }
    }
    throw e;
  }
}
