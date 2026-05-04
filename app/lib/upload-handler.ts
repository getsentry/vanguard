import os from "os";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { createId as cuid } from "@paralleldrive/cuid2";
import { optimizeImage, type ImageVariant } from "./image-optimize";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function isAllowedImageType(mime: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mime);
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** Map a file extension to its MIME type (for local-dev Content-Type derivation). */
export const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/**
 * Store an uploaded file. Returns the auth-gated proxy URL plus the resolved
 * dimensions and stored byte count.
 *
 * In production (when `BLOB_READ_WRITE_TOKEN` is set), writes to a **private**
 * Vercel Blob store and returns an auth-gated proxy URL (`/image-uploads/...`)
 * served by `app/routes/image-uploads.$.tsx`. Images are never directly
 * reachable from the public internet — only logged-in users can fetch them.
 *
 * In local dev (no token), writes to `os.tmpdir()` and returns the same
 * proxy URL, served by the same route from the local filesystem.
 *
 * If `variant` is supplied the buffer is run through `optimizeImage()` before
 * storage — uploads are resized, EXIF-stripped, and re-encoded as WebP. Pass
 * `"avatar"` for profile pictures (square, ≤512×512) or `"post-image"` for
 * markdown-editor uploads (≤1600px wide, aspect preserved). Omit `variant`
 * for raw passthrough — the bytes are stored as-is and `width`/`height` come
 * back as `0`.
 */
export async function uploadFile({
  mimeType,
  buffer,
  namespace = "post-images",
  variant,
}: {
  mimeType: string;
  buffer: Buffer | ArrayBuffer;
  namespace?: string;
  variant?: ImageVariant;
}): Promise<{ url: string; width: number; height: number; bytes: number }> {
  const inputBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // optimizeImage detects the actual format from the bytes and ignores the
  // claimed mimeType (which is client-controlled). The no-variant fallback
  // still trusts the claimed mime, but no current callsite uses that path.
  const processed = variant
    ? await optimizeImage(inputBuffer, variant)
    : { buffer: inputBuffer, mimeType, width: 0, height: 0 };

  const ext = MIME_TO_EXT[processed.mimeType] ?? "bin";
  const pathname = `${namespace}/${cuid()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(pathname, processed.buffer, { access: "private" });
  } else {
    // Local dev fallback — write to os.tmpdir(), served by image-uploads.$ route.
    const filepath = path.join(os.tmpdir(), pathname);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, processed.buffer);
  }

  return {
    url: `/image-uploads/${pathname}`,
    width: processed.width,
    height: processed.height,
    bytes: processed.buffer.length,
  };
}
