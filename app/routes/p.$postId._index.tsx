import type { ActionFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import invariant from "tiny-invariant";

import { announcePost, getPost, updatePost } from "~/models/post.server";
import { getReactionsForPosts } from "~/models/post-reactions.server";
import { getCommentList } from "~/models/post-comments.server";
import { requireUser } from "~/services/auth.server";
import { default as PostTemplate } from "~/components/post";
import PostReactions from "~/components/post-reactions";
import PostComments from "~/components/post-comments";
import { hasSubscription } from "~/models/post-subscription.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const post = await getPost({ user, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  // Reactions, comments, and subscription state all depend on the post but are
  // independent of each other — fetch them in parallel.
  const [reactionsByPost, comments, hasSub] = await Promise.all([
    getReactionsForPosts({ userId: user.id, postList: [post] }),
    getCommentList({ userId: user.id, postId: post.id, limit: 1000 }),
    hasSubscription({ userId: user.id, postId: post.id }),
  ]);

  return {
    post,
    user,
    reactions: reactionsByPost[post.id],
    comments,
    hasSubscription: hasSub,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  return [
    {
      title: `${data.post.title} | Vanguard`,
    },
  ];
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  invariant(params.postId, "postId not found");

  const formData = await request.formData();
  const publishedValue = formData.get("published");
  const published = publishedValue === "true" || publishedValue === "announce";

  console.log(
    `[p.$postId action] postId=${params.postId} publishedValue=${String(publishedValue)} → published=${published}`,
  );

  if (published) {
    const announce = publishedValue === "announce";
    const post = await updatePost({
      id: params.postId,
      user,
      published,
    });

    console.log(
      `[p.$postId action] updatePost done — post=${post.id} deleted=${post.deleted} announce=${announce}`,
    );

    if (!post.deleted && announce) {
      console.log(`[p.$postId action] calling announcePost for ${post.id}`);
      announcePost(post);
    } else {
      console.log(
        `[p.$postId action] NOT calling announcePost — post=${post.id} deleted=${post.deleted} announce=${announce}`,
      );
    }
  } else {
    console.log(`[p.$postId action] no publish flag set on form submission — doing nothing`);
  }

  return {};
};

export default function PostDetailsPage() {
  const { post, user, reactions, comments, hasSubscription } = useLoaderData<typeof loader>();

  const canEdit = post.authorId === user.id || user.admin;

  return (
    <div>
      <PostTemplate post={post} canEdit={canEdit} isAdmin={user.admin} reactions={reactions} />
      {post.published && (
        <>
          <PostReactions post={post} reactions={reactions} />
          <PostComments
            post={post}
            comments={comments}
            user={user}
            allowComments={!!(post.allowComments && post.category.allowComments)}
            hasSubscription={hasSubscription}
          />
        </>
      )}
    </div>
  );
}
