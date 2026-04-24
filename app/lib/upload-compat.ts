/**
 * Compatibility shims for Remix upload utilities removed in React Router v7.
 * TODO Worker 8: Replace with Vercel Blob upload handling.
 */

export type UploadHandler = (
  part: UploadHandlerPart,
) => Promise<File | string | null | undefined>;

export type UploadHandlerPart = {
  name: string;
  filename?: string;
  contentType: string;
  data: AsyncIterable<Uint8Array>;
};

export async function unstable_parseMultipartFormData(
  request: Request,
  uploadHandler: UploadHandler,
): Promise<FormData> {
  // Stub: returns empty FormData. Worker 8 will implement proper multipart parsing.
  console.warn(
    "unstable_parseMultipartFormData: stub implementation, uploads not functional",
  );
  return new FormData();
}

export function unstable_composeUploadHandlers(
  ...handlers: UploadHandler[]
): UploadHandler {
  return async (part) => {
    for (const handler of handlers) {
      const result = await handler(part);
      if (result !== undefined && result !== null) return result;
    }
    return undefined;
  };
}

export function unstable_createMemoryUploadHandler(): UploadHandler {
  return async (_part) => undefined;
}

export function unstable_createFileUploadHandler(_opts: any): UploadHandler {
  return async (_part) => undefined;
}
