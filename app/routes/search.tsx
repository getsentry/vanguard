import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { requireUserId } from "~/services/auth.server";
import { getPostList } from "~/models/post.server";
import Post from "~/components/post";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const query = url.searchParams.get("q") || "";
  const postListPaginated = await paginate(
    getPostList,
    { userId, published: true, query },
    cursor,
  );
  return { postListPaginated, query };
}

export default function Search() {
  const { postListPaginated, query } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>
        Showing results for <code>{query}</code>
      </h1>
      <Paginated
        data={postListPaginated}
        render={(result) => {
          return result.length === 0 ? (
            <p>No posts found</p>
          ) : (
            result.map((post) => <Post post={post} key={post.id} summary />)
          );
        }}
      />
    </div>
  );
}
