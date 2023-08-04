/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  future: {
    v2_errorBoundary: true,
    v2_headers: true,
    // v2_meta: true,
    v2_normalizeFormMethod: true,
    // v2_routeConvention: true,
    v2_dev: true,
    unstable_vanillaExtract: true,
  },
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.test.{js,jsx,ts,tsx}"],
  serverDependenciesToBundle: ["marked"],
  serverModuleFormat: "cjs",
};
