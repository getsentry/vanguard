import { RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: window?.ENV?.SENTRY_DSN,

  // Alternatively, use `process.env.npm_package_version` for a dynamic release version
  // if your build tool supports it.
  // release: "vanguard@1.0.0",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

hydrate(<RemixBrowser />, document);
