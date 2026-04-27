import type { ActionFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { deleteComment } from "~/models/post-comments.server";

import { requireUser } from "~/services/auth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }
  invariant(params.postId, "postId not found");
  invariant(params.commentId, "commentId not found");

  const user = await requireUser(request);
  await deleteComment({
    user,
    id: params.commentId,
  });

  return Response.json({}, { status: 204 });
}
