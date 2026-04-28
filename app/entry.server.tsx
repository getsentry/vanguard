// Side-effect import: ensure Sentry.init() runs before any other module is
// evaluated. On Vercel this is the ONLY way to bootstrap server
// instrumentation (the platform's serverless runtime doesn't expose
// NODE_OPTIONS=--import). Locally, package.json `dev`/`start` scripts also
// pass `--import ./instrument.server.mjs` for slightly better OTEL coverage.
import "../instrument.server.mjs";

import type { ActionFunctionArgs, HandleErrorFunction, LoaderFunctionArgs } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, isRouteErrorResponse } from "react-router";
import { renderToPipeableStream } from "react-dom/server";
import * as Sentry from "@sentry/react-router";

// `createSentryHandleRequest` provides:
//   1. A bot-aware streaming render (onAllReady vs. onShellReady).
//   2. `wrapSentryHandleRequest` — names spans by parametrized route path.
//   3. `getMetaTagTransformer` — injects <meta name="sentry-trace"> and
//      <meta name="baggage"> into the streamed HTML so the browser can
//      continue the trace from the server.
const handleRequest = Sentry.createSentryHandleRequest({
  ServerRouter,
  renderToPipeableStream,
  createReadableStreamFromReadable,
});

export default handleRequest;

// Sentry's stock handler captures everything from the loader/action pipeline
// with the right `mechanism: { type: "react-router" }` annotation. We wrap it
// so 4xx route errors (`throw new Response("...", { status: 404 })`) don't
// pollute the issues list — those are user-facing errors, not bugs.
const sentryHandleError = Sentry.createSentryHandleError({ logErrors: false });

export const handleError: HandleErrorFunction = (
  error,
  args: LoaderFunctionArgs | ActionFunctionArgs,
) => {
  if (isRouteErrorResponse(error)) return;
  return sentryHandleError(error, args);
};
