import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/services/auth.server";
import { getPostList } from "~/models/post.server";
import Post from "~/components/post";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import WelcomeBanner from "~/components/welcome-banner";
import ClusteredPostList from "~/components/clustered-post-list";
import { getReactionsForPosts } from "~/models/post-reactions.server";
import { countCommentsForPosts } from "~/models/post-comments.server";

// TODO: make configurable
const clusteredCategories = ["shipped"];

const FragmentedPostList = ({ posts, reactions, commentCounts }) => {
  // pull out the first unclustered post
  let firstUnclusteredPost = posts.find(
    (p) => clusteredCategories.indexOf(p.category.slug) === -1,
  );

  // remaining posts
  posts = posts.filter((p) => p.id !== firstUnclusteredPost?.id);

  let output: React.ReactNode[] = [];
  if (firstUnclusteredPost) {
    output.push(
      <Post
        post={firstUnclusteredPost}
        key={firstUnclusteredPost.id}
        reactions={reactions[firstUnclusteredPost.id]}
        totalComments={commentCounts[firstUnclusteredPost.id]}
        summary
      />,
    );
  }

  let buffer: any[] = [];
  posts.forEach((post) => {
    const isClustered = clusteredCategories.indexOf(post.category.slug) !== -1;

    if (
      buffer.length &&
      (!isClustered || buffer[0].category.slug !== post.category.slug)
    ) {
      output.push(
        <ClusteredPostList
          category={buffer[0].category}
          posts={buffer}
          reactions={reactions}
          commentCounts={commentCounts}
          key={buffer[0].id}
        />,
      );
    }

    if (!isClustered) {
      buffer = [];
      output.push(
        <Post
          post={post}
          key={post.id}
          reactions={reactions[post.id]}
          totalComments={commentCounts[post.id]}
          summary
        />,
      );
    }

    if (isClustered) {
      buffer.push(post);
    }
  });

  if (buffer.length) {
    output.push(
      <ClusteredPostList
        category={buffer[0].category}
        posts={buffer}
        reactions={reactions}
        commentCounts={commentCounts}
        key={buffer[0].id}
      />,
    );
  }

  return <>{output}</>;
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId(request, context);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const postListPaginated = await paginate(
    getPostList,
    { userId, published: true },
    cursor,
  );

  const reactions = await getReactionsForPosts({
    userId,
    postList: postListPaginated.result,
  });

  const commentCounts = await countCommentsForPosts({
    userId,
    postList: postListPaginated.result,
  });

  return json({ postListPaginated, reactions, commentCounts });
}

export default function Index() {
  const { postListPaginated, reactions, commentCounts } =
    useLoaderData<typeof loader>();

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
              reactions={reactions}
              commentCounts={commentCounts}
            />
          );
        }}
      />
    </>
  );
}
