import { and, eq, ilike } from "drizzle-orm";

import { db } from "~/db/client";
import { feeds, users } from "~/db/schema";

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

export function getFeed({ id }: { id?: Feed["id"] }) {
  if (!id) return null;
  return db.query.feeds.findFirst({ where: eq(feeds.id, id) });
}

export async function getFeedList({
  userId,
  includeRestricted = true,
  query,
  offset = 0,
  limit = 50,
}: {
  userId: User["id"];
  includeRestricted?: Feed["restricted"];
  query?: string | null;
  offset?: number;
  limit?: number;
}) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const canPostRestricted = user ? user.canPostRestricted : false;

  const conditions = [eq(feeds.deleted, false)];

  if (query) {
    conditions.push(ilike(feeds.name, `%${query}%`));
  }

  if (!includeRestricted && !canPostRestricted) {
    conditions.push(eq(feeds.restricted, false));
  }

  return db.query.feeds.findMany({
    where: and(...conditions),
    limit,
    offset,
    orderBy: (f, { asc }) => asc(f.name),
  });
}
