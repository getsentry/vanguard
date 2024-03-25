import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);

  return null;
}

export default function Index() {
  useLoaderData();

  return <Outlet />;
}
