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
import styled, { ThemeProvider } from "styled-components";
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
import { CategoryTag, CategoryTags } from "./components/category-tag";
import Input from "./components/input";
import { getCategoryList } from "./models/category.server";
import Avatar from "./components/avatar";
import { getPostList } from "./models/post.server";
import PostList from "./components/post-list";
import moment from "moment";

import { withSentry, setUser, captureException } from "@sentry/remix";
import LoadingIndicator from "./components/loading-indicator";

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

moment.locale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "1s",
    ss: "%ss",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dd",
    M: "1M",
    MM: "%dM",
    y: "1Y",
    yy: "%dY",
  },
});

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  categoryList?: Awaited<ReturnType<typeof getCategoryList>> | null;
  recentPostList?: Awaited<ReturnType<typeof getPostList>> | null;
  ENV: { [key: string]: any };
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const cookie = await sessionStorage.commitSession(session);
  const user = await getUser(request);

  setUser(user);

  if (user) {
    // probably a cleaner way to build this, but we're here for the duct tape
    const pathname = new URL(request.url).pathname;
    if (!user!.name && pathname.indexOf("/welcome") !== 0) {
      // send em to onboarding
      const redirectTo = new URL(request.url).pathname;
      const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
      return redirect(`/welcome?${searchParams}`);
    }
  }

  const loaderData: LoaderData = {
    user,
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN,
      NODE_ENV: process.env.NODE_ENV || "development",
      VERSION: process.env.VERSION,
    },
  };

  if (user) {
    loaderData.categoryList = await getCategoryList({
      userId: user?.id,
      includeRestricted: true,
    });

    loaderData.recentPostList = await getPostList({
      userId: user?.id,
      published: true,
      limit: 3,
    });
  }

  return json<LoaderData>(
    loaderData,
    // XXX(dcramer): is this the best way to ensure the session is persisted here?
    {
      headers: {
        "Set-Cookie": cookie,
      },
    }
  );
};

export function ErrorBoundary({ error }: any) {
  console.error(error);
  // TODO(dcramer): verify if this is useful
  captureException(error);
  return (
    <html lang="en">
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <ThemeProvider theme={lightTheme}>
        <GlobalStyles />
        <body>
          <Primary>
            <Container>
              <Header />
              <h1>Internal Server Error</h1>
              <pre>{error.stack}</pre>
            </Container>
          </Primary>
          <Scripts />
        </body>
      </ThemeProvider>
    </html>
  );
}

function App() {
  const { user, categoryList, recentPostList, ENV } = useLoaderData();
  const [theme, setTheme] = useState("light");
  const [showSidebar, setShowSidebar] = useState(false);

  setUser(user);

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
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
        <GlobalStyles />
        <body className={showSidebar ? "showSidebar" : ""}>
          <LoadingIndicator />
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
            {categoryList && categoryList.length > 0 && (
              <SidebarSection>
                <h6>Divisions</h6>
                <CategoryTags>
                  {categoryList.map((category: any) => (
                    <CategoryTag key={category.id} category={category} />
                  ))}
                </CategoryTags>
              </SidebarSection>
            )}
            {recentPostList && recentPostList.length > 0 && (
              <SidebarSection>
                <h6>Recent Posts</h6>
                <PostList postList={recentPostList} />
              </SidebarSection>
            )}
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
    position: relative;
    z-index: 1;
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

const Fallback = () => (
  <html lang="en">
    <head>
      <title>Oh no!</title>
      <Meta />
      <Links />
      {typeof document === "undefined" ? "__STYLES__" : null}
    </head>
    <ThemeProvider theme={lightTheme}>
      <GlobalStyles />
      <body>
        <Primary>
          <Container>
            <Header />
            <h1>
              Something bad happened. Don't worry, we've sent the error to
              Sentry and we are on the case!
            </h1>
          </Container>
        </Primary>
        <Scripts />
      </body>
    </ThemeProvider>
  </html>
);

export default withSentry(App, {
  errorBoundaryOptions: { fallback: <Fallback /> },
});
