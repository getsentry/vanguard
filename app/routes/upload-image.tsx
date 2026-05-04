import type { ActionFunctionArgs } from "react-router";
import { requireUserId } from "~/services/auth.server";
import { uploadFile, isAllowedImageType } from "~/lib/upload-handler";
import { InvalidImageError } from "~/lib/image-optimize";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") return Response.json({}, { status: 405 });
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!isAllowedImageType(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // sharp's image-optimize pipeline validates the bytes (not just the
  // claimed MIME type from the multipart form). If the buffer isn't a real
  // image — corrupt download, mismatched extension, truncated upload —
  // optimizeImage throws InvalidImageError; surface that as a 400 so the
  // user sees a useful error instead of a generic 500.
  let result;
  try {
    result = await uploadFile({
      mimeType: file.type,
      buffer,
      namespace: userId,
      variant: "post-image",
    });
  } catch (err) {
    if (err instanceof InvalidImageError) {
      return Response.json({ error: "Invalid image data" }, { status: 400 });
    }
    throw err;
  }

  return {
    url: result.url,
    originalFilename: file.name,
    width: result.width,
    height: result.height,
  };
}
