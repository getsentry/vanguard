import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ["react-router-dom"],
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  // Pre-commit checks run via `vp staged` (installed by `vp config`).
  // Auto-fix lint + format on staged source files; fixes are re-staged.
  staged: {
    "*.{js,jsx,ts,tsx,mjs,cjs}": "vp check --fix",
  },
});
