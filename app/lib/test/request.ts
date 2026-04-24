import type {
  Session,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "react-router";

import { sessionStorage } from "~/services/session.server";
import { authenticator } from "~/services/auth.server";
import type { User } from "~/models/user.server";

/** Cast test arg objects to LoaderFunctionArgs/ActionFunctionArgs (suppresses RR7 unstable_url/unstable_pattern requirement in tests). */
export function loaderArgs(args: {
  request: Request;
  params?: Record<string, string>;
  context?: Record<string, unknown>;
}): LoaderFunctionArgs {
  return args as unknown as LoaderFunctionArgs;
}

export function actionArgs(args: {
  request: Request;
  params?: Record<string, string>;
  context?: Record<string, unknown>;
}): ActionFunctionArgs {
  return args as unknown as ActionFunctionArgs;
}

export const buildRequest = async (
  url: string,
  options: any,
  { user } = { user: null },
): Promise<Request> => {
  const session = await getMockUserSession(user);
  const cookie = await sessionStorage.commitSession(session);
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
  const session = await sessionStorage.getSession();

  if (user) {
    session.set(authenticator.sessionKey, user);
  }

  return session;
};
