import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { requireUser } from "~/services/auth.server";
import { getPostList } from "~/models/post.server";
import type { PostQueryType } from "~/models/post.server";
import Post from "~/components/post";
import { paginate } from "~/lib/paginator";
import Paginated from "~/components/paginated";
import ClusteredPostList from "~/components/clustered-post-list";
import { getReactionsForPosts } from "~/models/post-reactions.server";
import { countCommentsForPosts } from "~/models/post-comments.server";

// TODO: make configurable
const clusteredCategories = ["shipped"];

const FragmentedPostList = ({ posts, reactions, commentCounts }) => {
  // pull out the first unclustered post
  const firstUnclusteredPost = posts.find(
    (p) => clusteredCategories.indexOf(p.category.slug) === -1,
  );

  // remaining posts
  posts = posts.filter((p) => p.id !== firstUnclusteredPost?.id);

  const output: React.ReactNode[] = [];
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

    if (buffer.length && (!isClustered || buffer[0].category.slug !== post.category.slug)) {
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

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const postListPaginated = await paginate<PostQueryType[]>(
    getPostList,
    { user, published: true },
    cursor,
  );

  // Reactions and comment counts are independent of each other — fetch in parallel.
  const [reactions, commentCounts] = await Promise.all([
    getReactionsForPosts({ userId: user.id, postList: postListPaginated.result }),
    countCommentsForPosts({ userId: user.id, postList: postListPaginated.result }),
  ]);

  return { postListPaginated, reactions, commentCounts };
}

export default function Index() {
  const { postListPaginated, reactions, commentCounts } = useLoaderData<typeof loader>();

  return (
    <>
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
