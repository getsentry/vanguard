import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { comment } from "postcss";
import invariant from "tiny-invariant";
import { createComment } from "~/models/post-comments.server";

import { requireUserId } from "~/services/session.server";

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }
  invariant(params.postId, "postId not found");

  const userId = await requireUserId(request);

  const { content, parentId } = await request.json();

  const comment = await createComment({
    postId: params.postId,
    userId,
    content,
    parentId,
  });

  return json(comment);
};
