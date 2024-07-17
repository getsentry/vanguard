/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import type { User } from "~/models/user.server";

interface Config {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_HD?: string;
  SENTRY_DSN?: string;
  USE_BASIC_LOGIN?: boolean | string;
  VERSION?: string;
  NODE_ENV: "development" | "production";
}

interface Context {
  user: User | null;
}

interface CustomMatchers<R = unknown> {
  toThrowErrorMatching(error: Error, expected: Error): R;
}

declare global {
  export const DefaultFixtures: {
    DEFAULT_USER: User;
  };

  namespace Express {
    interface Request extends Context {}
  }

  namespace NodeJS {
    interface ProcessEnv extends Config {
      GOOGLE_CLIENT_SECRET?: string;
      SESSION_SECRET: string;
    }
  }

  interface Window {
    CONFIG: Config;
  }

  namespace Vi {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
  }
}

declare module "@remix-run/server-runtime" {
  interface AppLoadContext extends Context {}
}
