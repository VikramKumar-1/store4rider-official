/**
 * @file env.ts
 * @description Validates all required environment variables strictly at runtime.
 * Uses safe defaults during build time to prevent build failures.
 */
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  API_URL: z.string().min(1, "API_URL is required"),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PAYU_MERCHANT_KEY: z.string().optional(),
  PAYU_SALT: z.string().optional(),
  PAYU_MODE: z.enum(["test", "live"]).optional(),
  CCAVENUE_MERCHANT_ID: z.string().optional(),
  CCAVENUE_ACCESS_CODE: z.string().optional(),
  CCAVENUE_WORKING_KEY: z.string().optional(),
  CCAVENUE_MODE: z.enum(["test", "live"]).optional(),
  SNAPMINT_MERCHANT_ID: z.string().optional(),
  SNAPMINT_SECRET: z.string().optional(),
  SNAPMINT_MODE: z.enum(["test", "live"]).optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  SHIPROCKET_EMAIL: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  DELHIVERY_API_KEY: z.string().optional(),
  XPRESSBEES_API_KEY: z.string().optional(),
  SHIPROCKET_WEBHOOK_SECRET: z.string().optional(),
  DELHIVERY_WEBHOOK_TOKEN: z.string().optional(),
  XPRESSBEES_WEBHOOK_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

export const ENV = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL || process.env.MONGODB_URI || (isProd ? "" : "mongodb://localhost:27017/store4riders"),
  REDIS_URL: process.env.REDIS_URL || (isProd ? "" : "redis://localhost:6379"),
  FRONTEND_URL: process.env.FRONTEND_URL || (isProd ? "" : "http://localhost:3000"),
  API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (isProd ? "" : "http://localhost:4000"),
  NEXT_PUBLIC_API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (isProd ? "" : "http://localhost:4000"),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || (isProd ? "" : "dev-access-secret-do-not-use-in-prod"),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (isProd ? "" : "dev-refresh-secret-do-not-use-in-prod"),
  NODE_ENV: process.env.NODE_ENV,
  PAYU_MERCHANT_KEY: process.env.PAYU_MERCHANT_KEY,
  PAYU_SALT: process.env.PAYU_SALT,
  PAYU_MODE: process.env.PAYU_MODE || "test",
  CCAVENUE_MERCHANT_ID: process.env.CCAVENUE_MERCHANT_ID,
  CCAVENUE_ACCESS_CODE: process.env.CCAVENUE_ACCESS_CODE,
  CCAVENUE_WORKING_KEY: process.env.CCAVENUE_WORKING_KEY,
  CCAVENUE_MODE: process.env.CCAVENUE_MODE || "test",
  SNAPMINT_MERCHANT_ID: process.env.SNAPMINT_MERCHANT_ID,
  SNAPMINT_SECRET: process.env.SNAPMINT_SECRET,
  SNAPMINT_MODE: process.env.SNAPMINT_MODE || "test",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || process.env.S3_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET,
  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL,
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD,
  SHIPROCKET_WEBHOOK_SECRET: process.env.SHIPROCKET_WEBHOOK_SECRET,
  DELHIVERY_API_KEY: process.env.DELHIVERY_API_KEY,
  DELHIVERY_WEBHOOK_TOKEN: process.env.DELHIVERY_WEBHOOK_TOKEN,
  XPRESSBEES_API_KEY: process.env.XPRESSBEES_API_KEY,
  XPRESSBEES_WEBHOOK_TOKEN: process.env.XPRESSBEES_WEBHOOK_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
});
