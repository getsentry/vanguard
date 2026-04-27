/**
 * Preview Auto-Login
 *
 * On Vercel Preview deployments we can safely skip Google OAuth entirely,
 * because Vercel's Deployment Protection already gates every preview URL
 * behind Sentry team SSO — the Lambda doesn't even run for unauthenticated
 * viewers. App-level auth becomes redundant there.
 *
 * When `PREVIEW_AUTO_LOGIN=1` is set AND `VERCEL_ENV === "preview"`, the
 * auth helpers in `auth.server.ts` short-circuit and impersonate a seeded
 * "Preview User" — a regular non-admin account, so reviewers see the app
 * the way an everyday user does (no admin-only routes, no elevated
 * capabilities). This turns every preview URL into a zero-click
 * walk-through.
 *
 * SAFETY:
 * - The bypass activates only when BOTH conditions are true at boot.
 * - If `PREVIEW_AUTO_LOGIN=1` is ever present in a production runtime the
 *   module throws at import time and refuses to boot — a belt-and-braces
 *   guard against accidental misconfiguration.
 * - Local dev (`VERCEL_ENV` unset) and tests are unaffected; they follow
 *   the normal Google OAuth flow.
 */
import { eq } from "drizzle-orm";
import { db } from "~/db/client";
import { users } from "~/db/schema";
import type { PublicCurrentUser } from "~/models/user.server";

const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
const FLAG = process.env.PREVIEW_AUTO_LOGIN === "1";

// Belt-and-braces: even if a misconfigured env var slips into production,
// refuse to boot rather than silently shipping an auth bypass.
if (process.env.VERCEL_ENV === "production" && FLAG) {
  throw new Error("PREVIEW_AUTO_LOGIN must not be set in production. Refusing to boot.");
}

export const previewAutoLoginEnabled = IS_PREVIEW && FLAG;

// A `.local` TLD is reserved (RFC 6762) and will never collide with a real
// Google Workspace email, so this user can never be claimed by a Google
// sign-in. No `externalId` is set for the same reason.
const PREVIEW_USER_EMAIL = "preview-user@vanguard.local";

/**
 * Fetch (or create) the seeded Preview User. Idempotent and race-safe
 * across concurrent cold starts on a fresh Neon branch. The user is
 * intentionally a regular (non-admin) account so previews exercise the
 * default reviewer experience.
 */
export async function getPreviewUser(): Promise<PublicCurrentUser> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, PREVIEW_USER_EMAIL),
    columns: { passwordHash: false, externalId: false },
  });
  if (existing) return existing;

  // Race-safe bootstrap: two concurrent requests on a fresh DB would both
  // see no existing row; ON CONFLICT DO NOTHING lets the second INSERT
  // fall through instead of raising a unique-constraint error. `admin`
  // and `canPostRestricted` default to false in the schema, so omitting
  // them keeps this account intentionally unprivileged.
  await db
    .insert(users)
    .values({
      email: PREVIEW_USER_EMAIL,
      name: "Preview User",
    })
    .onConflictDoNothing({ target: users.email });

  const user = await db.query.users.findFirst({
    where: eq(users.email, PREVIEW_USER_EMAIL),
    columns: { passwordHash: false, externalId: false },
  });
  if (!user) {
    throw new Error("Failed to create preview user");
  }
  return user;
}
