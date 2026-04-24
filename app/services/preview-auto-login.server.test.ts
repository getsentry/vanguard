import { eq } from "drizzle-orm";
import { db } from "~/db/client";
import { users } from "~/db/schema";
import {
  getPreviewUser,
  previewAutoLoginEnabled,
} from "~/services/preview-auto-login.server";

describe("preview-auto-login", () => {
  describe("previewAutoLoginEnabled", () => {
    it("is disabled in the test environment", () => {
      // The test runner has neither VERCEL_ENV nor PREVIEW_AUTO_LOGIN set, so
      // the bypass must never activate here. If this ever flips to true we'd
      // be silently turning all tests into "the preview admin is logged in".
      expect(previewAutoLoginEnabled).toBe(false);
    });
  });

  describe("getPreviewUser", () => {
    const PREVIEW_EMAIL = "preview-admin@vanguard.local";

    it("creates a Preview Admin user on first call when none exists", async () => {
      // setup-test-env truncates all tables, so start from a clean slate.
      await db.delete(users);

      const user = await getPreviewUser();

      expect(user.email).toBe(PREVIEW_EMAIL);
      expect(user.name).toBe("Preview Admin");
      expect(user.admin).toBe(true);
      // Must have no externalId so a real Google sign-in cannot claim this row.
      expect(user.externalId).toBeNull();
    });

    it("returns the existing user on subsequent calls (idempotent)", async () => {
      await db.delete(users);

      const first = await getPreviewUser();
      const second = await getPreviewUser();

      expect(second.id).toBe(first.id);

      // Only one row exists in the database.
      const allPreviewRows = await db
        .select()
        .from(users)
        .where(eq(users.email, PREVIEW_EMAIL));
      expect(allPreviewRows).toHaveLength(1);
    });

    it("is race-safe under concurrent calls on an empty database", async () => {
      await db.delete(users);

      // Fire N concurrent getPreviewUser() calls. Without ON CONFLICT DO
      // NOTHING, the parallel inserts would race and one would throw a unique
      // constraint violation.
      const results = await Promise.all(
        Array.from({ length: 5 }, () => getPreviewUser()),
      );

      const ids = new Set(results.map((u) => u.id));
      expect(ids.size).toBe(1);

      const allPreviewRows = await db
        .select()
        .from(users)
        .where(eq(users.email, PREVIEW_EMAIL));
      expect(allPreviewRows).toHaveLength(1);
    });
  });
});
