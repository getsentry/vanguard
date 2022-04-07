import type { User, Category } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Category } from "@prisma/client";

export function getCategory({ id }: Pick<Category, "id">) {
  return prisma.category.findFirst({
    where: { id },
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
  return prisma.category.findMany({
    where: !includeRestricted ? { restricted: canPostRestricted } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
