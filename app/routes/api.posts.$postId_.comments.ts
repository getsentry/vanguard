import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { createComment } from "~/models/post-comments.server";

import { requireUserId } from "~/services/auth.server";

export async function action({ request, context, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }
  invariant(params.postId, "postId not found");

  const userId = await requireUserId(request, context);

  const { content, parentId } = await request.json();

  const comment = await createComment({
    postId: params.postId,
    userId,
    content,
    parentId,
  });

  return json(comment);
}
