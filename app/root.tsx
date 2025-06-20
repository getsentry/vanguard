import { useState } from "react";
import InterStyles from "@fontsource/inter/index.css";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import prismCss from "prism-sentry/index.css";
import { withSentry, setUser } from "@sentry/remix";
import { Toaster } from "react-hot-toast";

import fontsCss from "./styles/fonts.css";
import indexCss from "./styles/index.css";
import Footer from "./components/footer";
import Header from "./components/header";
import Container from "./components/container";
import { Sidebar, SidebarSection } from "./components/sidebar";
import CategoryTag, { CategoryTags } from "./components/category-tag";
import Input from "./components/input";
import { getCategoryList } from "./models/category.server";
import Avatar from "./components/avatar";
import type { User } from "./models/post.server";
import { getPostList } from "./models/post.server";
import PostList from "./components/post-list";
import LoadingIndicator from "./components/loading-indicator";
import DevNotice from "./components/dev-notice";
import Button from "./components/button";
import Document from "./components/document";
import config from "./config";
import Link from "./components/link";
import { ThemeProvider } from "./lib/theme-context";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: indexCss },
    { rel: "stylesheet", href: fontsCss },
    { rel: "stylesheet", href: prismCss },
    { rel: "stylesheet", href: InterStyles },
  ];
};

type LoaderData = {
  user: User | null;
  categoryList?: Awaited<ReturnType<typeof getCategoryList>> | null;
  recentPostList?: Awaited<ReturnType<typeof getPostList>> | null;
  config: typeof config;
  sentryTrace?: string;
  sentryBaggage?: string;
};

export const loader: LoaderFunction = async ({ context: { user } }) => {
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

  return json({
    user,
    config,
    categoryList: user
      ? await getCategoryList({
          userId: user.id,
          includeRestricted: true,
        })
      : null,
    recentPostList: user
      ? await getPostList({
          userId: user.id,
          published: true,
          limit: 3,
        })
      : null,
  });
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

function App() {
  const {
    user,
    categoryList,
    recentPostList,
    config = {},
    ...data
  } = useLoaderData<LoaderData>();

  const [showSidebar, setShowSidebar] = useState(false);

  if (user) {
    setUser({
      id: `${user.id}`,
      name: user.name,
      email: user.email,
    });
  } else {
    setUser(null);
  }

  const handleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <ThemeProvider>
      <Document config={config} data={data} showSidebar={showSidebar}>
        <LoadingIndicator />
        <div>
          <Toaster />
        </div>
        {config.ENV !== "production" && <DevNotice />}
        <div className="relative">
          <div className="xl:pb-24 xl:px-20 xl:mr-[30rem] relative">
            <Container>
              <Header
                showSidebar={showSidebar}
                handleSidebar={handleSidebar}
                user={user}
              />
              <Outlet />
              <Footer version={config.VERSION} admin={user?.admin} />
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
                      /
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
    </ThemeProvider>
  );
}

export default withSentry(App, { wrapWithErrorBoundary: false });
