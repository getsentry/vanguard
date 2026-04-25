import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import invariant from "tiny-invariant";

import { requireUser } from "~/services/auth.server";
import { getPostList } from "~/models/post.server";
import { getCategory } from "~/models/category.server";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import Post from "~/components/post";

export async function loader({ request, params }: LoaderFunctionArgs) {
  invariant(params.categorySlug, "categorySlug not found");
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  // User auth and category lookup are independent — fetch in parallel.
  const [user, category] = await Promise.all([
    requireUser(request),
    getCategory({ slug: params.categorySlug }),
  ]);
  invariant(category, "invalid category");

  const postListPaginated = await paginate(
    getPostList,
    { user, categoryId: category.id, published: true },
    cursor,
  );

  return { category, postListPaginated };
}

export default function Index() {
  const { postListPaginated } = useLoaderData<typeof loader>();

  return (
    <Paginated
      data={postListPaginated}
      render={(result) => {
        return result.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          result.map((post) => <Post post={post} key={post.id} summary />)
        );
      }}
    />
  );
}
