import {
  type ActionFunctionArgs,
  json,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { requireUserId } from "~/services/auth.server";
import uploadHandler from "~/lib/upload-handler";
import type { FileUploadHandlerOptions } from "@remix-run/node/dist/upload/fileUploadHandler";

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") return json({}, 405);
  const userId = await requireUserId(request, context);

  const filter: FileUploadHandlerOptions["filter"] = ({ contentType }) => {
    return /image/i.test(contentType);
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler({
      fieldName: "file",
      namespace: userId,
      filter,
      urlPrefix: "/image-uploads",
    }),
  );

  const imageUrl = formData.get("file");

  const width = 0;
  const height = 0;

  return json({ originalFilename: "", url: imageUrl, width, height });
}
