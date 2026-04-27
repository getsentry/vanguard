import type { ActionFunctionArgs } from "react-router";
import { requireUserId } from "~/services/auth.server";
import { uploadFile } from "~/lib/upload-handler";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") return Response.json({}, { status: 405 });
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadFile({
    filename: file.name,
    buffer,
    namespace: userId,
  });

  return { url, originalFilename: file.name, width: 0, height: 0 };
}
