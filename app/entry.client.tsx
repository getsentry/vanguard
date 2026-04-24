import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import * as Sentry from "@sentry/react-router";
import { replayIntegration } from "@sentry/browser";
import config from "./config";

Sentry.init({
  dsn: config.SENTRY_DSN,
  environment: config.ENV,
  release: config.VERSION,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.reactRouterTracingIntegration(), replayIntegration()],
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});

if (process.env.NODE_ENV === "development") {
  import("@spotlightjs/spotlight").then((Spotlight) =>
    Spotlight.init({ injectImmediately: true }),
  );
}
