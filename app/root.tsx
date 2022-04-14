import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import baseCss from "./styles/base.css";
import fontsCss from "./styles/fonts.css";
import { getSession, getUser, sessionStorage } from "./session.server";

import Logo from "./icons/Logo";
import { Toaster } from "react-hot-toast";
import * as Sentry from "./lib/sentry/client";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: fontsCss },
    { rel: "stylesheet", href: baseCss },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Vanguard",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  ENV: { [key: string]: any };
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const cookie = await sessionStorage.commitSession(session);
  return json<LoaderData>(
    {
      user: await getUser(request),
      ENV: {
        SENTRY_DSN: process.env.SENTRY_DSN,
        NODE_ENV: process.env.NODE_ENV || "development",
      },
    },
    // XXX(dcramer): is this the best way to ensure the session is persisted here?
    {
      headers: {
        "Set-Cookie": cookie,
      },
    }
  );
};

export function ErrorBoundary({ error }) {
  console.error(error);
  Sentry.captureException(error);
  return (
    <html>
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <body className="wrapper">
        <div id="primary">
          <div className="container">
            <div className="header">
              <Link to="/">
                <Logo height={32} />
              </Link>
            </div>
            <h1>Internal Server Error</h1>
            <pre>{error.stack}</pre>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user, ENV } = useLoaderData();

  return (
    <html lang="en" className="h-full">
      <head>
        <Sentry.Component />
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <body className="wrapper">
        <div>
          <Toaster />
        </div>
        <div id="primary">
          <div className="container">
            <div className="header">
              <Link to="/">
                <Logo height={32} className="logo" />
              </Link>
            </div>
            <Outlet />
          </div>
        </div>
        <div id="secondary">
          <div className="content">
            <div className="header flex justify-between">
              <Link to="/new-post" className="btn btn-primary">
                + New Post
              </Link>
              <Link to="/drafts" className="btn">
                / Drafts
              </Link>
              {user.admin && (
                <Link to="/admin" className="btn">
                  / Admin
                </Link>
              )}
            </div>
            <div>
              <Link to={`/u/${user.email}`}>{user.email}</Link>
            </div>
          </div>
        </div>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
