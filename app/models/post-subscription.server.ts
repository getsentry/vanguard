import { eq, and } from "drizzle-orm";

import { db } from "~/db/client";
import { postSubscriptions, users } from "~/db/schema";

export type PostSubscription = typeof postSubscriptions.$inferSelect;

export async function hasSubscription({
  userId,
  postId,
}: {
  userId: string;
  postId: string;
}): Promise<boolean> {
  const sub = await db.query.postSubscriptions.findFirst({
    where: and(eq(postSubscriptions.userId, userId), eq(postSubscriptions.postId, postId)),
    columns: { id: true },
  });
  return !!sub;
}

export async function getSubscriptions({
  postId,
}: {
  postId: string;
}): Promise<(typeof users.$inferSelect)[]> {
  const subs = await db.query.postSubscriptions.findMany({
    where: eq(postSubscriptions.postId, postId),
    with: { user: true },
  });
  return subs.map((s) => s.user);
}

export async function createSubscription({
  userId,
  postId,
}: {
  userId: string;
  postId: string;
}): Promise<PostSubscription> {
  const existing = await db.query.postSubscriptions.findFirst({
    where: and(eq(postSubscriptions.userId, userId), eq(postSubscriptions.postId, postId)),
  });
  if (existing) return existing;

  const [sub] = await db.insert(postSubscriptions).values({ postId, userId }).returning();
  return sub;
}

export async function deleteSubscription({ userId, postId }: { userId: string; postId: string }) {
  await db
    .delete(postSubscriptions)
    .where(and(eq(postSubscriptions.userId, userId), eq(postSubscriptions.postId, postId)));
}
