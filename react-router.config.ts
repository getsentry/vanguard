import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  ssr: true,
  presets: [vercelPreset()],
  // Coordinates Sentry source map post-processing with React Router's
  // build manifest (matches client/server bundle layout, computes the
  // right release name, etc.).
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    await sentryOnBuildEnd({ viteConfig, reactRouterConfig, buildManifest });
  },
} satisfies Config;
