import os from "os";
import fs from "fs/promises";
import path from "path";
import type { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { get } from "@vercel/blob";
import { requireUserId } from "~/services/auth.server";

// 1 day browser cache. `private` so CDNs / shared caches don't store the
// auth-gated bytes — only the requesting user's browser keeps a copy.
const MAX_AGE = 60 * 60 * 24;
const CACHE_CONTROL = `private, max-age=${MAX_AGE}`;

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);

  const pathname = params["*"];
  invariant(pathname, "pathname is required");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Production: stream from the private Vercel Blob store using the
    // server-side token. The blob URL is never exposed to the client.
    const { stream, headers } = await get(pathname, { access: "private" });
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": CACHE_CONTROL,
      },
    });
  }

  // Local dev fallback: read from os.tmpdir().
  const filepath = path.join(os.tmpdir(), pathname);
  const fd = await fs.open(filepath, "r");
  const stream = fd.createReadStream();

  return new Response(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
