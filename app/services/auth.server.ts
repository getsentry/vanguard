// Modified from https://github.com/pbteja1998/remix-auth-google to
// include `hd` prompt

// MIT License

// Copyright (c) 2022 Functional Software, Inc.
// Copyright (c) 2021 Sergio Xalambrí

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import type { User } from "~/models/user.server";
import type { PublicCurrentUser } from "~/models/user.server";
import { Authenticator } from "remix-auth";
import { redirect } from "react-router";

import { buildUrl } from "~/lib/http";
import { getCurrentUserById, upsertUser } from "~/models/user.server";
import { GoogleStrategy } from "~/lib/google-auth";
import { sessionStorage } from "~/services/session.server";
import { getPreviewUser, previewAutoLoginEnabled } from "~/services/preview-auto-login.server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_HD = process.env.GOOGLE_HD || undefined;

// Google OAuth is the sole authentication path. If its credentials are missing
// in production the app would deploy to a state where nobody can log in — fail
// loudly at boot instead of silently shipping a broken login page.
// Exception: Vercel Preview deploys with PREVIEW_AUTO_LOGIN=1 skip Google OAuth
// entirely (see preview-auto-login.server.ts), so creds are not required there.
if (
  process.env.NODE_ENV === "production" &&
  !previewAutoLoginEnabled &&
  (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_HD)
) {
  throw new Error(
    "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_HD must be set in production. " +
      "Google OAuth is the only supported login method, and GOOGLE_HD enforces workspace-domain restriction.",
  );
}

export const authenticator = new Authenticator<User>(sessionStorage);

/**
 * Exported for unit-testing only. Validates a Google profile against the
 * configured workspace domain and persists the user on success.
 */
export async function verifyGoogleProfile(
  profile: {
    id: string;
    emails: [{ value: string }];
    _json: { email_verified: boolean; hd?: string };
  },
  googleHd: string | undefined,
): Promise<User> {
  const email = profile.emails[0].value;

  // Enforce email_verified — reject unverified Google accounts.
  if (!profile._json.email_verified) {
    throw new Error(`Google account ${email} is not email-verified.`);
  }

  // Enforce workspace domain server-side. The hd OAuth hint is advisory;
  // any Google account that completes the flow would otherwise get a session.
  if (googleHd) {
    const returnedHd = profile._json.hd;
    const emailDomain = email.split("@")[1];
    if (returnedHd !== googleHd && emailDomain !== googleHd) {
      throw new Error(
        `Google account ${email} does not belong to the required workspace domain (${googleHd}).`,
      );
    }
  }

  return upsertUser({
    email,
    externalId: profile.id,
  });
}

authenticator.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: buildUrl("/auth/google/callback"),
      hd: GOOGLE_HD,
    },
    async ({ profile }) => {
      console.log(`Persisting user ${profile.emails[0].value}`);
      return verifyGoogleProfile(profile, GOOGLE_HD);
    },
  ),
  "google",
);

export async function getUserId(request: Request): Promise<string | undefined> {
  if (previewAutoLoginEnabled) return (await getPreviewUser()).id;
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return undefined;
  }
  return user.id;
}

export async function getUser(request: Request): Promise<PublicCurrentUser | undefined> {
  if (previewAutoLoginEnabled) return await getPreviewUser();
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return undefined;
  }

  return (await getCurrentUserById(user.id)) ?? undefined;
}

export async function requireUserId(request: Request): Promise<string> {
  if (previewAutoLoginEnabled) return (await getPreviewUser()).id;
  const user = await authenticator.isAuthenticated(request);
  if (!user) throw redirectToAuth({ request });
  return user.id;
}

export async function requireUser(request: Request): Promise<PublicCurrentUser> {
  if (previewAutoLoginEnabled) return await getPreviewUser();
  const user = await authenticator.isAuthenticated(request);
  if (!user) throw redirectToAuth({ request });
  const currentUser = await getCurrentUserById(user.id);
  if (!currentUser) throw redirectToAuth({ request });
  return currentUser;
}

export async function requireAdmin(request: Request): Promise<PublicCurrentUser> {
  if (previewAutoLoginEnabled) return await getPreviewUser();
  const user = await authenticator.isAuthenticated(request);
  if (!user) throw redirectToAuth({ request });
  const currentUser = await getCurrentUserById(user.id);
  if (!currentUser) throw redirectToAuth({ request });
  if (!currentUser.admin) throw redirect(`/403`);
  return currentUser;
}

export function redirectToAuth({ request }: { request: Request }) {
  const location = new URL(request.url);

  const redirectTo = location.pathname;

  return redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}
