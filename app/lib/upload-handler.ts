import { UploadHandler } from "@remix-run/node";
import { Storage } from "@google-cloud/storage";
import { FileUploadHandlerOptions } from "@remix-run/node/upload/fileUploadHandler";
import { unstable_createFileUploadHandler } from "@remix-run/node";
import path from "path";
import cuid from "cuid";

type UploadHandlerOptions = {
  namespace: string;
  filter: FileUploadHandlerOptions["filter"];
  urlPrefix: string;
  fieldName?: string;
};

/**
 * Return an upload handler based on the server configuration.
 *
 * Result of uploads must always be a persistent file URL configured to server the file.
 */
export default function uploadHandler({
  namespace,
  filter,
  urlPrefix,
  fieldName,
}: UploadHandlerOptions) {
  const useGcs = !!process.env.USE_GCS_STORAGE;

  if (useGcs)
    return createCloudStorageUploadHandler({
      namespace,
      filter,
      urlPrefix,
      fieldName,
    });

  return async (...rest) => {
    const handler = unstable_createFileUploadHandler({
      filter,
    });
    const file = await handler(...rest);
    if (file && file.name) return `${urlPrefix}/${file.name}`;
    return file;
  };
}

export type CloudStorageUploaderHandlerOptions = {
  namespace: UploadHandlerOptions["namespace"];
  fieldName?: UploadHandlerOptions["fieldName"];
  urlPrefix?: UploadHandlerOptions["urlPrefix"];
  filter?: FileUploadHandlerOptions["filter"];
};

export function createCloudStorageUploadHandler({
  namespace,
  fieldName = "file",
  urlPrefix,
  filter,
}: CloudStorageUploaderHandlerOptions): UploadHandler {
  return async (data): Promise<string | undefined> => {
    const { name, stream, filename } = data;
    if (fieldName && name !== fieldName) {
      stream.resume();
      return;
    }

    if (filter && !filter(data)) {
      stream.resume();
      return;
    }

    const bucketName = process.env.GCS_BUCKET_NAME as string;
    const bucketPath = process.env.GCS_BUCKET_PATH
      ? `${process.env.GCS_BUCKET_PATH}/`
      : "";

    const newFilename = `${namespace}-${cuid()}${path.extname(filename)}`;

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

    return `${urlPrefix}/${newFilename}`;
  };
}
