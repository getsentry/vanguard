import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/session.server";
import { getPostList } from "~/models/post.server";
import Post from "~/components/post";

type LoaderData = {
  postList: Awaited<ReturnType<typeof getPostList>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const postList = await getPostList({ userId, published: true });
  return json<LoaderData>({ postList });
};

export default function Index() {
  const data = useLoaderData() as LoaderData;

  return data.postList.length === 0 ? (
    <p>No posts yet</p>
  ) : (
    data.postList.map((post) => (
      <Post post={post} key={post.id} />
    ))
  );
}
