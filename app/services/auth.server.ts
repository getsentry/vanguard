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
import { Authenticator } from "remix-auth";
import { redirect } from "react-router";

import { buildUrl } from "~/lib/http";
import { getUserById, upsertUser } from "~/models/user.server";
import { GoogleStrategy } from "~/lib/google-auth";
import { sessionStorage } from "~/services/session.server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_HD = process.env.GOOGLE_HD || undefined;

// Google OAuth is the sole authentication path. If its credentials are missing
// in production the app would deploy to a state where nobody can log in — fail
// loudly at boot instead of silently shipping a broken login page.
if (process.env.NODE_ENV === "production" && (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET)) {
  throw new Error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in production. Google OAuth is the only supported login method.",
  );
}

export const authenticator = new Authenticator<User>(sessionStorage);

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
      return upsertUser({
        email: profile.emails[0].value,
        externalId: profile.id,
      });
    },
  ),
  "google",
);

export async function getUserId(request: Request): Promise<string | undefined> {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return undefined;
  }
  return user.id;
}

export async function getUser(request: Request) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return undefined;
  }

  return await getUserById(user.id);
}

export async function requireUserId(request: Request): Promise<string> {
  const user = await authenticator.isAuthenticated(request);
  if (!user) throw redirectToAuth({ request });
  return user.id;
}

export async function requireUser(request: Request): Promise<User> {
  const user = await authenticator.isAuthenticated(request);
  if (!user) throw redirectToAuth({ request });
  return user;
}

export async function requireAdmin(request: Request): Promise<User> {
  const user = await authenticator.isAuthenticated(request);
  if (!user) throw redirectToAuth({ request });
  if (!user.admin) throw redirect(`/403`);
  return user;
}

export function redirectToAuth({ request }: { request: Request }) {
  const location = new URL(request.url);

  const redirectTo = location.pathname;

  return redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}
