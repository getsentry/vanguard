const isServer = typeof window === "undefined";

const config = {
  ENV: process.env.NODE_ENV === "production" ? "production" : "development",
  GOOGLE_CLIENT_ID: isServer
    ? process.env.GOOGLE_CLIENT_ID || ""
    : import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  GOOGLE_HD: isServer
    ? process.env.GOOGLE_HD || ""
    : import.meta.env.VITE_GOOGLE_HD || "",
  USE_BASIC_LOGIN: isServer
    ? !(
        process.env.USE_BASIC_LOGIN === "false" ||
        (process.env.USE_BASIC_LOGIN as any) === false
      )
    : import.meta.env.VITE_USE_BASIC_LOGIN !== "false",
  SENTRY_DSN: isServer
    ? process.env.SENTRY_DSN
    : import.meta.env.VITE_SENTRY_DSN,
  VERSION: isServer ? process.env.VERSION : import.meta.env.VITE_VERSION,
  GITHUB_REPO: "https://github.com/getsentry/vanguard",
};

export default config;
