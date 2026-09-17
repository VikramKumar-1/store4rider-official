/**
 * @file env.ts
 * @description Validates all required environment variables strictly at runtime.
 * Uses safe defaults during build time to prevent build failures.
 */
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

export const ENV = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL || process.env.MONGODB_URI || (isProd ? "" : "mongodb://localhost:27017/store4riders"),
  REDIS_URL: process.env.REDIS_URL || (isProd ? "" : "redis://localhost:6379"),
  FRONTEND_URL: process.env.FRONTEND_URL || (isProd ? "" : "http://localhost:3000"),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || (isProd ? "" : "dev-access-secret-do-not-use-in-prod"),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (isProd ? "" : "dev-refresh-secret-do-not-use-in-prod"),
  NODE_ENV: process.env.NODE_ENV,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || process.env.S3_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET,
});
