import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";

import {
  createSubscription,
  deleteSubscription,
} from "~/models/post-subscription.server";
import { requireUserId } from "~/services/auth.server";

export async function action({ request, context, params }: ActionFunctionArgs) {
  if (request.method !== "DELETE" && request.method !== "POST") {
    return json({ message: "Method not allowed" }, 405);
  }
  invariant(params.postId, "postId not found");

  const userId = await requireUserId(request, context);

  if (request.method === "DELETE") {
    await deleteSubscription({ userId, postId: params.postId });
  } else if (request.method === "POST") {
    await createSubscription({ userId, postId: params.postId });
  }

  return json({});
}
