import type { LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdmin(request);

  return null;
};

export default function Index() {
  useLoaderData();

  return (
    <div>
      <h1>Admin</h1>
      <ul>
        <li>
          <Link to="./users">Users</Link>
        </li>
      </ul>
      <Outlet />
    </div>
  );
}
