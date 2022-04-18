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
}: {
  userId: User["id"];
  includeRestricted: Category["restricted"];
}) {
  // userId is used to find categories
  const user = await prisma.user.findFirst({ where: { id: userId } });
  const canPostRestricted = user ? user.canPostRestricted : false;
  return await prisma.category.findMany({
    where:
      !includeRestricted && !canPostRestricted
        ? { restricted: false }
        : undefined,
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}
