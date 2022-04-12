import type { User } from "@prisma/client";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserList(
  {
    offset,
    limit,
  }: {
    offset?: number;
    limit?: number;
  } = {
    offset: 0,
    limit: 50,
  }
) {
  return prisma.user.findMany({
    skip: offset,
    take: limit,
    orderBy: {
      email: "asc",
    },
  });
}

export async function createUser(email: User["email"], password: string) {
  return prisma.user.create({
    data: {
      email,
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function upsertUser({
  email,
  name,
}: {
  email: User["email"];
  name: User["name"];
}) {
  return await prisma.user.upsert({
    where: {
      email: email,
    },
    update: {
      name: name,
    },
    create: {
      name: name,
      email: email,
    },
  });
}
