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
  useLocation,
  useNavigate,
} from "@remix-run/react";
import styled, { ThemeProvider } from "styled-components";
import breakpoint from "styled-components-breakpoint";
import prismCss from "prism-sentry/index.css";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import GlobalStyles from "./styles/global";

import fontsCss from "./styles/fonts.css";
import { lightTheme, darkTheme } from "./styles/theme";
import { getUser } from "./services/auth.server";
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

import { withSentry, setUser, captureException } from "@sentry/remix";
import LoadingIndicator from "./components/loading-indicator";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: fontsCss },
    { rel: "stylesheet", href: prismCss },
  ];
};

export const meta: MetaFunction = ({ data }) => ({
  charset: "utf-8",
  title: "Vanguard",
  viewport: "width=device-width,initial-scale=1",
  "sentry-trace": data?.sentryTrace || "",
  baggage: data?.baggage || "",
});

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  categoryList?: Awaited<ReturnType<typeof getCategoryList>> | null;
  recentPostList?: Awaited<ReturnType<typeof getPostList>> | null;
  ENV: { [key: string]: any };
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  setUser(
    user
      ? {
          id: user.id,
          email: user.email,
        }
      : null
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

const DevNotice = styled((props) => {
  return <div {...props}>Vanguard is running in development mode.</div>;
})`
  background: red;
  color: white;
  font-weight: bold;
  text-align: center;
  width: 100%;
  padding: 10px;
  z-index: 100;
`;

function App() {
  const { user, categoryList, recentPostList, ENV = {} } = useLoaderData();
  const [theme, setTheme] = useState("light");
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // XXX: fix an issue w/ root loader not respecting redirect
  useEffect(() => {
    // probably a cleaner way to build this, but we're here for the duct tape
    if (user && !user.name && location.pathname.indexOf("/welcome") !== 0) {
      // send em to onboarding
      const searchParams = new URLSearchParams([
        ["redirectTo", location.pathname],
      ]);
      return navigate(`/welcome?${searchParams}`);
    }
  }, [user, navigate, location.pathname]);

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
