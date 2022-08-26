import { createCookieSessionStorage, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { getUserById, upsertUser } from "~/models/user.server";
import { getIdentity } from "./lib/iap";

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

const USER_SESSION_KEY = "userId";

const USER_SESSION_EID_KEY = "userEId";

export async function getSession(request: Request) {
  // we are caching this as a quick workaround to ensure we prevent multiple upserts in hydration
  // could probably look at something like https://remix.run/docs/en/v1/other-api/adapter#createrequesthandler
  // to achieve this, though its certainly a lot more boilerplate and complexity
  if (request.hasOwnProperty("session")) {
    return request.session;
  }

  const identity = await getIdentity(request);
  const cookie = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookie);

  if (!identity) {
    session.unset(USER_SESSION_KEY);
  } else if (
    !session.get(USER_SESSION_KEY) ||
    session.get(USER_SESSION_EID_KEY) !== identity.id
  ) {
    console.log(`Persisting user ${identity.email}`);
    const user = await upsertUser({
      email: identity.email,
      externalId: identity.id,
    });
    session.set(USER_SESSION_KEY, user.id);
    session.set(USER_SESSION_EID_KEY, user.id);
  }
  Object.defineProperty(request, "session", {
    value: session,
    writable: false,
  });

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
