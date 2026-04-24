import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "~/db/client";
import { categories, users } from "~/db/schema";

export type Category = typeof categories.$inferSelect;
export type User = typeof users.$inferSelect;

export function getCategory({
  id,
  slug,
}: {
  id?: Category["id"];
  slug?: Category["slug"];
}) {
  if (!id && !slug) return null;
  return db.query.categories.findFirst({
    where: and(
      id ? eq(categories.id, id) : undefined,
      slug ? eq(categories.slug, slug) : undefined,
    ),
    with: { metaConfig: true },
  });
}

export async function getCategoryList({
  userId,
  includeRestricted = true,
  query,
  offset = 0,
  limit = 50,
}: {
  userId: User["id"];
  includeRestricted?: Category["restricted"];
  query?: string | null;
  offset?: number;
  limit?: number;
}) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const canPostRestricted = user ? user.canPostRestricted : false;

  const conditions = [eq(categories.deleted, false)];

  if (query) {
    conditions.push(
      or(
        ilike(categories.name, `%${query}%`),
        ilike(categories.slug, `%${query}%`),
      )!,
    );
  }

  if (!includeRestricted && !canPostRestricted) {
    conditions.push(eq(categories.restricted, false));
  }

  return db.query.categories.findMany({
    where: and(...conditions),
    limit,
    offset,
    orderBy: (c, { asc }) => asc(c.name),
    with: {
      slackConfig: true,
      emailConfig: true,
      metaConfig: true,
    },
  });
}

export async function createCategory({
  slug,
  name,
}: {
  slug: Category["slug"];
  name: Category["name"];
}) {
  const [category] = await db
    .insert(categories)
    .values({ slug, name })
    .returning();
  return category;
}
