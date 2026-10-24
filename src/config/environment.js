const IS_PROD = process.env.NODE_ENV === "production";

if (IS_PROD && !process.env.SESSION_SECRET) {
  throw new Error("Set SESSION_SECRET before running in production.");
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  isProduction: IS_PROD,
  sessionSecret: process.env.SESSION_SECRET || "dev-only-secret-change-me",
};
