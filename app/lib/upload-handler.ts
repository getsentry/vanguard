import {
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  writeAsyncIterableToWritable,
} from "@remix-run/node";
import { Storage } from "@google-cloud/storage";
import type { FileUploadHandlerOptions } from "@remix-run/node/dist/upload/fileUploadHandler";
import type { UploadHandler } from "@remix-run/node";
import path from "path";
import { createId as cuid } from "@paralleldrive/cuid2";

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
}: UploadHandlerOptions): UploadHandler {
  const useGcs = !!process.env.USE_GCS_STORAGE;

  let handler: UploadHandler;
  if (useGcs) {
    handler = createCloudStorageUploadHandler({
      namespace,
      filter,
      urlPrefix,
      fieldName,
    });
  } else {
    handler = async (params) => {
      const { name } = params;
      if (name !== fieldName) {
        return undefined;
      }

      const fileHandler = unstable_createFileUploadHandler({
        filter,
        file: ({ filename }) => `${namespace}/${filename}`,
      });
      const file = await fileHandler(params);
      if (file && file.name) return `${urlPrefix}/${namespace}/${file.name}`;
      // if you dont return a non-false value (aka null or undefined) it will
      // go to the next upload handler, which is in-memory, and return an object
      // with params we dont want
      return "";
    };
  }

  return unstable_composeUploadHandlers(
    handler,
    unstable_createMemoryUploadHandler(),
  );
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
  return async (params): Promise<string | undefined> => {
    const { name, data, filename } = params;
    if (fieldName && name !== fieldName) {
      return undefined;
    }

    // if you dont return a non-false value (aka null or undefined) it will
    // go to the next upload handler, which is in-memory, and return an object
    // with params we dont want
    if (!filename) {
      return "";
    }
    if (filter && !filter(params)) {
      return "";
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

    await writeAsyncIterableToWritable(data, file.createWriteStream());

    return `${urlPrefix}/${newFilename}`;
  };
}
