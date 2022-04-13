import * as Sentry from "@sentry/node";

import "@sentry/tracing";
import { prisma } from "~/db.server";

// https://github.com/getsentry/sentry-javascript/issues/3143
export function installPrismaTracer(prisma) {
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

installPrismaTracer(prisma);

export function withSentry(handler) {
  const wrapped = (request: Request, ...rest) => {
    Sentry.configureScope((scope) => {
      scope.setTransactionName(request.url);
    });
    const transaction = Sentry.startTransaction({
      op: "remix.handle-request",
      name: request.url,
    });

    try {
      return handler(request, ...rest);
    } catch (e) {
      Sentry.captureException(e);
      throw e;
    } finally {
      transaction.finish();
    }
  };

  return wrapped;
}

export function init(options = {}, ...rest) {
  return Sentry.init(
    {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      ...options,
    },
    ...rest
  );
}

export * from "@sentry/node";
