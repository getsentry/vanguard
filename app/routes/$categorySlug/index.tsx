import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { requireUserId } from "~/session.server";
import { getPostList } from "~/models/post.server";
import { getCategory } from "~/models/category.server";
import PostLink from "~/components/post-link";

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
    categoryId: params.categoryId,
    published: true,
  });
  return json<LoaderData>({ category, postList });
};

export default function Index() {
  const { category, postList } = useLoaderData() as LoaderData;

  return (
    <div>
      <h1>{category!.name}</h1>
      {postList.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        <ol>
          {postList.map((post) => (
            <li key={post.id} className="post">
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
