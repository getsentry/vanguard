import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
import { sentryReactRouter, type SentryReactRouterBuildOptions } from "@sentry/react-router";

const sentryAuthTokenSet = !!process.env.SENTRY_AUTH_TOKEN;

const sentryConfig: SentryReactRouterBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Skip source map upload entirely when no auth token is present
  // (local dev, CI without secrets, etc.). Without this, the plugin
  // logs noisy warnings on every build.
  sourcemaps: {
    disable: !sentryAuthTokenSet,
  },
};

export default defineConfig((config) => ({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ["react-router-dom"],
  },
  plugins: [tailwindcss(), reactRouter(), sentryReactRouter(sentryConfig, config)],
  // Pre-commit checks run via `vp staged` (installed by `vp config`).
  // Auto-fix lint + format on staged source files; fixes are re-staged.
  staged: {
    "*.{js,jsx,ts,tsx,mjs,cjs}": "vp check --fix",
  },
}));
