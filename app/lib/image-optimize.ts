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
 * Behaviour:
 * - Honours EXIF orientation via `.rotate()` BEFORE the resize, then sharp's
 *   default behaviour drops the metadata block (no Copyright / GPS leak).
 * - Re-encodes JPEG / PNG / WebP inputs as WebP at quality 82.
 * - Passes `image/gif` through unchanged — re-encoding kills animation, and
 *   GIFs are rare enough as avatars or post images that a one-off pass is fine.
 * - Safety net for `post-image`: if the WebP output ends up larger than the
 *   source (rare for tiny PNG icons or already-WebP inputs), keep the source
 *   bytes (still rotated, still EXIF-stripped) so we never make things worse.
 *   `avatar` always returns the resized WebP — avatars need predictable
 *   dimensions even when the source happens to be small.
 */
export async function optimizeImage(
  input: Buffer,
  mimeType: string,
  variant: ImageVariant,
): Promise<OptimizedImage> {
  if (mimeType === "image/gif") {
    const meta = await sharp(input).metadata();
    return {
      buffer: input,
      mimeType,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  }

  const cfg = VARIANTS[variant];
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: cfg.width,
      height: cfg.height,
      fit: cfg.fit,
      withoutEnlargement: variant === "post-image",
    })
    .webp({ quality: cfg.quality })
    .toBuffer({ resolveWithObject: true });

  if (variant === "post-image" && data.length >= input.length) {
    const safe = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
    return {
      buffer: safe.data,
      mimeType,
      width: safe.info.width,
      height: safe.info.height,
    };
  }

  return {
    buffer: data,
    mimeType: "image/webp",
    width: info.width,
    height: info.height,
  };
}
