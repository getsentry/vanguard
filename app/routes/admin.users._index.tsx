import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";
import { getUserList } from "~/models/user.server";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import BooleanIcon from "~/components/boolean-icon";
import PageHeader from "~/components/page-header";
import Link from "~/components/link";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const userListPaginated = await paginate(getUserList, {}, cursor);
  return json({ userListPaginated });
}

export default function Index() {
  const { userListPaginated } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader title="Users" />
      <Paginated
        data={userListPaginated}
        render={(result) => {
          return (
            <table className="table table-auto">
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
                      <Link to={`/u/${user.email}`}>{user.email}</Link>
                    </td>
                    <td>{user.name}</td>
                    <td>
                      <BooleanIcon value={user.admin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }}
      />
    </div>
  );
}
