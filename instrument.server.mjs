// Sentry server bootstrap.
//
// This file is loaded BEFORE user code so OpenTelemetry-based
// auto-instrumentation (HTTP, Postgres, fetch, etc.) can hook into
// modules at require/import time. Two load paths:
//
//   - Local dev / `pnpm start`: --import flag in package.json scripts
//   - Vercel: side-effect import at the top of app/entry.server.tsx
//     (Vercel's serverless bootstrap doesn't honor user NODE_OPTIONS).
//
// Keep this file ESM and dependency-light — anything imported here
// runs before the rest of the app boots.
import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERSION,
  // Vanguard is internal-only — sample everything for now. Lower if traffic grows.
  tracesSampleRate: 1.0,
  // Send IP / headers so Sentry user context lines up with our setUser() calls.
  sendDefaultPii: true,
  // Surface Sentry.logger.* calls in the Sentry Logs product.
  enableLogs: true,
});
