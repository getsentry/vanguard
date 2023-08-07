import type { Request } from "@remix-run/node";

export const buildUrl = (
  path: string = "/",
  request: Request | null = null,
): string => {
  if (!request) {
    if (process?.env?.BASE_URL) {
      return `${process.env.BASE_URL}${path}`;
    }
    return path;
  }

  if (!request) {
    throw new Error("Missing request or node ENV");
  }

  const host =
    request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");
  if (!host) {
    throw new Error("Could not determine domain URL.");
  }
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}${path}`;
};
