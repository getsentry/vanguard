import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { requireAdmin } from "~/services/auth.server";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import PostLink from "~/components/post-link";
import PageHeader from "~/components/page-header";
import { getCommentList } from "~/models/post-comments.server";
import TimeSince from "~/components/timeSince";
import Link from "~/components/link";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const commentListPaginated = await paginate(getCommentList, { userId: user.id }, cursor);
  return { commentListPaginated };
}

export default function Comments() {
  const { commentListPaginated } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader title="Comments" />
      <Paginated
        data={commentListPaginated}
        render={(result) => {
          return (
            <table className="table table-auto">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Author</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {result.map((comment) => (
                  <tr key={comment.id}>
                    <td>
                      <PostLink post={comment.post}>{comment.post.title}</PostLink>
                    </td>
                    <td>
                      <Link to={`/u/${comment.author.email}`}>{comment.author.email}</Link>
                    </td>
                    <td>
                      <TimeSince date={comment.createdAt} />
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
