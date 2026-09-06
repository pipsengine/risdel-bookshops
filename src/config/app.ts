export const appConfig = {
  name: process.env.APP_NAME || "Risdel Bookshops",
  company: "Risdel Enterprise",
  version: process.env.APP_VERSION || "0.4.0",
  timezone: "Africa/Lagos",
  currency: "NGN",
  branch: "Main Store",
  environment: process.env.NODE_ENV || "development"
};
