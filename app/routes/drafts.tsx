import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/session.server";
import { getPostList } from "~/models/post.server";
import PostLink from "~/components/post-link";

type LoaderData = {
  postList: Awaited<ReturnType<typeof getPostList>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const postList = await getPostList({ userId, published: false });
  return json<LoaderData>({ postList });
};

export default function Index() {
  const data = useLoaderData() as LoaderData;

  return (
    <div>
      <h1>My Drafts</h1>
      {data.postList.length === 0 ? (
        <p className="p-4">No posts yet</p>
      ) : (
        <ol>
          {data.postList.map((post) => (
            <li key={post.id}>
              <h2>
                <PostLink post={post}>{post.title}</PostLink>
              </h2>
              <h3>{post.author.name}</h3>
              <p>{post.content}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
