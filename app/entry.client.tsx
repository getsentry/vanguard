import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import * as Sentry from "@sentry/react-router";
import config from "./config";

Sentry.init({
  dsn: config.SENTRY_DSN,
  environment: config.ENV,
  release: config.VERSION,

  // Send IP / headers so Sentry user context lines up with our setUser()
  // calls in app/root.tsx.
  sendDefaultPii: true,

  integrations: [Sentry.reactRouterTracingIntegration(), Sentry.replayIntegration()],

  // Vanguard is internal — sample 100% of traces for now. Lower if traffic grows.
  tracesSampleRate: 1.0,
  // Propagate tracing headers to same-origin API calls so server spans
  // continue the client trace.
  tracePropagationTargets: [/^\//],

  // Vanguard is internal — capture every session for replay. Bump down
  // if traffic ever grows enough that quota becomes a concern.
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Enable Sentry.logger.* ingestion (Sentry Logs product).
  enableLogs: true,
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={Sentry.sentryOnError} />
    </StrictMode>,
  );
});
