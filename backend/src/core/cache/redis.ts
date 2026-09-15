import Redis from "ioredis";
import { logger } from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL;

let redisClient: Redis | null = null;
let isRedisConnected = false;

// Ultra-fast in-memory fallback cache with TTL
const memoryCache = new Map<string, { value: any; expiry: number }>();

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      connectTimeout: 500,        // 500ms max to connect
      commandTimeout: 300,        // 300ms max per query
      maxRetriesPerRequest: 1,    // Do not hang on failure
      enableOfflineQueue: false,  // CRITICAL: Do NOT hang API requests when Redis is disconnected!
      retryStrategy: () => 10000, // Reconnect attempt every 10s
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
      logger.info("Connected to Redis Cache Engine");
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      logger.warn(`Redis Offline / Error (${err.message}). Using instant Memory Cache fallback.`);
    });
  } catch (err) {
    isRedisConnected = false;
  }
} else {
  logger.info("No REDIS_URL provided. Using ultra-fast in-memory cache engine.");
}

/**
 * Sets a value in cache (Redis if available, otherwise memory).
 */
export const setCache = async (key: string, value: any, ttlSeconds: number = 3600) => {
  // Always update memory cache for instant local speed
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });

  if (redisClient && isRedisConnected) {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Ignore background redis error
    }
  }
};

/**
 * Gets a value from cache (Instant 0.1ms memory check first, then Redis).
 */
export const getCache = async (key: string): Promise<any | null> => {
  // 1. Fast Memory Cache lookup (0.1ms)
  const mem = memoryCache.get(key);
  if (mem) {
    if (Date.now() < mem.expiry) {
      return mem.value;
    }
    memoryCache.delete(key);
  }

  // 2. Redis lookup
  if (redisClient && isRedisConnected) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        const parsed = JSON.parse(data);
        // Save to memory for subsequent instant lookups
        memoryCache.set(key, { value: parsed, expiry: Date.now() + 60000 });
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Deletes a key from cache.
 */
export const deleteCache = async (key: string) => {
  memoryCache.delete(key);
  if (redisClient && isRedisConnected) {
    try {
      await redisClient.del(key);
    } catch {
      // Ignore
    }
  }
};

export { redisClient, isRedisConnected };
