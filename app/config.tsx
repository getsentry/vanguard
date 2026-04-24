const isServer = typeof window === "undefined";

const config = {
  ENV: process.env.NODE_ENV === "production" ? "production" : "development",
  SENTRY_DSN: isServer ? process.env.SENTRY_DSN : import.meta.env.VITE_SENTRY_DSN,
  VERSION: isServer ? process.env.VERSION : import.meta.env.VITE_VERSION,
  GITHUB_REPO: "https://github.com/getsentry/vanguard",
};

export default config;
