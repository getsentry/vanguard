import os from "os";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { createId as cuid } from "@paralleldrive/cuid2";

/**
 * Store an uploaded file. Returns a URL to be embedded in post content.
 *
 * In production (when `BLOB_READ_WRITE_TOKEN` is set), writes to a **private**
 * Vercel Blob store and returns an auth-gated proxy URL (`/image-uploads/...`)
 * served by `app/routes/image-uploads.$.tsx`. Images are never directly
 * reachable from the public internet — only logged-in users can fetch them.
 *
 * In local dev (no token), writes to `os.tmpdir()` and returns the same
 * proxy URL, served by the same route from the local filesystem.
 */
export async function uploadFile({
  filename,
  buffer,
  namespace = "post-images",
}: {
  filename: string;
  buffer: Buffer | ArrayBuffer;
  namespace?: string;
}): Promise<{ url: string }> {
  const pathname = `${namespace}/${cuid()}-${filename.replace(/\s+/g, "-")}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(pathname, buffer, { access: "private" });
    return { url: `/image-uploads/${pathname}` };
  }

  // Local dev fallback — write to os.tmpdir(), served by image-uploads.$ route.
  const filepath = path.join(os.tmpdir(), pathname);
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, Buffer.from(buffer));
  return { url: `/image-uploads/${pathname}` };
}
