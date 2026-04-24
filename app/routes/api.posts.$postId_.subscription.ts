import type { ActionFunctionArgs } from "react-router";
import invariant from "tiny-invariant";

import { createSubscription, deleteSubscription } from "~/models/post-subscription.server";
import { requireUserId } from "~/services/auth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE" && request.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }
  invariant(params.postId, "postId not found");

  const userId = await requireUserId(request);

  if (request.method === "DELETE") {
    await deleteSubscription({ userId, postId: params.postId });
  } else if (request.method === "POST") {
    await createSubscription({ userId, postId: params.postId });
  }

  return {};
}
