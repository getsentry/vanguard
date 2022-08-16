import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/session.server";
import { countReactionsForPosts, getPostList } from "~/models/post.server";
import Post from "~/components/post";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import WelcomeBanner from "~/components/welcome-banner";

type LoaderData = {
  postListPaginated: any;
  reactionCounts: any[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const postListPaginated = await paginate(
    getPostList,
    { userId, published: true },
    cursor
  );
  const reactionCounts = await countReactionsForPosts({
    userId,
    postList: postListPaginated.result,
  });
  return json<LoaderData>({ postListPaginated, reactionCounts });
};

export default function Index() {
  const { postListPaginated, reactionCounts } = useLoaderData() as LoaderData;

  return (
    <>
      <WelcomeBanner />
      <Paginated
        data={postListPaginated}
        render={(result) => {
          return result.length === 0 ? (
            <p>No posts yet</p>
          ) : (
            result.map((post) => (
              <Post
                post={post}
                key={post.id}
                totalReactions={reactionCounts[post.id]}
                summary
              />
            ))
          );
        }}
      />
    </>
  );
}
