import os from "os";
import fs from "fs/promises";
import { Storage } from "@google-cloud/storage";
import { LoaderFunction, Response } from "@remix-run/node";
import invariant from "tiny-invariant";

import { requireUserId } from "~/session.server";
import path from "path";

const MAX_AGE = 60 * 60 ** 24;

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireUserId(request);

  const fileParam = params["*"];

  invariant(fileParam, "filename is required");

  const useGcs = !!process.env.USE_GCS_STORAGE;

  // const filename = path.basename(fileParam);

  let stream: any;
  if (useGcs) {
    const bucketName = process.env.GCS_BUCKET_NAME as string;
    const bucketPath = (process.env.BCS_BUCKET_PATH as string) ?? "";

    const cloudStorage = new Storage();

    const file = cloudStorage
      .bucket(bucketName)
      .file(`${bucketPath}${params.filename}`);
    stream = file.createReadStream();
  } else {
    const filepath = path.format({
      dir: os.tmpdir(),
      base: fileParam,
    });
    const fd = await fs.open(filepath, "r");
    stream = fd.createReadStream();
  }

  return new Response(stream, {
    status: 200,
    headers: {
      "Cache-Control": `max-age=${MAX_AGE}, s-maxage=${MAX_AGE}`,
    },
  });
};
