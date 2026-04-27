import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { authenticator } from "~/services/auth.server";

export async function loader() {
  return redirect("/login");
}

export async function action({ request }: ActionFunctionArgs) {
  return authenticator.authenticate("google", request);
}
