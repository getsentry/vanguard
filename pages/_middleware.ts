import type { NextFetchEvent, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

type User = {
  name: string;
  email: string;
};

export function middleware(req: NextRequest, ev: NextFetchEvent) {
  const token = req.headers.get("x-goog-iap-jwt-assertion");
  if (process.env.NODE_ENV !== "production") {
    return;
  } else if (!token) {
    return new Response("Unauthenticated", {
      status: 401,
    });
  }

  // TODO: fetch public key
  const decoded = jwt.verify(
    token,
    "https://www.gstatic.com/iap/verify/public_key"
  );
}
