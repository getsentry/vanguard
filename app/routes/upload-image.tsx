import { type ActionFunctionArgs } from "react-router";
import { requireUserId } from "~/services/auth.server";
import uploadHandler from "~/lib/upload-handler";
import { unstable_parseMultipartFormData } from "~/lib/upload-compat";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") return Response.json({}, { status: 405 });
  const userId = await requireUserId(request);

  const filter:
    | ((args: {
        filename?: string;
        contentType: string;
        name: string;
      }) => boolean | Promise<boolean>)
    | undefined = ({ contentType }) => {
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

  return { originalFilename: "", url: imageUrl, width, height };
}
