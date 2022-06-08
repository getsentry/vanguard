import type { ActionFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { unstable_parseMultipartFormData } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import uploadHandler from "~/lib/upload-handler";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") return json({}, 405);
  const userId = await requireUserId(request);

  const filter = ({ mimetype }: { mimetype: string }) => {
    return /image/i.test(mimetype);
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler({
      fieldName: "file",
      namespace: userId,
      filter,
      urlPrefix: "/image-uploads",
    })
  );
  const imageUrl = formData.get("file");

  const width = 0;
  const height = 0;

  return json({ originalFilename: "", url: imageUrl, width, height });
};
