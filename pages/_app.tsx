import { AppContext, AppProps } from "next/app";
import ErrorPage from "next/error";
import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import React from "react";

type User = {
  name: string;
  email: string;
};

const AuthContext = React.createContext<User | null>(null);

export function getAuth(req: IncomingMessage): User | null {
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

interface CustomAppProps extends AppProps {
  user: User;
}

const App = ({ Component, pageProps, user }: CustomAppProps) => {
  if (!user) {
    return <ErrorPage statusCode={401} title="Authentication required" />;
  }

  return (
    <AuthContext.Provider value={user}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
};

App.getInitialProps = async ({ ctx: { req } }: AppContext) => {
  if (!req) return {};
  const user = getAuth(req);
  return {
    user: user,
  };
};

export default App;
