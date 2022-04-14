import type { User } from "@prisma/client";
import invariant from "tiny-invariant";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByExternalId(externalId: string) {
  return prisma.user.findUnique({ where: { externalId } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserList(
  {
    offset = 0,
    limit = 50,
  }: {
    offset: number;
    limit: number;
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

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function upsertUser({
  email,
  name,
  externalId,
}: {
  email: User["email"];
  name: User["name"];
  externalId: User["externalId"];
}) {
  return await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name,
      externalId,
    },
    create: {
      name,
      email,
      externalId,
    },
  });
}

export async function updateUser({
  id,
  userId,
  admin,
  canPostRestricted,
}: {
  id: User["id"];
  userId: User["id"];
  admin?: User["admin"];
  canPostRestricted?: User["canPostRestricted"];
}) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  invariant(user, "user not found");
  invariant(user.admin, "admin required");

  const data: { [key: string]: any } = {};
  if (admin !== undefined) data.admin = !!admin;
  if (canPostRestricted !== undefined)
    data.canPostRestricted = canPostRestricted;

  return await prisma.user.update({
    where: {
      id,
    },
    data,
  });
}
