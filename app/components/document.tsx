import {
  Links,
  LiveReload,
  Meta,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { PropsWithChildren } from "react";
import classNames from "~/lib/classNames";

export default function Document({
  children,
  title = "Vanguard",
  showSidebar = false,
  config = {},
  data,
}: PropsWithChildren<{
  title?: string;
  showSidebar?: boolean;
  config?: Record<string, any>;
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
            __html: `window.CONFIG = ${JSON.stringify(config)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
