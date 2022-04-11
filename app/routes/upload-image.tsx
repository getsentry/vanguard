import { ActionFunction } from "@remix-run/server-runtime";
import { Storage } from "@google-cloud/storage";
import { json } from "@remix-run/node";
import {
  unstable_createFileUploadHandler,
  unstable_parseMultipartFormData,
  UploadHandler,
} from "@remix-run/node";
import { requireUserId } from "~/session.server";
import cuid from "cuid";
import invariant from "tiny-invariant";
import { FileUploadHandlerOptions } from "@remix-run/node/upload/fileUploadHandler";
import path from "path";

type CloudStorageUploaderHandlerOptions = {
  userId: string;
  fieldName?: string;
  filter?: FileUploadHandlerOptions["filter"];
};

function createCloudStorageUploadHandler({
  userId,
  fieldName = "file",
}: CloudStorageUploaderHandlerOptions): UploadHandler {
  return async ({ name, stream, filename }): Promise<string | undefined> => {
    if (name !== fieldName) {
      stream.resume();
      return;
    }

    const bucketName = process.env.GCS_BUCKET_NAME as string;
    const bucketPath = process.env.GCS_BUCKET_PATH
      ? `${process.env.GCS_BUCKET_PATH}/`
      : "";

    const newFilename = `${userId}-${cuid()}${path.extname(filename)}`;

    const cloudStorage = new Storage();
    const file = cloudStorage
      .bucket(bucketName)
      .file(`${bucketPath}${newFilename}`);

    await new Promise((resolve, reject) => {
      stream
        .pipe(file.createWriteStream())
        .on("finish", resolve)
        .on("error", reject);
    });

    return `/image-uploads/${newFilename}`;
  };
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") return json({}, 405);
  const userId = await requireUserId(request);
  const useGcs = !!process.env.USE_GCS_STORAGE;

  const filter = ({ mimetype }: { mimetype: string }) => {
    return /image/i.test(mimetype);
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    useGcs
      ? createCloudStorageUploadHandler({ userId, filter })
      : unstable_createFileUploadHandler({
          filter,
        })
  );
  const file = formData.get("file");
  invariant(file, "file is required");

  const imageUrl = useGcs ? file : `/image-uploads/${file.name}`;

  const width = 0;
  const height = 0;

  return json({ originalFilename: "", url: imageUrl, width, height });
};
