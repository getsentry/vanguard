import os from "os";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { createId as cuid } from "@paralleldrive/cuid2";

export async function uploadFile({
  filename,
  buffer,
  namespace = "post-images",
}: {
  filename: string;
  buffer: Buffer | ArrayBuffer;
  namespace?: string;
}): Promise<{ url: string }> {
  const safeName = `${namespace}/${cuid()}-${filename.replace(/\s+/g, "-")}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(safeName, buffer, { access: "public" });
    return { url: blob.url };
  }

  // Local dev fallback — write to os.tmpdir(), serve via image-uploads.$ route
  const dir = path.join(os.tmpdir(), namespace);
  await fs.mkdir(dir, { recursive: true });
  const basename = path.basename(safeName);
  await fs.writeFile(path.join(dir, basename), Buffer.from(buffer));
  return { url: `/image-uploads/${namespace}/${basename}` };
}
