import type { LoaderFunctionArgs } from "react-router";

import { listSlackEmojis } from "~/models/emoji.server";
import { requireUserId } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const emojis = await listSlackEmojis();

  return Response.json({ emojis }, { headers: { "Cache-Control": "private, max-age=300" } });
}
