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

import type { User } from "@prisma/client";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import type { AppLoadContext } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { buildUrl } from "~/lib/http";
import {
  getUserByEmail,
  getUserById,
  upsertUser,
  verifyPassword,
} from "~/models/user.server";
import { GoogleStrategy } from "~/lib/google-auth";
import { sessionStorage } from "~/services/session.server";
import invariant from "tiny-invariant";
import config from "~/config";

export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get("email");
    const password = form.get("password");

    invariant(typeof email === "string", "email must be a string");
    invariant(email.length > 0, "email must not be empty");

    invariant(typeof password === "string", "password must be a string");
    invariant(password.length > 0, "password must not be empty");

    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }

    if (!verifyPassword({ user, password })) {
      return null;
    }

    return user;
  }),
  "user-pass",
);

authenticator.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: buildUrl("/auth/google/callback"),
      hd: config.GOOGLE_HD,
    },
    async ({ accessToken, refreshToken, extraParams, profile, ...params }) => {
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

export async function requireUserId(request: Request, context: AppLoadContext) {
  if (context.user) return context.user.id;

  throw redirectToAuth({ request });
}

export async function requireUser(request: Request, context: AppLoadContext) {
  if (context.user) return context.user;

  throw redirectToAuth({ request });
}

export async function requireAdmin(request: Request, context: AppLoadContext) {
  const user = context.user;
  if (!user) {
    throw redirectToAuth({ request });
  }
  if (!user.admin) {
    throw redirect(`/403`);
  }
  return user;
}

export function redirectToAuth({ request }: { request: Request }) {
  const location = new URL(request.url);

  const redirectTo = location.pathname;

  return redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}
