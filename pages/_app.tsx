import { AppContext, AppProps } from "next/app";
import ErrorPage from "next/error";
import React from "react";

import { User, AuthContext, getAuthFromReq } from "../lib/auth";
import Layout from "../components/layout";

interface CustomAppProps extends AppProps {
  user: User;
}

const App = ({ Component, pageProps, user }: CustomAppProps) => {
  if (!user) {
    return <ErrorPage statusCode={401} title="Authentication required" />;
  }

  return (
    <AuthContext.Provider value={user}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthContext.Provider>
  );
};

App.getInitialProps = async ({ ctx: { req } }: AppContext) => {
  if (!req) return {};
  const user = getAuthFromReq(req);
  return {
    user: user,
  };
};

export default App;
