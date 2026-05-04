import sharp from "sharp";
import { optimizeImage } from "./image-optimize";

// Pixel canvas built by sharp itself, so we don't need any binary fixtures
// committed to the repo.
async function buildSolidImage(
  width: number,
  height: number,
  format: "jpeg" | "png" | "gif",
): Promise<Buffer> {
  const base = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 50, b: 50 },
    },
  });
  if (format === "jpeg") return base.jpeg({ quality: 95 }).toBuffer();
  if (format === "png") return base.png().toBuffer();
  return base.gif().toBuffer();
}

describe("optimizeImage", () => {
  test("avatar: resizes a giant JPG to 512x512 WebP and shrinks dramatically", async () => {
    const source = await buildSolidImage(4000, 3000, "jpeg");
    const out = await optimizeImage(source, "image/jpeg", "avatar");

    expect(out.mimeType).toBe("image/webp");
    expect(out.width).toBe(512);
    expect(out.height).toBe(512);
    // Solid-colour 4000x3000 JPG at q95 is comfortably north of 100 KB; the
    // 512x512 WebP should be tiny. Use a generous ratio to stay robust.
    expect(out.buffer.length).toBeLessThan(source.length / 5);
  });

  test("post-image: downscales to 1600 wide, preserves aspect, becomes WebP", async () => {
    const source = await buildSolidImage(3200, 2400, "png");
    const out = await optimizeImage(source, "image/png", "post-image");

    expect(out.mimeType).toBe("image/webp");
    expect(out.width).toBe(1600);
    expect(out.height).toBe(1200);
  });

  test("post-image: does not enlarge a small source", async () => {
    const source = await buildSolidImage(800, 600, "png");
    const out = await optimizeImage(source, "image/png", "post-image");

    expect(out.width).toBe(800);
    expect(out.height).toBe(600);
  });

  test("gif passes through unchanged", async () => {
    const source = await buildSolidImage(64, 64, "gif");
    const out = await optimizeImage(source, "image/gif", "post-image");

    expect(out.mimeType).toBe("image/gif");
    expect(out.buffer).toBe(source);
    expect(out.width).toBe(64);
    expect(out.height).toBe(64);
  });

  test("avatar: strips EXIF metadata", async () => {
    const source = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: "#888" },
    })
      .withMetadata({
        exif: { IFD0: { Copyright: "secret-marker" } },
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Sanity: source actually has the EXIF block we wrote.
    const sourceMeta = await sharp(source).metadata();
    expect(sourceMeta.exif).toBeDefined();

    const out = await optimizeImage(source, "image/jpeg", "avatar");
    const outMeta = await sharp(out.buffer).metadata();
    expect(outMeta.exif).toBeUndefined();
  });
});
