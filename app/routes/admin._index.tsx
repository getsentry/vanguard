import { Outlet } from "@remix-run/react";
import Link from "~/components/link";

export default function Index() {
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
