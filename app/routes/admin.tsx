import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";

import { requireAdmin } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  return null;
}

export default function Index() {
  useLoaderData();

  return <Outlet />;
}
