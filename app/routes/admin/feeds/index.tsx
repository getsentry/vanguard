import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";
import { paginate } from "~/lib/paginator";
import type { PaginatedResult } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import Table from "~/components/table";
import BooleanIcon from "~/components/boolean-icon";
import { getFeedList } from "~/models/feed.server";
import ButtonLink from "~/components/button-link";
import PageHeader from "~/components/page-header";

type LoaderData = {
  feedListPaginated: Awaited<
    PaginatedResult<Awaited<ReturnType<typeof getFeedList>>>
  >;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireAdmin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const feedListPaginated = await paginate(
    getFeedList,
    { userId: user.id },
    cursor
  );
  return json<LoaderData>({ feedListPaginated });
};

export default function Index() {
  const { feedListPaginated } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader>
        <h1>Syndication Feeds</h1>
        <ButtonLink to="new" mode="primary">
          New Feed
        </ButtonLink>
      </PageHeader>
      <Paginated
        data={feedListPaginated}
        render={(result) => {
          return (
            <Table className="table-auto">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Restricted?</th>
                </tr>
              </thead>
              <tbody>
                {result.map((feed) => (
                  <tr key={feed.id}>
                    <td>
                      <Link to={`${feed.id}`}>{feed.name}</Link>
                    </td>
                    <td>
                      <BooleanIcon value={feed.restricted} />
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
