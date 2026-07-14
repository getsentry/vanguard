import { eq, ilike, isNotNull, or } from "drizzle-orm";
import invariant from "tiny-invariant";

import { db } from "~/db/client";
import { users } from "~/db/schema";

export type User = typeof users.$inferSelect;

/** Fields safe to embed in loader responses (never includes passwordHash / externalId). */
export type PublicUser = Pick<User, "id" | "email" | "name" | "picture">;

/**
 * Current-user shape returned by auth helpers to loaders.
 * Keeps admin / canPostRestricted / notifyReplies for client-side UI gating,
 * but drops passwordHash and externalId which must never reach the browser.
 */
export type PublicCurrentUser = Omit<User, "passwordHash" | "externalId">;

/**
 * Loader-safe current-user fetch — identical to getUserById but projects
 * out passwordHash and externalId before returning.
 */
export async function getCurrentUserById(id: User["id"]) {
  return (
    (await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { passwordHash: false, externalId: false },
    })) ?? null
  );
}

/** Drizzle column projection for public user fields. Use in `with: { author: { columns: PUBLIC_USER_COLUMNS } }`. */
export const PUBLIC_USER_COLUMNS = {
  id: true,
  email: true,
  name: true,
  picture: true,
  slackUserId: true,
} as const;

export async function getUserById(id: User["id"]) {
  return db.query.users.findFirst({ where: eq(users.id, id) }) ?? null;
}

export async function getUserByExternalId(externalId: string) {
  return db.query.users.findFirst({ where: eq(users.externalId, externalId) }) ?? null;
}

export async function getUserByEmail(email: User["email"]) {
  return db.query.users.findFirst({ where: eq(users.email, email) }) ?? null;
}

/**
 * Loader-safe variant — excludes passwordHash and externalId.
 * Use in loaders that display a user's profile to other users.
 */
export async function getPublicUserByEmail(email: User["email"]) {
  return (
    (await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { passwordHash: false, externalId: false },
    })) ?? null
  );
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
  const [deleted] = await db.delete(users).where(eq(users.email, email)).returning();
  return deleted;
}

export async function createUser({
  email,
  name,
  admin,
}: {
  email: User["email"];
  name?: User["name"];
  admin?: User["admin"];
}) {
  const [user] = await db.insert(users).values({ email, name, admin }).returning();
  return user;
}

export async function upsertUser({
  email,
  externalId,
}: {
  email: User["email"];
  externalId: string;
}) {
  // Bootstrap: the very first user to sign in via Google becomes admin. We scope
  // the check to users with an externalId so that placeholder rows inserted by
  // `pnpm db:seed` (which have no externalId and cannot log in) do not prevent
  // promotion. Existing authenticated users are never promoted/demoted here —
  // onConflictDoUpdate only touches email/externalId, so the admin flag on an
  // existing row is preserved.
  const firstAuthenticatedUser = await db.query.users.findFirst({
    where: isNotNull(users.externalId),
    columns: { id: true },
  });
  const admin = !firstAuthenticatedUser;

  try {
    const [user] = await db
      .insert(users)
      .values({ email, externalId, admin })
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
      .values({ email, externalId, admin })
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
  actor,
  admin,
  name,
  picture,
  canPostRestricted,
  notifyReplies,
}: {
  id: User["id"];
  /** The user performing the update — used for permission checks. */
  actor: PublicCurrentUser;
  admin?: User["admin"] | null;
  name?: User["name"] | null;
  picture?: User["picture"] | null;
  canPostRestricted?: User["canPostRestricted"] | undefined;
  notifyReplies?: User["notifyReplies"] | undefined;
  slackUserId?: User["slackUserId"] | null;
}) {
  // When the actor is editing their own row, we already have the latest copy.
  // Otherwise (admin editing another user) load the target so we can diff.
  const target = actor.id === id ? actor : await getUserById(id);
  invariant(target, "user not found");

  const data: Partial<typeof users.$inferInsert> = {};

  // admin only fields
  if (actor.admin) {
    if (admin !== undefined && admin !== target.admin) data.admin = !!admin;
    if (canPostRestricted !== undefined && canPostRestricted !== target.canPostRestricted)
      data.canPostRestricted = !!canPostRestricted;
  }

  if (name !== undefined && name !== target.name) data.name = name;
  if (picture !== undefined) data.picture = picture;
  if (notifyReplies !== undefined && notifyReplies !== target.notifyReplies)
    data.notifyReplies = !!notifyReplies;
  if (slackUserId !== undefined && slackUserId !== target.slackUserId)
    data.slackUserId = slackUserId || null;

  if (Object.keys(data).length === 0) {
    return target;
  }

  const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
  return updated;
}
