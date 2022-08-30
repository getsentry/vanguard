import { createCookieSessionStorage, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { getUserById } from "~/models/user.server";
import { authenticator } from "./auth.server";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    // maxAge: 0,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

export async function getUserId(request: Request): Promise<string | undefined> {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return undefined;
  }
  return user.id;

  // const session = await getSession(request);
  // if (!session) return undefined;
  // const userId = session.get(USER_SESSION_KEY);
  // return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    throw await logout(request);
  }
  return user;
}

export async function requireAdmin(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (!user) {
    throw await logout(request);
  }

  if (!user.admin) {
    throw redirect(`/403`);
  }

  return user;
}

export async function logout(request: Request, redirectTo: string = "/") {
  const session = await getSession(request);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
