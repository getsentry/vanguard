import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { requireUserId } from "~/services/auth.server";
import { getPostList } from "~/models/post.server";
import { getCategory } from "~/models/category.server";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import Post from "~/components/post";

type LoaderData = {
  category: Awaited<ReturnType<typeof getCategory>>;
  postListPaginated: any;
  reactions: any[];
  commentCounts: any[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.categorySlug, "categorySlug not found");
  const category = await getCategory({ slug: params.categorySlug });
  invariant(category, "invalid category");

  // Grab cursor information
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const postListPaginated = await paginate(
    getPostList,
    { userId, categoryId: category.id, published: true },
    cursor
  );

  return json<LoaderData>({ category, postListPaginated });
};

export default function Index() {
  const { category, postListPaginated } = useLoaderData<typeof loader>();

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
