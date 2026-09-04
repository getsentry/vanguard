import type { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";

import { getSlackEmojiUrl } from "~/models/emoji.server";

// Deliberately unauthenticated. Custom emoji are embedded in post bodies that
// also go out over email and RSS, where there is no session cookie to check,
// and the route only ever redirects to a public Slack CDN URL. The full emoji
// listing, which is the part worth gating, lives behind auth in /api/emoji.
export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.name, "name not found");

  const url = await getSlackEmojiUrl(params.name);
  if (!url) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
