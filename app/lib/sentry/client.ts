import { useEffect } from "react";
import { useMatches } from "@remix-run/react";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function useSentry() {
  const matches = useMatches();
  useEffect(
    () => {
      Sentry.configureScope((scope) => {
        scope.setTransactionName(matches[matches.length - 1].id);
      });
    },
    matches.map((m) => m.id)
  );
}

export function Component() {
  useSentry();

  return null;
}

export function init(options = {}, ...rest) {
  return Sentry.init(
    {
      dsn: window?.ENV?.SENTRY_DSN,
      integrations: [new BrowserTracing()],
      environment: window?.ENV?.NODE_ENV,
      ...options,
    },
    ...rest
  );
}

export * from "@sentry/react";
