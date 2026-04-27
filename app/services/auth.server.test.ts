// @ts-nocheck
import { verifyGoogleProfile } from "~/services/auth.server";

function makeProfile(overrides: {
  email?: string;
  email_verified?: boolean;
  hd?: string;
  id?: string;
}) {
  const { email = "user@sentry.io", email_verified = true, hd, id = "google-123" } = overrides;
  return {
    id,
    emails: [{ value: email }],
    _json: { email_verified, hd },
  };
}

describe("verifyGoogleProfile", () => {
  describe("email_verified enforcement", () => {
    it("rejects an unverified Google account", async () => {
      const profile = makeProfile({ email_verified: false });
      await expect(verifyGoogleProfile(profile, undefined)).rejects.toThrow(
        "is not email-verified",
      );
    });

    it("accepts a verified account when GOOGLE_HD is not set", async () => {
      const profile = makeProfile({ email: "anyone@gmail.com", email_verified: true });
      const user = await verifyGoogleProfile(profile, undefined);
      expect(user.email).toBe("anyone@gmail.com");
    });
  });

  describe("workspace domain enforcement", () => {
    const GOOGLE_HD = "sentry.io";

    it("accepts a profile whose returned hd matches the configured domain", async () => {
      const profile = makeProfile({ email: "alice@sentry.io", hd: "sentry.io" });
      const user = await verifyGoogleProfile(profile, GOOGLE_HD);
      expect(user.email).toBe("alice@sentry.io");
    });

    it("accepts a profile whose email domain matches even if hd is missing", async () => {
      // Some Google setups don't return hd; fall back to email domain check.
      const profile = makeProfile({ email: "alice@sentry.io", hd: undefined });
      const user = await verifyGoogleProfile(profile, GOOGLE_HD);
      expect(user.email).toBe("alice@sentry.io");
    });

    it("rejects a profile whose hd does not match the configured domain", async () => {
      const profile = makeProfile({ email: "attacker@gmail.com", hd: "gmail.com" });
      await expect(verifyGoogleProfile(profile, GOOGLE_HD)).rejects.toThrow(
        "does not belong to the required workspace domain",
      );
    });

    it("accepts a profile whose hd matches the domain even if email domain differs (hd takes precedence)", async () => {
      // If the returned hd matches the configured workspace, we trust Google's
      // hd claim (it's signed in the ID token). Email domain is the fallback.
      const profile = makeProfile({ email: "service@custom.example", hd: "sentry.io" });
      const user = await verifyGoogleProfile(profile, GOOGLE_HD);
      expect(user.email).toBe("service@custom.example");
    });

    it("rejects a profile with no hd and a non-workspace email domain", async () => {
      const profile = makeProfile({ email: "outsider@gmail.com", hd: undefined });
      await expect(verifyGoogleProfile(profile, GOOGLE_HD)).rejects.toThrow(
        "does not belong to the required workspace domain",
      );
    });

    it("is a no-op when GOOGLE_HD is not configured (open instance)", async () => {
      const profile = makeProfile({ email: "anyone@gmail.com", hd: "gmail.com" });
      const user = await verifyGoogleProfile(profile, undefined);
      expect(user.email).toBe("anyone@gmail.com");
    });
  });
});
