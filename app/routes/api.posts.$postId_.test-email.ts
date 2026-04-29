import type { ActionFunctionArgs } from "react-router";
import invariant from "tiny-invariant";

import * as email from "~/lib/email";
import { getPost } from "~/models/post.server";
import { requireAdmin } from "~/services/auth.server";

/**
 * Admin-only smoke test for the post-announcement email pipeline.
 *
 * Sends the post's announcement email to the calling admin's own address so
 * they can eyeball rendering — particularly the inline-CID image handling
 * added in #174 — without having to (re-)trigger a real announcement to the
 * whole category. Uses the existing `subjectPrefix` knob to mark the message
 * as `[TEST]` so it can't be confused with a genuine announcement.
 *
 * Awaited (not deferred via `waitUntil`) on purpose: we want failures to
 * surface synchronously so the admin gets immediate feedback in the UI.
 */
export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  invariant(params.postId, "postId not found");

  const admin = await requireAdmin(request);

  const post = await getPost({ user: admin, id: params.postId });
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  // Pre-flight the same env vars `hasEmailSupport()` checks. Doing it here lets
  // us return a clear 503 to the UI; otherwise `email.notify` would just log
  // and silently no-op, leaving the admin guessing why nothing arrived.
  if (!process.env.SMTP_FROM || !process.env.BASE_URL) {
    return Response.json(
      { error: "Email is not configured on this environment." },
      { status: 503 },
    );
  }

  try {
    await email.notify({
      post,
      config: { to: admin.email, subjectPrefix: "[TEST]" },
    });
  } catch (err) {
    console.error(
      `[api.posts.test-email] notify threw — post=${post.id} to=${admin.email}`,
      err instanceof Error ? err.message : err,
    );
    return Response.json({ error: "Failed to send test email" }, { status: 500 });
  }

  return { ok: true, to: admin.email };
}
