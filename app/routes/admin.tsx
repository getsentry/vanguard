import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";

import { requireAdmin } from "~/services/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);

  return null;
}

export default function Index() {
  useLoaderData();

  return <Outlet />;
}
