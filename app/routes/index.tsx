import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/session.server";
import { countReactionsForPosts, getPostList } from "~/models/post.server";
import Post from "~/components/post";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import WelcomeBanner from "~/components/welcome-banner";
import ClusteredPostList from "~/components/clustered-post-list";

type LoaderData = {
  postListPaginated: any;
  reactionCounts: any[];
};

// TODO: make configurable
const clusteredCategories = ["shipped"];

const FragmentedPostList = ({ posts, reactionCounts }) => {
  const output: React.ReactNode[] = [];

  let clusters: React.ReactNode[] = [];
  let remainingPosts: any[] = [];

  let buffer: any[] = [];
  posts.forEach((post) => {
    const isClustered = clusteredCategories.indexOf(post.category.slug) !== -1;

    if (
      buffer.length &&
      (!isClustered || buffer[0].category.slug !== post.category.slug)
    ) {
      clusters.push(
        <ClusteredPostList
          category={buffer[0].category}
          posts={buffer}
          reactionCounts={reactionCounts}
          key={buffer[0].id}
        />
      );
    }

    if (!isClustered) {
      buffer = [];
      remainingPosts.push(
        <Post
          post={post}
          key={post.id}
          totalReactions={reactionCounts[post.id]}
          summary
        />
      );
    }

    if (isClustered) {
      buffer.push(post);
    }
  });

  if (buffer.length) {
    clusters.push(
      <ClusteredPostList
        category={buffer[0].category}
        posts={buffer}
        reactionCounts={reactionCounts}
        key={buffer[0].id}
      />
    );
  }

  // show a focused point first
  if (remainingPosts.length) {
    return (
      <>
        {remainingPosts[0]}
        {clusters}
        {remainingPosts.slice(1)}
      </>
    );
  }

  return <>{clusters}</>;
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
            <p>No posts yet.</p>
          ) : (
            <FragmentedPostList
              posts={result}
              reactionCounts={reactionCounts}
            />
          );
        }}
      />
    </>
  );
}
