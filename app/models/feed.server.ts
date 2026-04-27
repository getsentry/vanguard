import { and, eq, ilike } from "drizzle-orm";

import { db } from "~/db/client";
import { feeds } from "~/db/schema";
import type { PublicCurrentUser } from "~/models/user.server";

export type Feed = typeof feeds.$inferSelect;
/** Loader-safe feed shape — excludes webhookUrl which is server-only. */
export type PublicFeed = Omit<Feed, "webhookUrl">;

export function getFeed({ id }: { id?: Feed["id"] }) {
  if (!id) return null;
  return db.query.feeds.findFirst({ where: eq(feeds.id, id) });
}

export async function getFeedList({
  user,
  includeRestricted = true,
  query,
  offset = 0,
  limit = 50,
}: {
  user: PublicCurrentUser;
  includeRestricted?: Feed["restricted"];
  query?: string | null;
  offset?: number;
  limit?: number;
}) {
  const conditions = [eq(feeds.deleted, false)];

  if (query) {
    conditions.push(ilike(feeds.name, `%${query}%`));
  }

  if (!includeRestricted && !user.canPostRestricted) {
    conditions.push(eq(feeds.restricted, false));
  }

  return db.query.feeds.findMany({
    where: and(...conditions),
    columns: { webhookUrl: false },
    limit,
    offset,
    orderBy: (f, { asc }) => asc(f.name),
  });
}
