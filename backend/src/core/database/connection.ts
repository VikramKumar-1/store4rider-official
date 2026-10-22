import mongoose from "mongoose";
import dns from "node:dns";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";

// Configure reliable DNS servers to resolve MongoDB Atlas SRV records without querySrv EBADRESP
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS servers are restricted
}

const MONGODB_URI = process.env.MONGODB_URI as string;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB using a cached connection if available.
 * This prevents creating multiple connections during Next.js hot reloads.
 */
export async function connectToDatabase() {
  if (!MONGODB_URI) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("MONGODB_URI is not defined. Skipping DB connection for static build phase.");
      return null;
    }
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    logger.info("Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      logger.info("Successfully connected to MongoDB");
      
      // Initialize Background Workers and Cron Jobs ONLY when DB connects successfully
      if (process.env.NODE_ENV !== "test") {
        try {
          const { initCronJobs } = await import("../cron/order.cron");
          await import("../queue/email.worker");
          await import("../queue/migration.worker");
          initCronJobs();
          logger.info("Enterprise Background Workers and Cron Jobs successfully initialized!");
        } catch (workerErr) {
          logger.error(workerErr, "Failed to initialize background workers");
        }
      }

      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    logger.error(e, "Error connecting to MongoDB");
    throw e;
  }

  return cached.conn;
}
