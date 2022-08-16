import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { togglePostReaction } from "~/models/post.server";
import { requireUserId } from "~/session.server";
import invariant from "tiny-invariant";

type ActionData = {
  errors?: {
    emoji?: string;
  };
};

const isEmoji = (value: string): boolean => {
  const pattern = /\p{Extended_Pictographic}/gu;
  return value.match(pattern)?.length === 1;
};

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }
  invariant(params.postId, "postId not found");

  const userId = await requireUserId(request);

  const { emoji } = await request.json();

  if (typeof emoji !== "string" || emoji.length === 0 || !isEmoji(emoji)) {
    return json<ActionData>(
      { errors: { emoji: "Emoji is required" } },
      { status: 400 }
    );
  }
  // TODO: validate emoji

  const delta = await togglePostReaction({
    postId: params.postId,
    userId,
    emoji,
  });

  return json({
    emoji,
    delta,
  });
};
