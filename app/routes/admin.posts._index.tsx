import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import { getPostList } from "~/models/post.server";
import BooleanIcon from "~/components/boolean-icon";
import PostLink from "~/components/post-link";
import PageHeader from "~/components/page-header";
import TimeSince from "~/components/timeSince";
import Link from "~/components/link";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireAdmin(request, context);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const postListPaginated = await paginate(
    getPostList,
    { userId: user.id },
    cursor,
  );
  return json({ postListPaginated });
}

export default function Index() {
  const { postListPaginated } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader title="Posts" />
      <Paginated
        data={postListPaginated}
        render={(result) => {
          return (
            <table className="table table-auto">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Published?</th>
                  <th>Publish Date</th>
                </tr>
              </thead>
              <tbody>
                {result.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <PostLink post={post}>{post.title}</PostLink>
                    </td>
                    <td>
                      <Link to={`/u/${post.author.email}`}>
                        {post.author.email}
                      </Link>
                    </td>
                    <td>
                      <BooleanIcon value={post.published} />
                    </td>
                    <td>
                      <TimeSince date={post.publishedAt || post.createdAt} />
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
