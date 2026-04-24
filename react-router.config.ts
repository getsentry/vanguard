import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  ignoredRouteFiles: ["**/.*", "**/*.test.{js,jsx,ts,tsx}"],
} satisfies Config;
