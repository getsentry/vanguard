import { eq, and, inArray, sql } from "drizzle-orm";

import { db } from "~/db/client";
import { postReactions } from "~/db/schema";

export type PostReaction = typeof postReactions.$inferSelect;

export async function getReactionsForPosts({
  userId,
  postList,
}: {
  userId: string;
  postList: { id: string }[];
}): Promise<{
  [postId: string]: { emoji: string; total: number; user: boolean }[];
}> {
  const postIds = postList.map((p) => p.id);

  const reactionCounts = await db
    .select({
      postId: postReactions.postId,
      emoji: postReactions.emoji,
      count: sql<number>`count(*)::int`,
    })
    .from(postReactions)
    .where(inArray(postReactions.postId, postIds))
    .groupBy(postReactions.postId, postReactions.emoji);

  const userReactions = await db
    .select({ emoji: postReactions.emoji, postId: postReactions.postId })
    .from(postReactions)
    .where(and(inArray(postReactions.postId, postIds), eq(postReactions.authorId, userId)));

  const userReactionsByPost: { [postId: string]: Set<string> } = {};
  userReactions.forEach(({ emoji, postId }) => {
    if (!userReactionsByPost[postId]) userReactionsByPost[postId] = new Set();
    userReactionsByPost[postId].add(emoji);
  });

  const results: { [postId: string]: { emoji: string; total: number; user: boolean }[] } = {};
  postIds.forEach((id) => (results[id] = []));
  reactionCounts.forEach((row) => {
    results[row.postId].push({
      emoji: row.emoji,
      total: row.count,
      user: !!userReactionsByPost[row.postId]?.has(row.emoji),
    });
  });
  return results;
}

export async function countReactionsForPosts({
  userId: _userId,
  postList,
}: {
  userId: string;
  postList: { id: string }[];
}): Promise<{ [postId: string]: number }> {
  const postIds = postList.map((p) => p.id);

  const reactionCounts = await db
    .select({ postId: postReactions.postId, count: sql<number>`count(*)::int` })
    .from(postReactions)
    .where(inArray(postReactions.postId, postIds))
    .groupBy(postReactions.postId);

  const results: { [postId: string]: number } = {};
  postIds.forEach((id) => (results[id] = 0));
  reactionCounts.forEach((row) => {
    results[row.postId] = row.count;
  });
  return results;
}

export async function togglePostReaction({
  postId,
  userId,
  emoji,
}: {
  postId: string;
  userId: string;
  emoji: string;
}): Promise<1 | -1> {
  const existing = await db.query.postReactions.findFirst({
    where: and(
      eq(postReactions.postId, postId),
      eq(postReactions.authorId, userId),
      eq(postReactions.emoji, emoji),
    ),
  });

  if (existing) {
    await db
      .delete(postReactions)
      .where(
        and(
          eq(postReactions.postId, postId),
          eq(postReactions.authorId, userId),
          eq(postReactions.emoji, emoji),
        ),
      );
    return -1;
  } else {
    await db.insert(postReactions).values({ postId, authorId: userId, emoji });
    return 1;
  }
}
