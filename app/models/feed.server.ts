import type { User, Feed } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Feed } from "@prisma/client";

export function getFeed({ id }: { id?: Feed["id"] }) {
  if (!id) return null;
  return prisma.feed.findFirst({
    where: { id },
  });
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
  // userId is used to find categories
  const user = await prisma.user.findFirst({ where: { id: userId } });
  const canPostRestricted = user ? user.canPostRestricted : false;

  const where: { [key: string]: any } = { deleted: false };
  if (query !== undefined) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          {
            name: { contains: query, mode: "insensitive" },
          },
        ],
      },
    ];
  }
  if (!includeRestricted && !canPostRestricted) where.restricted = false;

  return await prisma.feed.findMany({
    where,
    skip: offset,
    take: limit,
    orderBy: { name: "asc" },
  });
}
