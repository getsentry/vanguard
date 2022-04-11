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
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import baseCss from "./styles/base.css";
import fontsCss from "./styles/fonts.css";
import { getUser } from "./session.server";
import { useUser } from "./utils";

import Logo from "app/icons/Logo";
import { Toaster } from "react-hot-toast";

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
};

export const loader: LoaderFunction = async ({ request }) => {
  return json<LoaderData>({
    user: await getUser(request),
  });
};

export default function App() {
  const user = useUser();

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="wrapper">
        <div>
          <Toaster />
        </div>
        <div id="primary">
          <div className="container">
            <div className="header">
              <h1>
                <Link to="/">
                  <Logo height={32} />
                </Link>
              </h1>
            </div>
            <Outlet />
          </div>
        </div>
        <div id="secondary">
          <div className="content">
            <div className="header">
              <Link to="/new-post" className="btn primary">
                + New Post
              </Link>
              <Link to="/drafts" className="block p-4 text-xl text-blue-500">
                / Drafts
              </Link>
            </div>
            <div>{user.email}</div>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
