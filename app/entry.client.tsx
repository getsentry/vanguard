import { RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";

import * as Sentry from "~/lib/sentry/client";

Sentry.init({
  tracesSampleRate: 1.0,
});

hydrate(<RemixBrowser />, document);
