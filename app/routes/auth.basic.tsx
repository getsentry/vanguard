import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { authenticator } from "~/services/auth.server";
import { getSafeRedirect } from "~/services/session.server";
import config from "~/config";

export async function loader() {
  return redirect("/login");
}

export async function action({ request }: ActionFunctionArgs) {
  if (!config.USE_BASIC_LOGIN) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") as string | null;

  return authenticator.authenticate("user-pass", request, {
    successRedirect: getSafeRedirect(redirectTo ?? "/"),
    failureRedirect: "/login",
  });
}
