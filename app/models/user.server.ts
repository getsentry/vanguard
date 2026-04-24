import { compareSync, hashSync } from "bcrypt";
import { eq, ilike, or } from "drizzle-orm";
import invariant from "tiny-invariant";

import { db } from "~/db/client";
import { users } from "~/db/schema";

export type User = typeof users.$inferSelect;

export async function getUserById(id: User["id"]) {
  return db.query.users.findFirst({ where: eq(users.id, id) }) ?? null;
}

export async function getUserByExternalId(externalId: string) {
  return (
    db.query.users.findFirst({ where: eq(users.externalId, externalId) }) ??
    null
  );
}

export async function getUserByEmail(email: User["email"]) {
  return db.query.users.findFirst({ where: eq(users.email, email) }) ?? null;
}

export async function getUserList(
  {
    offset = 0,
    limit = 50,
    query,
  }: {
    offset?: number;
    limit?: number;
    query?: string | null;
  } = {
    offset: 0,
    limit: 50,
  },
) {
  return db.query.users.findMany({
    where: query
      ? or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))
      : undefined,
    limit,
    offset,
    orderBy: (u, { asc }) => asc(u.email),
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.email, email))
    .returning();
  return deleted;
}

export async function createUser({
  email,
  name,
  password,
  admin,
}: {
  email: User["email"];
  password?: string;
  name?: User["name"];
  admin?: User["admin"];
}) {
  const passwordHash = password ? hashSync(password, 8) : null;
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name, admin })
    .returning();
  return user;
}

export function verifyPassword({
  user,
  password,
}: {
  user: User;
  password: string;
}) {
  if (!user.passwordHash) return false;
  if (!compareSync(password, user.passwordHash)) return false;
  return true;
}

export async function changePassword({
  user,
  newPassword,
}: {
  user: User;
  newPassword: string;
}) {
  const passwordHash = hashSync(newPassword, 8);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, user.id));
  user.passwordHash = passwordHash;
  return user;
}

export async function upsertUser({
  email,
  externalId,
}: {
  email: User["email"];
  externalId: string;
}) {
  try {
    const [user] = await db
      .insert(users)
      .values({ email, externalId })
      .onConflictDoUpdate({
        target: users.externalId,
        set: { email },
      })
      .returning();
    return user;
  } catch {
    // handles a rare case where an externalId was not set for an existing email
    const [user] = await db
      .insert(users)
      .values({ email, externalId })
      .onConflictDoUpdate({
        target: users.email,
        set: { externalId },
      })
      .returning();
    return user;
  }
}

export async function updateUser({
  id,
  userId,
  admin,
  name,
  picture,
  canPostRestricted,
  notifyReplies,
}: {
  id: User["id"];
  userId: User["id"];
  admin?: User["admin"] | null;
  name?: User["name"] | null;
  picture?: User["picture"] | null;
  canPostRestricted?: User["canPostRestricted"] | undefined;
  notifyReplies?: User["notifyReplies"] | undefined;
}) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  invariant(user, "user not found");

  const data: Partial<typeof users.$inferInsert> = {};

  // admin only fields
  if (user.admin) {
    if (admin !== undefined && admin !== user.admin) data.admin = !!admin;
    if (
      canPostRestricted !== undefined &&
      canPostRestricted !== user.canPostRestricted
    )
      data.canPostRestricted = !!canPostRestricted;
  }

  if (name !== undefined && name !== user.name) data.name = name;
  if (picture !== undefined) data.picture = picture;
  if (notifyReplies !== undefined && notifyReplies !== user.notifyReplies)
    data.notifyReplies = !!notifyReplies;

  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return updated;
}
