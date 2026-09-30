import "dotenv/config";
import { redis } from "../core/utils/redis"; // Adjust path if needed, or we just connect directly
import Redis from "ioredis";

async function flushCache() {
  try {
    const redisClient = new Redis(process.env.REDIS_URL as string);
    console.log("🔌 Connecting to Redis...");
    
    await redisClient.flushall();
    console.log("✅ ALL REDIS CACHE CLEARED SUCCESSFULLY!");
    
    redisClient.disconnect();
  } catch (error) {
    console.error("❌ Redis Error:", error);
  }
}

flushCache();
