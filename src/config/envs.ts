import "dotenv/config";
import env from "env-var";

export const NODE_ENV = env.get("NODE_ENV").required().asString();

export const envs = {
  NODE_ENV: env.get("NODE_ENV").required().asString(),
  PORT: env.get("PORT").required().asPortNumber(),
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: env
    .get("PUPPETEER_SKIP_CHROMIUM_DOWNLOAD")
    .required()
    .asString(),
  PUPPETEER_EXECUTABLE_PATH: env
    .get("PUPPETEER_EXECUTABLE_PATH")
    .required()
    .asString(),
  APP_NAME: env.get("APP_NAME").required().asString(),
  APP_VERSION: env.get("APP_VERSION").required().asString(),
  HEALTH_CHECK_URL: env.get("HEALTH_CHECK_URL").required().asString(),
  SECRET_JWT_REPORT_MS: env.get("SECRET_JWT_REPORT_MS").required().asString(),
  SECRET_AES_REPORT_MS: env.get("SECRET_AES_REPORT_MS").required().asString(),
  FINTRACE_API_IA_MS_URL: env
    .get("FINTRACE_API_IA_MS_URL")
    .required()
    .asString(),
  SECRET_JWT_IA_MS: env.get("SECRET_JWT_IA_MS").required().asString(),
  SECRET_AES_IA_MS: env.get("SECRET_AES_IA_MS").required().asString(),
  SECRET_JWT_IA_MS_EXPIRES_IN: env
    .get("SECRET_JWT_IA_MS_EXPIRES_IN")
    .required()
    .asString(),
};
