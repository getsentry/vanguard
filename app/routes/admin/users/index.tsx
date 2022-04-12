import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/session.server";
import { getUserList } from "~/models/user.server";
import { paginate, PaginatedResult } from "~/lib/paginator";
import Paginated from "~/components/paginated";

type LoaderData = {
  userListPaginated: Awaited<
    PaginatedResult<Awaited<ReturnType<typeof getUserList>>>
  >;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  await requireAdmin(request);
  const userListPaginated = await paginate(getUserList, {}, cursor, 1);
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
            <table>
              {result.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                </tr>
              ))}
            </table>
          );
        }}
      />
    </div>
  );
}
