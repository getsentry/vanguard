import type { LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import Link from "~/components/link";

import { requireAdmin } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request, context }) => {
  await requireAdmin(request, context);

  return null;
};

export default function Index() {
  useLoaderData();

  return (
    <div className="mb-6">
      <h1>Admin</h1>
      <ul className="list-disc ml-6">
        <li>
          <Link to="./categories">Categories</Link>
        </li>
        <li>
          <Link to="./comments">Comments</Link>
        </li>
        <li>
          <Link to="./posts">Posts</Link>
        </li>
        <li>
          <Link to="./feeds">Syndication Feeds</Link>
        </li>
        <li>
          <Link to="./users">Users</Link>
        </li>
      </ul>
      <Outlet />
    </div>
  );
}
