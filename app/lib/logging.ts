import * as Sentry from "@sentry/remix";

type CaptureContext = {
  context: {
    [key: string]: any;
  };
  tags: {
    [key: string]: any;
  };
};

// function error(value: string, context?: Context): void;
// function error(value: Error, context?: Context): void;

export function error(
  value: string | Error,
  captureContext?: CaptureContext
): void {
  Sentry.withScope((scope) => {
    if (captureContext?.context)
      scope.setContext("vg:context", captureContext.context);
    if (captureContext?.tags) scope.setTags(captureContext.tags);
    if (value instanceof Error) {
      Sentry.captureException(value);
    } else {
      Sentry.captureMessage(value);
    }
  });
}
