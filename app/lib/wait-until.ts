import { waitUntil as vercelWaitUntil } from "@vercel/functions";

export function waitUntil(promise: Promise<unknown>): void {
  try {
    vercelWaitUntil(promise);
    console.log("[waitUntil] handed promise to @vercel/functions waitUntil");
  } catch (err) {
    // Local dev / non-Vercel environment — just let it run
    console.log(
      "[waitUntil] @vercel/functions waitUntil threw — falling back to fire-and-forget",
      err instanceof Error ? err.message : String(err),
    );
    promise.catch((bgErr) => console.error("[waitUntil] background error:", bgErr));
  }
}
