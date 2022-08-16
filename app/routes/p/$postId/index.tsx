import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getPost, getReactionsForPosts } from "~/models/post.server";
import type { PostQueryType } from "~/models/post.server";
import type { User } from "~/models/user.server";
import { requireUser } from "~/session.server";
import { default as PostTemplate } from "~/components/post";
import PostReactions from "~/components/post-reactions";

type LoaderData = {
  post: PostQueryType;
  reactions: any[];
  user: User;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  invariant(params.postId, "postId not found");

  const post = await getPost({ userId: user.id, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  const reactions = (
    await getReactionsForPosts({ userId: user.id, postList: [post] })
  )[post.id];

  return json<LoaderData>({ post, user, reactions });
};

export default function PostDetailsPage() {
  const { post, user, reactions } = useLoaderData() as LoaderData;

  const canEdit = post.authorId === user.id || user.admin;

  return (
    <div>
      <PostTemplate post={post} canEdit={canEdit} />
      <PostReactions post={post} reactions={reactions} />
    </div>
  );
}
