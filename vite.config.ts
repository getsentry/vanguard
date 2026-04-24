import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    // Native modules (bcrypt) and deps that pull in optional requires
    // (@mapbox/node-pre-gyp -> nock / aws-sdk / mock-aws-s3) can't be
    // prebundled by esbuild — keep them as runtime requires.
    exclude: ["react-router-dom", "bcrypt", "@mapbox/node-pre-gyp"],
  },
  ssr: {
    // Native modules (bcrypt) must stay external. textarea-markdown-editor is
    // a CJS lib that attaches `.Wrapper` to its default export after load; Vite's
    // ESM interop loses that mutation, so leave it to Node's native require.
    external: ["bcrypt", "@mapbox/node-pre-gyp", "textarea-markdown-editor"],
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
