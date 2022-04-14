// This is intended to be a somewhat agnostic abstraction to use IAP with Next.js

import jwt, { JwtPayload } from "jsonwebtoken";
import * as Sentry from "./sentry/client";

export type Identity = {
  id: string;
  name: string;
  email: string;
};

const GOOGLE_PUBLIC_KEY = "https://www.gstatic.com/iap/verify/public_key";

// TODO: cache
async function getSigningKey(kid: string): Promise<string | null> {
  const res = await fetch(GOOGLE_PUBLIC_KEY);
  const certs = await res.json();
  return certs[kid] || null;
}

function jwtAsyncVerify(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        getSigningKey(header.kid!).then((key) => {
          if (key) callback(null, key);
          else callback(new Error("Unable to find signing key"));
        });
      },
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as JwtPayload);
      }
    );
  });
}

async function verifyGoogleToken(token: string) {
  // Verify the id_token, and access the claims.
  const payload = await jwtAsyncVerify(token);

  const currentTime = new Date().getTime() / 1000;

  if (!payload.aud || payload.aud !== process.env.GOOGLE_IAP_AUDIENCE) {
    throw new Error("Invalid audience");
  }
  if (
    !payload.iat ||
    payload.iat < currentTime - 30 ||
    payload.iat > currentTime + 30
  ) {
    throw new Error("Invalid issue time");
  }
  if (!payload.exp || payload.exp < currentTime + 30) {
    throw new Error("Invalid expire time");
  }
  if (!payload.iss || payload.iss !== "https://cloud.google.com/iap") {
    throw new Error("Invalid issuer");
  }

  return payload;
}

export async function getIdentity(request: Request): Promise<Identity | null> {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "Dev environment bypassing authentication as jane.doe@example.com"
    );
    return {
      id: "dummy-iap-user",
      name: "Jane Doe",
      email: "jane.doe@example.com",
    };
  }

  const token = request.headers.get("x-goog-iap-jwt-assertion");
  if (token) {
    // TODO: fetch public key and do the thing
    let payload = null;
    try {
      payload = await verifyGoogleToken(token as string);
    } catch (err) {
      Sentry.captureException(err);
    }
    if (payload) {
      console.log(`IAP header verified as ${payload!.email}`);
      return {
        id: payload!.sub,
        name: payload!.name,
        email: payload!.email,
      };
    }
  }

  return null;
}
