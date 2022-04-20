import type { User, Category } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Category } from "@prisma/client";

export function getCategory({
  id,
  slug,
}: {
  id?: Category["id"];
  slug?: Category["slug"];
}) {
  return prisma.category.findFirst({
    where: { id, slug },
  });
}

export async function getCategoryList({
  userId,
  includeRestricted = true,
  query,
}: {
  userId: User["id"];
  includeRestricted: Category["restricted"];
  query?: string | null;
}) {
  // userId is used to find categories
  const user = await prisma.user.findFirst({ where: { id: userId } });
  const canPostRestricted = user ? user.canPostRestricted : false;

  const where: { [key: string]: any } = {};
  if (query !== undefined) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          {
            name: { search: query },
          },
          {
            slug: { search: query },
          },
        ],
      },
    ];
  }
  if (!includeRestricted && !canPostRestricted) where.restricted = false;

  return await prisma.category.findMany({
    where,
    select: { id: true, name: true, slug: true, restricted: true },
    orderBy: { name: "asc" },
  });
}
