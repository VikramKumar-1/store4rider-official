/**
 * @file rateLimit.config.ts
 * @description Centralized Rate Limiting Configuration for Store4Riders Backend.
 * 
 * 💡 For Future Developers:
 * To adjust limits or add new rate limit tiers, simply modify or add to this configuration object.
 * No need to modify route or middleware boilerplate code!
 */

export interface RateLimitRule {
  /** Unique key prefix in Redis */
  keyPrefix: string;
  /** Number of requests allowed within duration */
  points: number;
  /** Time window in seconds */
  duration: number;
  /** Optional cooldown duration if limit is exceeded (in seconds) */
  blockDuration?: number;
  /** User-friendly error message returned with HTTP 429 */
  errorMessage: string;
}

export const RATE_LIMIT_CONFIG = {
  /**
   * 1. Authentication Limiter
   * Protects: /api/v1/auth/login, /api/v1/auth/register, /api/v1/auth/forgot-password
   * Purpose: Prevents credential stuffing, dictionary brute-force, and account enumeration.
   */
  AUTH: {
    keyPrefix: "rl_auth",
    points: 5,               // 5 attempts
    duration: 15 * 60,       // per 15 minutes
    blockDuration: 15 * 60,  // Block IP for 15 minutes if exceeded
    errorMessage: "Too many login/registration attempts from this IP. Please try again after 15 minutes.",
  },

  /**
   * 2. Checkout & Order Creation Limiter
   * Protects: /api/v1/order (POST)
   * Purpose: Prevents card-testing attacks, coupon spamming, and inventory exhaustion bots.
   */
  ORDER: {
    keyPrefix: "rl_order",
    points: 10,              // 10 order creation requests
    duration: 60,            // per 1 minute (60 seconds)
    errorMessage: "Too many checkout attempts. Please wait a moment before trying again.",
  },

  /**
   * 3. S3 Media Upload Limiter
   * Protects: /api/v1/upload/presigned-url (POST)
   * Purpose: Prevents malicious storage flooding and excessive S3 presigned URL generation.
   */
  UPLOAD: {
    keyPrefix: "rl_upload",
    points: 10,              // 10 image uploads
    duration: 60,            // per 1 minute (60 seconds)
    errorMessage: "Upload rate limit exceeded. Please wait a moment before uploading more images.",
  },

  /**
   * 4. Global Baseline API Limiter
   * Protects: ALL endpoints (/api/v1/products, /api/v1/categories, /api/v1/reviews, /api/v1/search)
   * Purpose: Prevents web scrapers, bot storms, and Layer-7 DDoS attacks while allowing real users fast browsing.
   */
  GENERAL_API: {
    keyPrefix: "rl_general",
    points: 120,             // 120 requests
    duration: 60,            // per 1 minute (60 seconds)
    errorMessage: "Rate limit exceeded. Please slow down your requests.",
  },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_CONFIG;
