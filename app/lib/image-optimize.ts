import sharp from "sharp";

/**
 * Variants the upload pipeline knows how to produce. Each variant has its own
 * size + quality budget — avatars are always square and small, post images
 * preserve aspect ratio and cap at a sensible web-display width.
 */
export type ImageVariant = "avatar" | "post-image";

export type OptimizedImage = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
};

/**
 * Thrown when the input buffer can't be decoded as an image. The route layer
 * catches this and returns a clean 400 instead of letting libvips' message
 * bubble up as a 500. Wrapping all sharp errors here means callers don't need
 * to pattern-match on libvips strings (`Input buffer contains unsupported
 * image format`, `pngload_buffer: end of stream`, `VipsWebp: …`, etc.).
 */
export class InvalidImageError extends Error {
  constructor(cause?: unknown) {
    super("Invalid image data");
    this.name = "InvalidImageError";
    if (cause !== undefined) this.cause = cause;
  }
}

const VARIANTS: Record<
  ImageVariant,
  { width: number; height?: number; fit: "cover" | "inside"; quality: number }
> = {
  avatar: { width: 512, height: 512, fit: "cover", quality: 82 },
  "post-image": { width: 1600, fit: "inside", quality: 82 },
};

/**
 * Resize, recompress, and EXIF-strip an uploaded image. Pure function — no
 * I/O, no env reads — so it's trivially testable and reusable from a future
 * backfill script.
 *
 * Detects the source format from the buffer itself via `sharp.metadata()`;
 * the caller's claimed MIME type is NOT consulted. That's deliberate: the
 * MIME comes from the multipart upload's Content-Type header, which is
 * client-controlled and could be forged to bypass processing (e.g. claiming
 * `image/gif` to skip the resize step).
 *
 * Behaviour:
 * - Honours EXIF orientation via `.rotate()` BEFORE the resize, then sharp's
 *   default behaviour drops the metadata block (no Copyright / GPS leak).
 * - Re-encodes JPEG / PNG / WebP / SVG / etc. inputs as WebP at quality 82.
 * - Passes genuinely-detected GIFs through unchanged — re-encoding kills
 *   animation, and GIFs are rare enough as avatars or post images that a
 *   one-off pass is fine.
 * - Safety net for `post-image`: if the WebP output ends up larger than the
 *   source (rare for tiny PNG icons or already-WebP inputs), keep the source
 *   bytes (still rotated, still EXIF-stripped) so we never make things worse.
 *   `avatar` always returns the resized WebP — avatars need predictable
 *   dimensions even when the source happens to be small.
 *
 * Throws {@link InvalidImageError} when the buffer is not a decodable image.
 */
export async function optimizeImage(input: Buffer, variant: ImageVariant): Promise<OptimizedImage> {
  let format: string | undefined;
  let metaWidth = 0;
  let metaHeight = 0;
  try {
    const meta = await sharp(input).metadata();
    format = meta.format;
    metaWidth = meta.width ?? 0;
    metaHeight = meta.height ?? 0;
  } catch (err) {
    throw new InvalidImageError(err);
  }

  if (format === "gif") {
    return {
      buffer: input,
      mimeType: "image/gif",
      width: metaWidth,
      height: metaHeight,
    };
  }

  const cfg = VARIANTS[variant];
  let data: Buffer;
  let info: { width: number; height: number };
  try {
    const result = await sharp(input)
      .rotate()
      .resize({
        width: cfg.width,
        height: cfg.height,
        fit: cfg.fit,
        withoutEnlargement: variant === "post-image",
      })
      .webp({ quality: cfg.quality })
      .toBuffer({ resolveWithObject: true });
    data = result.data;
    info = result.info;
  } catch (err) {
    throw new InvalidImageError(err);
  }

  if (variant === "post-image" && data.length >= input.length) {
    try {
      const safe = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
      return {
        buffer: safe.data,
        // Use the detected format's MIME, not the caller's claim — at this
        // point we know what the bytes really are.
        mimeType: formatToMime(format) ?? "application/octet-stream",
        width: safe.info.width,
        height: safe.info.height,
      };
    } catch (err) {
      throw new InvalidImageError(err);
    }
  }

  return {
    buffer: data,
    mimeType: "image/webp",
    width: info.width,
    height: info.height,
  };
}

function formatToMime(format: string | undefined): string | undefined {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return undefined;
  }
}
