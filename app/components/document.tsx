import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import type { PropsWithChildren } from "react";
import classNames from "~/lib/classNames";

export default function Document({
  children,
  title = "Vanguard",
  showSidebar = false,
}: PropsWithChildren<{
  title?: string;
  showSidebar?: boolean;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* `sentry-trace` and `baggage` meta tags are streamed in by
            createSentryHandleRequest's getMetaTagTransformer. */}
        <Meta />
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
        <Scripts />
      </body>
    </html>
  );
}
