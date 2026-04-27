// @ts-nocheck
import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { action } from "./upload-image";

const buildUploadRequest = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return buildRequest(
    "http://localhost/upload-image",
    { method: "POST", body: formData },
    { user: DefaultFixtures.DEFAULT_USER },
  );
};

describe("POST /upload-image", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: await buildRequest(`http://localhost/upload-image`, {
          method: "POST",
        }),
        params: {},
        context: {},
      }),
    );
  });

  it("rejects SVG uploads", async () => {
    const svg = new File(["<svg><script>alert(1)</script></svg>"], "evil.svg", {
      type: "image/svg+xml",
    });
    const request = await buildUploadRequest(svg);
    const response = await action({ request, params: {}, context: {} });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/JPEG|PNG|GIF|WebP/i);
  });

  it("rejects HTML uploads disguised as images", async () => {
    const html = new File(["<html><script>alert(1)</script></html>"], "page.html", {
      type: "text/html",
    });
    const request = await buildUploadRequest(html);
    const response = await action({ request, params: {}, context: {} });
    expect(response.status).toBe(400);
  });

  it("accepts JPEG uploads", async () => {
    // 1x1 white JPEG (minimal valid JPEG bytes)
    const jpegBytes = Buffer.from(
      "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b08000100010101110003ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda00080101000005021affd9",
      "hex",
    );
    const jpeg = new File([jpegBytes], "photo.jpg", { type: "image/jpeg" });
    const request = await buildUploadRequest(jpeg);
    const response = await action({ request, params: {}, context: {} });
    // Should not be a 400 (actual upload may fail in test env, that's OK)
    expect(response.status).not.toBe(400);
  });
});
