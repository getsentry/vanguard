import { timingSafeEqual } from "node:crypto";
import type { LoaderFunctionArgs } from "react-router";

import { hasSlackEmojiSupport, trySyncSlackEmojis } from "~/lib/slack-emoji.server";

/**
 * Vercel Cron target. Scheduled invocations arrive with no session, carrying
 * `Authorization: Bearer $CRON_SECRET`, so that header is the only credential
 * this route accepts. It fails closed: an unset `CRON_SECRET` rejects
 * everything rather than leaving the endpoint open.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  // timingSafeEqual throws on a length mismatch, so check that separately.
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSlackEmojiSupport()) {
    return Response.json({ error: "SLACK_API_TOKEN is not configured" }, { status: 400 });
  }

  // Reports to Sentry and returns null on failure. The non-200 is what makes
  // the failure visible in Vercel's cron log.
  const result = await trySyncSlackEmojis();
  if (!result) {
    return Response.json({ error: "Slack emoji sync failed" }, { status: 502 });
  }

  return Response.json({ total: result.total });
}
