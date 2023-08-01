import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

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

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
