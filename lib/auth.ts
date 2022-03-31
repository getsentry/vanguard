import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import React, { useContext } from "react";

export type User = {
  name: string;
  email: string;
};

export const AuthContext = React.createContext<User | null>(null);

export const useAuth = () => {
  const user = useContext(AuthContext);

  return user;
};

export function getAuthFromReq(req: IncomingMessage): User | null {
  if (process.env.NODE_ENV !== "production") {
    return {
      name: "Dummy User",
      email: "dummy@example.com",
    };
  }

  const token = req.headers["x-goog-iap-jwt-assertion"];
  if (token) {
    // TODO: fetch public key and do the thing
    const decoded = jwt.verify(
      token as string,
      "https://www.gstatic.com/iap/verify/public_key"
    );
  }

  return null;
}
