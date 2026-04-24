import type { ActionFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { deleteComment } from "~/models/post-comments.server";

import { requireUserId } from "~/services/auth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }
  invariant(params.postId, "postId not found");
  invariant(params.commentId, "commentId not found");

  const userId = await requireUserId(request);
  await deleteComment({
    userId,
    id: params.commentId,
  });

  return Response.json({}, { status: 204 });
}
