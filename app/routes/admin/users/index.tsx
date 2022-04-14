import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/session.server";
import { getUserList } from "~/models/user.server";
import { paginate, PaginatedResult } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import Table from "~/components/table";
import BooleanIcon from "~/components/boolean-icon";

type LoaderData = {
  userListPaginated: Awaited<
    PaginatedResult<Awaited<ReturnType<typeof getUserList>>>
  >;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const userListPaginated = await paginate(getUserList, {}, cursor);
  return json<LoaderData>({ userListPaginated });
};

export default function Index() {
  const { userListPaginated } = useLoaderData() as LoaderData;

  return (
    <div>
      <h2>Users</h2>
      <Paginated
        data={userListPaginated}
        render={(result) => {
          return (
            <Table className="table-auto">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Admin?</th>
                </tr>
              </thead>
              <tbody>
                {result.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Link to={`/u/${author.email}`}>{user.email}</Link>
                    </td>
                    <td>{user.name}</td>
                    <td>
                      <BooleanIcon value={user.admin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          );
        }}
      />
    </div>
  );
}
