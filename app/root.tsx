import type { PropsWithChildren } from "react";
import { useState } from "react";
import InterStyles from "@fontsource/inter/index.css";
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
import indexCss from "./styles/index.css";
import { getUser } from "./services/auth.server";
import Footer from "./components/footer";
import Header from "./components/header";
import Container from "./components/container";
import { Sidebar, SidebarSection } from "./components/sidebar";
import CategoryTag, { CategoryTags } from "./components/category-tag";
import Input from "./components/input";
import { getCategoryList } from "./models/category.server";
import Avatar from "./components/avatar";
import { getPostList } from "./models/post.server";
import PostList from "./components/post-list";
import LoadingIndicator from "./components/loading-indicator";
import DevNotice from "./components/dev-notice";
import classNames from "./lib/classNames";
import Button from "./components/button";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: indexCss },
    { rel: "stylesheet", href: fontsCss },
    { rel: "stylesheet", href: prismCss },
    { rel: "stylesheet", href: InterStyles },
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
        className="xl:pb-24 px-20 mr-[30rem] relative z-10"
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
  showSidebar = false,
  ENV = {},
  data,
}: PropsWithChildren<{
  title?: string;
  showSidebar?: boolean;
  ENV?: Record<string, any>;
  data?: Record<string, any>;
}>) {
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
      </head>
      <body
        className={classNames(
          showSidebar ? "overflow-hidden" : "",
          "text-primary-light bg-bg-light dark:bg-bg-dark dark:text-primary-dark min-h-screen overflow-x-hidden",
        )}
      >
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
    <Document ENV={ENV} data={data} showSidebar={showSidebar}>
      <LoadingIndicator />
      <div>
        <Toaster />
      </div>
      {process.env.NODE_ENV !== "production" && <DevNotice />}
      <div className="relative">
        <div className="xl:pb-24 xl:px-20 xl:mr-[30rem] relative">
          <Container>
            <Header
              showSidebar={showSidebar}
              handleSidebar={handleSidebar}
              user={user}
            />
            <Outlet />
            <Footer version={ENV.VERSION} admin={user?.admin} />
          </Container>
        </div>
        <Sidebar showSidebar={showSidebar}>
          {!!user && (
            <>
              <SidebarSection>
                <div className="flex items-center gap-4">
                  <Link to="/settings">
                    <Avatar user={user} size="2rem" />
                  </Link>
                  <Button as={Link} baseStyle="link" to="/settings">
                    Settings
                  </Button>
                  <div className="text-border-light dark:text-border-dark font-mono">
                    /{" "}
                  </div>
                  <Button as={Link} baseStyle="link" to="/drafts">
                    Drafts
                  </Button>
                </div>
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
              <h6 className="font-semibold text-sm uppercase mb-4 text-muted-light dark:text-muted-dark">
                Divisions
              </h6>
              <CategoryTags>
                {categoryList.map((category: any) => (
                  <CategoryTag key={category.id} category={category} />
                ))}
              </CategoryTags>
            </SidebarSection>
          )}
          {recentPostList && recentPostList.length > 0 && (
            <SidebarSection>
              <h6 className="font-semibold text-sm uppercase mb-4 text-muted-light dark:text-muted-dark">
                Recent Posts
              </h6>
              <PostList postList={recentPostList} />
            </SidebarSection>
          )}
        </Sidebar>
      </div>
    </Document>
  );
}

export default withSentry(App, { wrapWithErrorBoundary: false });
