import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import * as Sentry from "@sentry/node";

import "@sentry/tracing";
import { prisma } from "./db.server";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: process.env.NODE_ENV || "development",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

// https://github.com/getsentry/sentry-javascript/issues/3143
function installPrismaTracer() {
  prisma.$use(async (params, next) => {
    const { model, action, runInTransaction, args } = params;
    const description = [model, action].filter(Boolean).join(".");
    const data = {
      model,
      action,
      runInTransaction,
      args,
    };

    const scope = Sentry.getCurrentHub().getScope();
    const parentSpan = scope?.getSpan();
    const span = parentSpan?.startChild({
      op: "db",
      description,
      data,
    });

    // optional but nice
    scope?.addBreadcrumb({
      category: "db",
      message: description,
      data,
    });

    const result = await next(params);
    span?.finish();

    return result;
  });
}

installPrismaTracer();

function withSentry(handler) {
  const wrapped = (request: Request, ...params) => {
    Sentry.configureScope((scope) => {
      scope.setTransactionName(request.url);
    });
    const transaction = Sentry.startTransaction({
      op: "remix.handle-request",
      name: request.url,
    });

    try {
      return handler(request, ...params);
    } catch (e) {
      Sentry.captureException(e);
      throw e;
    } finally {
      transaction.finish();
    }
  };

  return wrapped;
}

function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const sheet = new ServerStyleSheet();

  let markup = renderToString(
    sheet.collectStyles(
      <RemixServer context={remixContext} url={request.url} />
    )
  );
  const styles = sheet.getStyleTags();

  markup = markup.replace("__STYLES__", styles);

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}

export default handleRequest;
