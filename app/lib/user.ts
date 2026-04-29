/**
 * Returns a human-readable display name for a user, falling back to their
 * email address when no name is set. The `name` column is nullable in the
 * schema (users created via the basic-auth CLI or OAuth providers that
 * don't expose a profile name will have `name === null`), so call sites
 * that need to render an attribution should use this helper instead of
 * accessing `user.name` directly — otherwise nullable names render as
 * the literal string "null" in templates.
 */
export function getDisplayName(user: { name: string | null; email: string }): string {
  return user.name || user.email;
}
