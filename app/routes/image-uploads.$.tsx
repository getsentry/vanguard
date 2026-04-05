import os from "os";
import fs from "fs/promises";
import { redirect } from "@remix-run/node";
import type { GetSignedUrlConfig } from "@google-cloud/storage";
import { Storage } from "@google-cloud/storage";
import type { LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";

import path from "path";

import { requireUserId } from "~/services/auth.server";

const MAX_AGE = 60 * 60 ** 24;

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  if (process.env.GCS_EXPIRES_IN) {
    await requireUserId(request, context);
  }

  const fileParam = params["*"];

  invariant(fileParam, "filename is required");

  const useGcs = !!process.env.USE_GCS_STORAGE;

  // const filename = path.basename(fileParam);

  let stream: any;
  if (useGcs) {
    const bucketName = process.env.GCS_BUCKET_NAME as string;
    const bucketPath = process.env.GCS_BUCKET_PATH
      ? `${process.env.GCS_BUCKET_PATH}/`
      : "";

    const cloudStorage = new Storage();

    if (process.env.GCS_EXPIRES_IN) {
      const options: GetSignedUrlConfig = {
        version: "v4",
        action: "read",
        expires: Date.now() + parseInt(process.env.GCS_EXPIRES_IN),
      };

      const [url] = await cloudStorage
        .bucket(bucketName)
        .file(`${bucketPath}${fileParam}`)
        .getSignedUrl(options);
      return redirect(url);
    } else {
      // const file = cloudStorage
      //   .bucket(bucketName)
      //   .file(`${bucketPath}${params.filename}`);
      // stream = file.createReadStream();
      const normalizedFileParam = fileParam.normalize("NFC");
      const url = `https://storage.googleapis.com/${bucketName}/${bucketPath}${normalizedFileParam}`;
      return redirect(url);
    }
  } else {
    const filepath = path.format({
      dir: os.tmpdir(),
      base: fileParam,
    });
    const fd = await fs.open(filepath, "r");
    stream = fd.createReadStream();
    return new Response(stream, {
      status: 200,
      headers: {
        "Cache-Control": `max-age=${MAX_AGE}, s-maxage=${MAX_AGE}`,
      },
    });
  }
}
