import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/session.server";
import { paginate } from "~/lib/paginator";
import type { PaginatedResult } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import Table from "~/components/table";
import BooleanIcon from "~/components/boolean-icon";
import { getCategoryList } from "~/models/category.server";
import ButtonLink from "~/components/button-link";
import PageHeader from "~/components/page-header";

type LoaderData = {
  categoryListPaginated: Awaited<
    PaginatedResult<Awaited<ReturnType<typeof getCategoryList>>>
  >;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireAdmin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const categoryListPaginated = await paginate(
    getCategoryList,
    { userId: user.id },
    cursor
  );
  return json<LoaderData>({ categoryListPaginated });
};

export default function Index() {
  const { categoryListPaginated } = useLoaderData() as LoaderData;

  return (
    <div>
      <PageHeader>
        <h1>Categories</h1>
        <ButtonLink to="new">New Category</ButtonLink>
      </PageHeader>
      <Paginated
        data={categoryListPaginated}
        render={(result) => {
          return (
            <Table className="table-auto">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Restricted?</th>
                </tr>
              </thead>
              <tbody>
                {result.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <Link to={`${category.id}`}>{category.name}</Link>
                    </td>
                    <td>{category.slug}</td>
                    <td>
                      <BooleanIcon value={category.restricted} />
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
