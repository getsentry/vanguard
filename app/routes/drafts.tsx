import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/services/auth.server";
import { getPostList } from "~/models/post.server";
import Post from "~/components/post";

type LoaderData = {
  postList: Awaited<ReturnType<typeof getPostList>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const postList = await getPostList({
    userId,
    authorId: userId,
    published: false,
  });
  return json<LoaderData>({ postList });
};

export default function Drafts() {
  const { postList } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>My Drafts</h1>
      {postList.length === 0 ? (
        <p className="p-4">
          You've got no posts in draft form.{" "}
          <Link to="/new-post">Get to writing!</Link>
        </p>
      ) : (
        postList.map((post) => (
          <Post post={post} key={post.id} summary canEdit />
        ))
      )}
    </div>
  );
}
