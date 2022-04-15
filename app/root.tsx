import { useState } from "react";

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
import { ThemeProvider } from 'styled-components';

import tailwindStylesheetUrl from "./styles/tailwind.css";
import GlobalStyles from "./styles/global";

import fontsCss from "./styles/fonts.css";
import {lightTheme, darkTheme} from "./styles/theme";
import { getSession, getUser, sessionStorage } from "./session.server";
import Header from "./components/header";
import Sidebar from "./components/sidebar";

import Logo from "./icons/Logo";
import { Toaster } from "react-hot-toast";
import * as Sentry from "./lib/sentry/client";
import SidebarWrapper from "./components/sidebar";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: fontsCss },
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
            <Header/>
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
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    theme === 'light' ? setTheme('dark') : setTheme('light');
    console.log("theme toggled");
  }

  return (
    <html lang="en" className="h-full">
      <head>
        <Sentry.Component />
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        <GlobalStyles />
        <body className="wrapper">
          <div>
            <Toaster />
          </div>
          <div id="primary">
            <div className="container">
              <Header toggleTheme={toggleTheme}/>
              <Outlet />
            </div>
          </div>
          <Sidebar>
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
            <Link to={`/u/${user.email}`}>{user.email}</Link>
          </Sidebar>
          <ScrollRestoration />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(ENV)}`,
            }}
          />
          <Scripts />
          <LiveReload />
        </body>
      </ThemeProvider>
    </html>
  );
}
