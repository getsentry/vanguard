import type { LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/session.server";

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
