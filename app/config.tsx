const env = (typeof window === "undefined" ? process.env : window.CONFIG) || {};

const config = {
  ENV: env.NODE_ENV === "production" ? "production" : "development",
  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || "",
  GOOGLE_HD: env.GOOGLE_HD || "",
  USE_BASIC_LOGIN: !(
    env.USE_BASIC_LOGIN === "false" || env.USE_BASIC_LOGIN === false
  ),
  SENTRY_DSN: env.SENTRY_DSN,
  VERSION: env.VERSION,
  GITHUB_REPO: "https://github.com/getsentry/vanguard",
};

export default config;
