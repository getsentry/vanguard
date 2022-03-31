import type { NextFetchEvent, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest, ev: NextFetchEvent) {
  const token = req.headers.get("x-goog-iap-jwt-assertion");
  if (!token) {
    return new Response("Unauthenticated");
  }
  // TODO: fetch public key
  const decoded = jwt.verify(
    token,
    "https://www.gstatic.com/iap/verify/public_key"
  );
}
