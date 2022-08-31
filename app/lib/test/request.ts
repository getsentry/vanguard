import { Session } from "@remix-run/node";

import { commitSession, getSession } from "~/services/session.server";
import { authenticator } from "~/services/auth.server";
import { User } from "@prisma/client";

export const buildRequest = async (
  url: string,
  options: any,
  { user } = { user: null }
): Promise<Request> => {
  const session = await getMockUserSession(user);
  const cookie = await commitSession(session);
  const request = new Request(url, {
    headers: new Headers({
      Cookie: cookie,
      ...(options?.headers || {}),
    }),
    ...options,
  });
  return request;
};

const getMockUserSession = async (user: User | null): Promise<Session> => {
  const session = await getSession();

  if (user) {
    session.set(authenticator.sessionKey, user);
  }

  return session;
};
