import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "~/db/client";
import { categories, categoryMetas, users } from "~/db/schema";

export type Category = typeof categories.$inferSelect;
export type CategoryMeta = typeof categoryMetas.$inferSelect;
export type CategoryWithMeta = Category & { metaConfig: CategoryMeta[] };
export type User = typeof users.$inferSelect;

export async function getCategory({ id, slug }: { id?: Category["id"]; slug?: Category["slug"] }) {
  if (!id && !slug) return null;
  const result = await db.query.categories.findFirst({
    where: and(
      id ? eq(categories.id, id) : undefined,
      slug ? eq(categories.slug, slug) : undefined,
    ),
    with: { metaConfig: true },
  });
  return result ?? null;
}

export async function getCategoryList({
  user,
  includeRestricted = true,
  query,
  offset = 0,
  limit = 50,
}: {
  user: User;
  includeRestricted?: Category["restricted"];
  query?: string | null;
  offset?: number;
  limit?: number;
}) {
  const conditions = [eq(categories.deleted, false)];

  if (query) {
    conditions.push(
      or(ilike(categories.name, `%${query}%`), ilike(categories.slug, `%${query}%`))!,
    );
  }

  if (!includeRestricted && !user.canPostRestricted) {
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
  const [category] = await db.insert(categories).values({ slug, name }).returning();
  return category;
}
