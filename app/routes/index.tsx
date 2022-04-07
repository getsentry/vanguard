import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";
import { getPostList } from "~/models/post.server";

type LoaderData = {
  postList: Awaited<ReturnType<typeof getPostList>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const postList = await getPostList({ userId });
  return json<LoaderData>({ postList });
};

export default function Index() {
  const data = useLoaderData() as LoaderData;
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Posts</Link>
        </h1>
        <Link to="posts/new" className="block p-4 text-xl text-blue-500">
          + New Post
        </Link>
        <p>{user.email}</p>
      </header>

      <main className="flex h-full bg-white">
        {data.postList.length === 0 ? (
          <p className="p-4">No posts yet</p>
        ) : (
          <ol>
            {data.postList.map((post) => (
              <li key={post.id}>
                <h2>
                  <Link to={`posts/${post.id}`}>{post.title}</Link>
                </h2>
                <h3>{post.author.name}</h3>
                <p>{post.content}</p>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
