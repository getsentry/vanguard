import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";
import { paginate } from "~/lib/paginator";
import type { PaginatedResult } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import Table from "~/components/table";
import moment from "moment";
import PostLink from "~/components/post-link";
import PageHeader from "~/components/page-header";
import { getCommentList } from "~/models/post-comments.server";

type LoaderData = {
  commentListPaginated: Awaited<
    PaginatedResult<Awaited<ReturnType<typeof getCommentList>>>
  >;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireAdmin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const commentListPaginated = await paginate(
    getCommentList,
    { userId: user.id },
    cursor
  );
  return json<LoaderData>({ commentListPaginated });
};

export default function Comments() {
  const { commentListPaginated } = useLoaderData() as LoaderData;

  return (
    <div>
      <PageHeader>
        <h1>Comments</h1>
      </PageHeader>
      <Paginated
        data={commentListPaginated}
        render={(result) => {
          return (
            <Table className="table-auto">
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
                      <PostLink post={comment.post}>
                        {comment.post.title}
                      </PostLink>
                    </td>
                    <td>
                      <Link to={`/u/${comment.author.email}`}>
                        {comment.author.email}
                      </Link>
                    </td>
                    <td>{moment(comment.createdAt).fromNow()}</td>
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
