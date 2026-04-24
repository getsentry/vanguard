import os from "os";
import fs from "fs/promises";
import path from "path";
import type { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";

const MAX_AGE = 60 * 60 * 24;

export async function loader({ params }: LoaderFunctionArgs) {
  // This route is only used in local dev mode (no BLOB_READ_WRITE_TOKEN).
  // In production, uploaded files are served directly from Vercel Blob URLs.
  const fileParam = params["*"];
  invariant(fileParam, "filename is required");

  const filepath = path.join(os.tmpdir(), fileParam);
  const fd = await fs.open(filepath, "r");
  const stream = fd.createReadStream();

  return new Response(stream as any, {
    status: 200,
    headers: {
      "Cache-Control": `max-age=${MAX_AGE}, s-maxage=${MAX_AGE}`,
    },
  });
}
