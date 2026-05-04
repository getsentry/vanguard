import os from "os";
import fs from "fs/promises";
import path from "path";
import { get } from "@vercel/blob";
import { EXT_TO_MIME } from "~/lib/upload-handler";

// MAX_TOTAL_BYTES is the real budget — SMTP / SendGrid cares about message
// size, not image count. MAX_IMAGES is a sanity cap that bounds per-message
// work in case a post somehow references hundreds of inline images. Uploads
// are resized + WebP-encoded at write time (see app/lib/image-optimize.ts),
// so a typical post image is ~100 KB and 50 fits comfortably under
// SendGrid's 30 MB message limit.
const MAX_IMAGES = 50;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20 MB

export type InlineAttachment = {
  cid: string;
  filename: string;
  content: Buffer;
  contentType: string;
  contentDisposition: "inline";
};

export async function inlinePrivateImages(
  html: string,
): Promise<{ html: string; attachments: InlineAttachment[] }> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) return { html, attachments: [] };

  const escapedBase = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`src="${escapedBase}/image-uploads/([^"]+)"`, "g");

  const matches = [...html.matchAll(regex)];
  if (matches.length === 0) return { html, attachments: [] };

  // Dedupe by pathname
  const pathnameToCid = new Map<string, string>();
  let counter = 0;
  for (const match of matches) {
    const pathname = match[1];
    if (!pathnameToCid.has(pathname)) {
      pathnameToCid.set(pathname, `vg-img-${counter++}`);
    }
  }

  const attachments: InlineAttachment[] = [];
  let totalBytes = 0;
  const fetchedPathnameMap = new Map<string, string>(); // pathname -> cid (only successfully fetched)

  for (const [pathname, cid] of pathnameToCid) {
    if (attachments.length >= MAX_IMAGES) {
      console.warn(`[email-images] skipping ${pathname} — MAX_IMAGES (${MAX_IMAGES}) reached`);
      continue;
    }

    try {
      let content: Buffer;
      let contentType: string;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { stream, headers } = await get(pathname, { access: "private" });
        content = Buffer.from(await new Response(stream).arrayBuffer());
        contentType = headers.get("content-type") ?? "application/octet-stream";
      } else {
        const filePath = path.join(os.tmpdir(), pathname);
        content = await fs.readFile(filePath);
        const ext = path.extname(pathname).slice(1).toLowerCase();
        contentType = EXT_TO_MIME[ext] || "application/octet-stream";
      }

      if (totalBytes + content.length > MAX_TOTAL_BYTES) {
        console.warn(`[email-images] skipping ${pathname} — MAX_TOTAL_BYTES limit reached`);
        continue;
      }

      totalBytes += content.length;
      attachments.push({
        cid,
        filename: path.basename(pathname),
        content,
        contentType,
        contentDisposition: "inline",
      });
      fetchedPathnameMap.set(pathname, cid);
    } catch (err) {
      console.warn(
        `[email-images] skipping ${pathname} — fetch failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Replace src URLs for successfully fetched images
  let rewrittenHtml = html;
  for (const [pathname, cid] of fetchedPathnameMap) {
    const escapedPathname = pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const srcRegex = new RegExp(`src="${escapedBase}/image-uploads/${escapedPathname}"`, "g");
    rewrittenHtml = rewrittenHtml.replace(srcRegex, `src="cid:${cid}"`);
  }

  console.log(
    `[email-images] inlined ${attachments.length} images, ${totalBytes} bytes (${matches.length} referenced, ${pathnameToCid.size} unique)`,
  );

  return { html: rewrittenHtml, attachments };
}
