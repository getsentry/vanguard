import type { ActionFunctionArgs } from "react-router";
import invariant from "tiny-invariant";

import { requireUserId } from "~/services/auth.server";
import { isEmoji } from "~/lib/emoji";
import { togglePostReaction } from "~/models/post-reactions.server";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }
  invariant(params.postId, "postId not found");

  const userId = await requireUserId(request);

  const { emoji } = await request.json();

  if (typeof emoji !== "string" || emoji.length === 0 || !isEmoji(emoji)) {
    return Response.json({ errors: { emoji: "Emoji is required" } }, { status: 400 });
  }
  // TODO: validate emoji

  const delta = await togglePostReaction({
    postId: params.postId,
    userId,
    emoji,
  });

  return Response.json({ emoji, delta });
}
