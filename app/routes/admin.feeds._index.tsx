import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { requireAdmin } from "~/services/auth.server";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import BooleanIcon from "~/components/boolean-icon";
import { getFeedList } from "~/models/feed.server";
import PageHeader from "~/components/page-header";
import Button from "~/components/button";
import Link from "~/components/link";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const feedListPaginated = await paginate(
    getFeedList,
    { userId: user.id },
    cursor,
  );
  return { feedListPaginated };
}

export default function Index() {
  const { feedListPaginated } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader title="Syndication Feeds">
        <Button as={Link} to="new" mode="primary">
          New Feed
        </Button>
      </PageHeader>
      <Paginated
        data={feedListPaginated}
        render={(result) => {
          return (
            <table className="table table-auto">
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
            </table>
          );
        }}
      />
    </div>
  );
}
