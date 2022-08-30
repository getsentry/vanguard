import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { announcePost, getPost, updatePost } from "~/models/post.server";
import { getReactionsForPosts } from "~/models/post-reactions.server";
import type { PostQueryType } from "~/models/post.server";
import { getCommentList } from "~/models/post-comments.server";
import type { User } from "~/models/user.server";
import { requireUser, requireUserId } from "~/services/session.server";
import { default as PostTemplate } from "~/components/post";
import PostReactions from "~/components/post-reactions";
import PostComments from "~/components/post-comments";
import { hasSubscription } from "~/models/post-subscription.server";

type LoaderData = {
  post: PostQueryType;
  comments: any[];
  reactions: any[];
  user: User;
  hasSubscription: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);

  const post = await getPost({ userId: user.id, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  const reactions = (
    await getReactionsForPosts({ userId: user.id, postList: [post] })
  )[post.id];

  const comments = await getCommentList({
    userId: user.id,
    postId: post.id,
    limit: 1000,
  });

  return json<LoaderData>({
    post,
    user,
    reactions,
    comments,
    hasSubscription: await hasSubscription({
      userId: user.id,
      postId: post.id,
    }),
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.postId, "postId not found");

  const formData = await request.formData();
  const published =
    formData.get("published") === "true" ||
    formData.get("published") === "announce";

  if (published) {
    const announce = published && formData.get("published") === "announce";
    const post = await updatePost({
      id: params.postId,
      userId,
      published,
    });

    if (!post.deleted && announce) {
      announcePost(post);
    }
  }

  return json({});
};

export default function PostDetailsPage() {
  let { post, user, reactions, comments, hasSubscription } =
    useLoaderData() as LoaderData;

  const canEdit = post.authorId === user.id || user.admin;

  return (
    <div>
      <PostTemplate post={post} canEdit={canEdit} reactions={reactions} />
      {post.published && (
        <>
          <PostReactions post={post} reactions={reactions} />
          <PostComments
            post={post}
            comments={comments}
            user={user}
            allowComments={
              !!(post.allowComments && post.category.allowComments)
            }
            hasSubscription={hasSubscription}
          />
        </>
      )}
    </div>
  );
}
