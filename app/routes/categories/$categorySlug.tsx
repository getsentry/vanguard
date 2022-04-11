import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { requireUserId } from "~/session.server";
import { getPostList } from "~/models/post.server";
import { getCategory } from "~/models/category.server";

type LoaderData = {
  category: Awaited<ReturnType<typeof getCategory>>;
  postList: Awaited<ReturnType<typeof getPostList>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.categoryId, "categoryId not found");
  const category = await getCategory({ id: params.categoryId });
  const postList = await getPostList({
    userId,
    categoryId: params.categoryId,
    published: true,
  });
  return json<LoaderData>({ category, postList });
};

export default function Index() {
  const data = useLoaderData() as LoaderData;

  return data.postList.length === 0 ? (
    <p>No posts yet</p>
  ) : (
    <ol>
      {data.postList.map((post) => (
        <li key={post.id} className="post">
          <h2>
            <Link to={`posts/${post.id}`}>{post.title}</Link>
          </h2>
          <h3>{post.author.name}</h3>
          <p>{post.content}</p>
        </li>
      ))}
    </ol>
  );
}
