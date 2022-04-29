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
  if (!id && !slug) return null;
  return prisma.category.findFirst({
    where: { id, slug },
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
            name: { contains: query, mode: "insensitive" },
          },
          {
            slug: { contains: query, mode: "insensitive" },
          },
        ],
      },
    ];
  }
  if (!includeRestricted && !canPostRestricted) where.restricted = false;

  return await prisma.category.findMany({
    where,
    skip: offset,
    take: limit,
    orderBy: { name: "asc" },
    include: {
      slackConfig: true,
      emailConfig: true,
    },
  });
}
