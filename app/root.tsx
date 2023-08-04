import type { PropsWithChildren } from "react";
import { useState, useEffect } from "react";

import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
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
  useRouteError,
} from "@remix-run/react";
import prismCss from "prism-sentry/index.css";
import { withSentry, setUser } from "@sentry/remix";
import { Toaster } from "react-hot-toast";

import fontsCss from "./styles/fonts.css";
import tailwindCss from "./styles/tailwind.css";
import GlobalStyles from "./styles/global";
import { getUser } from "./services/auth.server";
import Footer from "./components/footer";
import Header from "./components/header";
import Container from "./components/container";
import { Sidebar, SidebarSection } from "./components/sidebar";
import { CategoryTag, CategoryTags } from "./components/category-tag";
import Input from "./components/input";
import { getCategoryList } from "./models/category.server";
import Avatar from "./components/avatar";
import { getPostList } from "./models/post.server";
import PostList from "./components/post-list";
import LoadingIndicator from "./components/loading-indicator";
import DevNotice from "./components/dev-notice";
import { ThemeProvider, styled } from "styled-components";
import { darkTheme, lightTheme } from "./styles/theme";
import { breakpoint } from "./lib/breakpoints";

export const links: LinksFunction = () => {
  return [
    // TODO: this isnt really tailwind, and the processors werent ever really running
    // so we should either gut styled-components (which is a lot of work) or remove this
    // and implement our own base styles
    { rel: "stylesheet", href: tailwindCss },
    { rel: "stylesheet", href: fontsCss },
    { rel: "stylesheet", href: prismCss },
  ];
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  categoryList?: Awaited<ReturnType<typeof getCategoryList>> | null;
  recentPostList?: Awaited<ReturnType<typeof getPostList>> | null;
  ENV: { [key: string]: any };
  sentryTrace?: string;
  sentryBaggage?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  setUser(
    user
      ? {
          id: user.id,
          email: user.email,
        }
      : null,
  );

  // TODO(dcramer): remix is currently not respecting a root loader redirect
  // if (user) {
  //   // probably a cleaner way to build this, but we're here for the duct tape
  //   const pathname = new URL(request.url).pathname;
  //   if (!user.name && pathname.indexOf("/welcome") !== 0) {
  //     // send em to onboarding
  //     const searchParams = new URLSearchParams([["redirectTo", pathname]]);
  //     return redirect(`/welcome?${searchParams}`);
  //   }
  // }

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

  return json<LoaderData>(loaderData);
};

export function ErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <Document title="Internal Server Error">
      <div
        className="pb-24 xl:w-[80%] px-20 mr-[40rem] relative z-10"
        style={{
          transition: "margin-right 0.2s ease-in-out",
        }}
      >
        <Container>
          <Header />
          <h1>Internal Server Error</h1>
          {error.stack && (
            <pre className="whitespace-pre-wrap break-all text-left">
              {error.stack}
            </pre>
          )}
        </Container>
      </div>
    </Document>
  );
}

function Document({
  children,
  title = "Vanguard",
  ENV = {},
  data,
}: PropsWithChildren<{
  title?: string;
  ENV?: Record<string, any>;
  data?: Record<string, any>;
}>) {
  const [theme, setTheme] = useState("light");

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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        {data?.sentryTrace && (
          <meta name="sentry-trace" content={data.sentryTrace} />
        )}
        {data?.sentryBaggage && (
          <meta name="baggage" content={data.sentryBaggage} />
        )}
        {title ? <title>{title}</title> : null}
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
        <GlobalStyles />
        <body className="text-black bg-white dark:bg-black dark:text-white">
          {children}

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

function App() {
  const {
    user,
    categoryList,
    recentPostList,
    ENV = {},
    ...data
  } = useLoaderData<typeof loader>();
  const [showSidebar, setShowSidebar] = useState(false);

  setUser(user);

  const handleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <Document ENV={ENV} data={data}>
      <div className={showSidebar ? "showSidebar" : ""}>
        <LoadingIndicator />
        <div>
          <Toaster />
        </div>
        {process.env.NODE_ENV !== "production" && <DevNotice />}
        <MainContainer>
          <Primary>
            <Container>
              <Header
                showSidebar={showSidebar}
                handleSidebar={handleSidebar}
                user={user}
              />
              <Outlet />
              <Footer version={ENV.VERSION} admin={user?.admin} />
            </Container>
          </Primary>
          <Sidebar showSidebar={showSidebar}>
            {!!user && (
              <>
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
              </>
            )}
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
        </MainContainer>
      </div>
    </Document>
  );
}

const MainContainer = styled.div`
  position: relative;
`;

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

export default withSentry(App, { wrapWithErrorBoundary: false });
