import { RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";

// TOOD(dcramer): Remix has decided it knows better how to build web applications than the
// rest of the world, and has thus disabled the ability to bind build-time configuration via
// environment variables. One day when they realize they do not know better, we can change this.
// import * as Sentry from "@sentry/react";
// import { BrowserTracing } from "@sentry/tracing";
// Sentry.init({
//   dsn: process.env.SENTRY_DSN,

//   // Alternatively, use `process.env.npm_package_version` for a dynamic release version
//   // if your build tool supports it.
//   // release: "vanguard@1.0.0",
//   integrations: [new BrowserTracing()],

//   // Set tracesSampleRate to 1.0 to capture 100%
//   // of transactions for performance monitoring.
//   // We recommend adjusting this value in production
//   tracesSampleRate: 1.0,
// });

hydrate(<RemixBrowser />, document);
