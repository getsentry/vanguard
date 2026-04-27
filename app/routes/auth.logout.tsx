import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { logout } from "~/services/session.server";

export async function loader() {
  return redirect("/");
}

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}
