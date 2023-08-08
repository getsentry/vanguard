import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { authenticator } from "~/services/auth.server";
import { getSafeRedirect } from "~/services/session.server";

export const loader: LoaderFunction = () => redirect("/login");

export const action: ActionFunction = async ({ request }) => {
  let url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") as string | null;

  return authenticator.authenticate("user-pass", request, {
    successRedirect: getSafeRedirect(redirectTo ?? "/"),
    failureRedirect: "/login",
  });
};
