import type { ActionFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { createComment } from "~/models/post-comments.server";

import { requireUserId } from "~/services/auth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
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

  return comment;
}
