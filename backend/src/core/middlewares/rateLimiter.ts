/**
 * @file rateLimiter.ts
 * @description Rate limiting middleware powered by Redis and rate-limiter-flexible.
 * Uses centralized configuration from rateLimit.config.ts.
 */

import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../cache/redis";
import { AppError } from "../errors/AppError";
import { RATE_LIMIT_CONFIG, RateLimitTier, RateLimitRule } from "../config/rateLimit.config";

// Store instances of RateLimiterRedis keyed by tier name
const limiterInstances = new Map<string, RateLimiterRedis>();

/**
 * Helper to initialize or retrieve a RateLimiterRedis instance for a given rule
 */
function getLimiter(rule: RateLimitRule): RateLimiterRedis | null {
  if (!redisClient) return null;

  if (!limiterInstances.has(rule.keyPrefix)) {
    limiterInstances.set(
      rule.keyPrefix,
      new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: rule.keyPrefix,
        points: rule.points,
        duration: rule.duration,
        blockDuration: rule.blockDuration,
      })
    );
  }

  return limiterInstances.get(rule.keyPrefix) || null;
}

/**
 * Generic Rate Limit Consumer
 * Consumes points for an IP and throws AppError (HTTP 429) if exceeded.
 */
export async function consumeRateLimit(rule: RateLimitRule, ip: string): Promise<void> {
  const limiter = getLimiter(rule);
  if (!limiter) return; // Gracefully bypass if Redis is unavailable in local dev

  try {
    await limiter.consume(ip);
  } catch (rejRes) {
    throw new AppError(rule.errorMessage, 429);
  }
}

// =============================================================================
// Exported Tiered Helpers for Easy Import Across Routes
// =============================================================================

/**
 * 🔐 Auth Rate Limiter
 * 5 attempts per 15 minutes. Use on /auth/login, /auth/register
 */
export const checkAuthRateLimit = async (ip: string) => {
  await consumeRateLimit(RATE_LIMIT_CONFIG.AUTH, ip);
};

// Backward compatibility alias
export const checkRateLimit = checkAuthRateLimit;

/**
 * 💳 Order & Checkout Rate Limiter
 * 10 requests per minute. Use on /order (POST)
 */
export const checkOrderRateLimit = async (ip: string) => {
  await consumeRateLimit(RATE_LIMIT_CONFIG.ORDER, ip);
};

/**
 * ☁️ Media Upload Rate Limiter
 * 10 uploads per minute. Use on /upload/presigned-url (POST)
 */
export const checkUploadRateLimit = async (ip: string) => {
  await consumeRateLimit(RATE_LIMIT_CONFIG.UPLOAD, ip);
};

/**
 * 🌐 Global Baseline API Rate Limiter
 * 120 requests per minute. Applied globally to all API routes.
 */
export const checkGeneralApiRateLimit = async (ip: string) => {
  await consumeRateLimit(RATE_LIMIT_CONFIG.GENERAL_API, ip);
};

/**
 * 🛠️ Dynamic Rate Limit Checker by Tier Name
 * Allows checking any tier dynamically: e.g. checkTierRateLimit("AUTH", ip)
 */
export const checkTierRateLimit = async (tier: RateLimitTier, ip: string) => {
  const rule = RATE_LIMIT_CONFIG[tier];
  if (rule) {
    await consumeRateLimit(rule, ip);
  }
};
