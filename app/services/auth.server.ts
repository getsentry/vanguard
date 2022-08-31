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

import { buildUrl } from "~/lib/http";
import { upsertUser } from "~/models/user.server";
import { GoogleStrategy } from "~/lib/google-auth";
import { sessionStorage } from "~/services/session.server";
import { redirect } from "@remix-run/node";

export const authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: buildUrl("/auth/google/callback"),
      hd: process.env.GOOGLE_HD,
    },
    async ({ accessToken, refreshToken, extraParams, profile, ...params }) => {
      console.log(`Persisting user ${profile.emails[0].value}`);
      return upsertUser({
        email: profile.emails[0].value,
        externalId: profile.id,
      });
    }
  ),
  "google"
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
  return user;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: `/login?${searchParams}`,
  });
  return user.id;
}

export async function requireUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: `/login?${searchParams}`,
  });
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!user.admin) {
    throw redirect(`/403`);
  }

  return user;
}
