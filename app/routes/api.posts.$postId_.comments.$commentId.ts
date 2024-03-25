import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { deleteComment } from "~/models/post-comments.server";

import { requireUserId } from "~/services/auth.server";

export async function action({ request, context, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return json({ message: "Method not allowed" }, 405);
  }
  invariant(params.postId, "postId not found");
  invariant(params.commentId, "commentId not found");

  const userId = await requireUserId(request, context);
  await deleteComment({
    userId,
    id: params.commentId,
  });

  return json({}, 204);
}
