import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { requireAdmin } from "~/services/auth.server";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import BooleanIcon from "~/components/boolean-icon";
import { getCategoryList } from "~/models/category.server";
import PageHeader from "~/components/page-header";
import Button from "~/components/button";
import Link from "~/components/link";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const categoryListPaginated = await paginate(
    getCategoryList,
    { userId: user.id },
    cursor,
  );
  return { categoryListPaginated };
}

export default function Index() {
  const { categoryListPaginated } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader title="Categories">
        <Button as={Link} to="new" mode="primary">
          New Category
        </Button>
      </PageHeader>
      <Paginated
        data={categoryListPaginated}
        render={(result) => {
          return (
            <table className="table table-auto">
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
            </table>
          );
        }}
      />
    </div>
  );
}
