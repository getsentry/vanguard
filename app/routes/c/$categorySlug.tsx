import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { requireUserId } from "~/services/session.server";
import { getPostList } from "~/models/post.server";
import { getCategory } from "~/models/category.server";
import Post from "~/components/post";

type LoaderData = {
  category: Awaited<ReturnType<typeof getCategory>>;
  postList: Awaited<ReturnType<typeof getPostList>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.categorySlug, "categorySlug not found");
  const category = await getCategory({ slug: params.categorySlug });
  invariant(category, "invalid category");
  const postList = await getPostList({
    userId,
    categoryId: category.id,
    published: true,
  });
  return json<LoaderData>({ category, postList });
};

export default function Index() {
  const { category, postList } = useLoaderData() as LoaderData;

  return (
    <div>
      <h1 className="page-title">{category!.name}</h1>
      {postList.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        postList.map((post) => <Post post={post} key={post.id} summary />)
      )}
    </div>
  );
}
