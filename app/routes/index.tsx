import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/session.server";
import { getPostList, getReactionsForPosts } from "~/models/post.server";
import Post from "~/components/post";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import WelcomeBanner from "~/components/welcome-banner";
import ClusteredPostList from "~/components/clustered-post-list";

type LoaderData = {
  postListPaginated: any;
  reactions: any[];
};

// TODO: make configurable
const clusteredCategories = ["shipped"];

const FragmentedPostList = ({ posts, reactions }) => {
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
          reactions={reactions}
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
          reactions={reactions[post.id]}
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
        reactions={reactions}
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

  const reactions = await getReactionsForPosts({
    userId,
    postList: postListPaginated.result,
  });

  return json<LoaderData>({ postListPaginated, reactions });
};

export default function Index() {
  const { postListPaginated, reactions } = useLoaderData() as LoaderData;

  return (
    <>
      <WelcomeBanner />
      <Paginated
        data={postListPaginated}
        render={(result) => {
          return result.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            <FragmentedPostList posts={result} reactions={reactions} />
          );
        }}
      />
    </>
  );
}
