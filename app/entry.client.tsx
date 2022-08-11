import { useEffect } from "react";
import { hydrate } from "react-dom";

import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import * as Sentry from "@sentry/remix";

Sentry.init({
  // @ts-ignore We set ENV in root.tsx
  dsn: window.ENV.SENTRY_DSN,
  // @ts-ignore We set ENV in root.tsx
  release: window.ENV.VERSION,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.remixRouterInstrumentation(
        useEffect,
        useLocation,
        useMatches
      ),
    }),
  ],
});

hydrate(<RemixBrowser />, document);
