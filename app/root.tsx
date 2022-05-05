import { useState } from "react";

import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { ThemeProvider } from "styled-components";
import prismCss from "prism-sentry/index.css";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import GlobalStyles from "./styles/global";

import fontsCss from "./styles/fonts.css";
import { lightTheme, darkTheme } from "./styles/theme";
import { getSession, getUser, sessionStorage } from "./session.server";
import Footer from "./components/footer";
import Header from "./components/header";
import { Sidebar, SidebarSection } from "./components/sidebar";

import { Toaster } from "react-hot-toast";
import * as Sentry from "./lib/sentry-remix-client";
import { CategoryTag, CategoryTags } from "./components/category-tag";
import Input from "./components/input";
import { getCategoryList } from "./models/category.server";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: fontsCss },
    { rel: "stylesheet", href: prismCss },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Vanguard",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  categoryList: Awaited<ReturnType<typeof getCategoryList>>;
  ENV: { [key: string]: any };
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const cookie = await sessionStorage.commitSession(session);
  const user = await getUser(request);

  // probably a cleaner way to build this, but we're here for the duct tape
  const pathname = new URL(request.url).pathname;
  if (!user!.name && pathname !== "/welcome") {
    // send em to onboarding
    const redirectTo = new URL(request.url).pathname;
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    return redirect(`/welcome?${searchParams}`);
  }

  const categoryList = await getCategoryList({
    userId: user!.id,
    includeRestricted: true,
  });

  return json<LoaderData>(
    {
      user,
      categoryList,
      ENV: {
        SENTRY_DSN: process.env.SENTRY_DSN,
        NODE_ENV: process.env.NODE_ENV || "development",
        VERSION: process.env.VERSION,
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
  // TODO(dcramer): verify if this is useful
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
            <Header />
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
  const { user, categoryList, ENV } = useLoaderData();
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <Sentry.Component />
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
        <GlobalStyles />
        <body className="wrapper">
          <div>
            <Toaster />
          </div>
          <div id="primary">
            <div className="container">
              <Header toggleTheme={toggleTheme} />
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
            <Link to="/settings" className="btn">
              / Settings
            </Link>
            <SidebarSection>
              <Link to={`/u/${user.email}`}>{user.email}</Link>
            </SidebarSection>
            <SidebarSection>
              <Form method="get" action="/search">
                <Input
                  variant="search"
                  name="q"
                  placeholder="Search posts..."
                />
              </Form>
            </SidebarSection>
            <SidebarSection>
              <h6>Sections</h6>
              <CategoryTags>
                {categoryList.map((category) => (
                  <CategoryTag category={category} />
                ))}
              </CategoryTags>
            </SidebarSection>
          </Sidebar>
          <Footer version={ENV.VERSION} />
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
