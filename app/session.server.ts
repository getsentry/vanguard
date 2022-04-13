import { createCookieSessionStorage, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { getUserById, upsertUser } from "~/models/user.server";
import { getIdentity } from "./lib/iap";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userId";

export async function getSession(request: Request) {
  const identity = await getIdentity(request);
  const cookie = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookie);
  if (!identity) {
    session.unset(USER_SESSION_KEY);
  } else if (!session.get(USER_SESSION_KEY)) {
    // TODO: upsert the user
    const user = await upsertUser({
      email: identity.email,
      name: identity.name,
    });
    session.set(USER_SESSION_KEY, user.id);
    request.headers.set("Cookie", await sessionStorage.commitSession(session));
  }

  return session;
}

export async function getUserId(request: Request): Promise<string | undefined> {
  const session = await getSession(request);
  if (!session) return undefined;
  const userId = session.get(USER_SESSION_KEY);
  return userId;
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
    throw redirect(`/401?${searchParams}`);
    // return await logout(request);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
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
