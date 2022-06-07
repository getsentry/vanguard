import { useState, useEffect } from "react";

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
import styled, { ThemeProvider, css } from "styled-components";
import breakpoint from "styled-components-breakpoint";
import prismCss from "prism-sentry/index.css";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import GlobalStyles from "./styles/global";

import fontsCss from "./styles/fonts.css";
import { lightTheme, darkTheme } from "./styles/theme";
import { getSession, getUser, sessionStorage } from "./session.server";
import Footer from "./components/footer";
import Header from "./components/header";
import Container from "./components/container";
import { Sidebar, SidebarSection } from "./components/sidebar";

import { Toaster } from "react-hot-toast";
import * as Sentry from "./lib/sentry-remix-client";
import { CategoryTag, CategoryTags } from "./components/category-tag";
import Input from "./components/input";
import { getCategoryList } from "./models/category.server";
import Avatar from "./components/avatar";

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
          <Container>
            <Header />
            <h1>Internal Server Error</h1>
            <pre>{error.stack}</pre>
          </Container>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user, categoryList, ENV } = useLoaderData();
  const [theme, setTheme] = useState("light");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        if (event.matches) {
          setTheme("dark");
        } else {
          setTheme("light");
        }
      });
  }, []);

  const handleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <html lang="en">
      <head>
        <Sentry.Component />
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
        <GlobalStyles />
        <body className={showSidebar ? "showSidebar" : ""}>
          <div>
            <Toaster />
          </div>
          <Primary>
            <Container>
              <Header showSidebar={showSidebar} handleSidebar={handleSidebar} />
              <Outlet />
              <Footer version={ENV.VERSION} admin={user.admin} />
            </Container>
          </Primary>
          <Sidebar showSidebar={showSidebar}>
            <SidebarSection>
              <UserMenu>
                <Link to="/settings">
                  <Avatar user={user} size="3.4rem" />
                </Link>
                <Link to="/settings" className="btn secondary">
                  Settings
                </Link>
                <UserMenuDivider />
                <Link to="/drafts" className="btn">
                  Drafts
                </Link>
              </UserMenu>
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
                  <CategoryTag key={category.id} category={category} />
                ))}
              </CategoryTags>
            </SidebarSection>
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

const Primary = styled.div`
  padding-bottom: 6rem;
  transition: margin-right 0.2s ease-in-out;

  ${breakpoint("desktop")`
    width: 80%;
    padding: 0 5rem;
    margin-right: 40rem;
  `}
`;

const UserMenu = styled.div`
  align-items: center;
  display: flex;
`;

const UserMenuDivider = styled.div`
  color: ${(p) => p.theme.borderColor};
  font-family: "IBM Plex Mono", monospaced;
  &:before {
    content: "/";
  }
`;
