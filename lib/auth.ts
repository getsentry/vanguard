import { IncomingMessage } from "http";
import React, { useContext } from "react";

import { OAuth2Client } from "google-auth-library";

const oAuth2Client = new OAuth2Client();

async function verifyJwt(token: string) {
  // TODO: need to cache this?
  const response = await oAuth2Client.getIapPublicKeys();
  const ticket = await oAuth2Client.verifySignedJwtWithCertsAsync(
    token,
    response.pubkeys,
    process.env.GOOGLE_IAP_AUDIENCE,
    ["https://cloud.google.com/iap"]
  );

  const payload = ticket.getPayload();
  return payload;
}

export type User = {
  name: string;
  email: string;
};

export const AuthContext = React.createContext<User | null>(null);

export const useAuth = () => {
  const user = useContext(AuthContext);

  return user;
};

export async function getAuthFromReq(
  req: IncomingMessage
): Promise<User | null> {
  if (process.env.NODE_ENV !== "production") {
    return {
      name: "Dummy User",
      email: "dummy@example.com",
    };
  }

  const token = req.headers["x-goog-iap-jwt-assertion"];
  if (token) {
    // TODO: fetch public key and do the thing
    const payload = await verifyJwt(token as string);
    return {
      name: payload!.name as string,
      email: payload!.email as string,
    };
  }

  return null;
}
