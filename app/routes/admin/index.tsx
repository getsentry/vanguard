import type { LoaderFunction } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdmin(request);

  return null;
};

export default function Index() {
  useLoaderData();

  return (
    <div className="mb-6">
      <h1>Admin</h1>
      <ul className="list-disc ml-6">
        <li>
          <Link to="./categories" className="hover:underline">
            Categories
          </Link>
        </li>
        <li>
          <Link to="./comments" className="hover:underline">
            Comments
          </Link>
        </li>
        <li>
          <Link to="./posts" className="hover:underline">
            Posts
          </Link>
        </li>
        <li>
          <Link to="./feeds" className="hover:underline">
            Syndication Feeds
          </Link>
        </li>
        <li>
          <Link to="./users" className="hover:underline">
            Users
          </Link>
        </li>
      </ul>
      <Outlet />
    </div>
  );
}
