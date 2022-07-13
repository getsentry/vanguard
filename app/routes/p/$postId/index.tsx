import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getPost, getReactionsForPosts } from "~/models/post.server";
import type { PostQueryType } from "~/models/post.server";
import type { User } from "~/models/user.server";
import { requireUser } from "~/session.server";
import { default as PostTemplate } from "~/components/post";
import Block from "~/components/block";
import EmojiRection from "~/components/emoji-reaction";

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

const PostReactions = ({
  post,
  reactions,
}: {
  post: PostQueryType;
  reactions: any[];
}) => {
  // dont show reactions if unpublished
  if (!post.published) return null;

  const bakedIn = ["❤️", "👍", "🎉", "🤯", "🚀"];
  const allEmoji = [
    ...bakedIn,
    ...reactions
      .filter((r) => bakedIn.indexOf(r.emoji) === -1)
      .map((r) => r.emoji),
  ];

  return (
    <Block>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {allEmoji.map((emoji) => {
          const reactionData = reactions.find((r) => r.emoji === emoji);
          return (
            <EmojiRection
              key={emoji}
              postId={post.id}
              count={reactionData?.total || 0}
              emoji={emoji}
              selected={reactionData?.user || false}
            />
          );
        })}
      </div>
    </Block>
  );
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
