import { waitUntil as vercelWaitUntil } from "@vercel/functions";

export function waitUntil(promise: Promise<unknown>): void {
  try {
    vercelWaitUntil(promise);
  } catch {
    // Local dev / non-Vercel environment — just let it run
    promise.catch((err) => console.error("waitUntil background error:", err));
  }
}
