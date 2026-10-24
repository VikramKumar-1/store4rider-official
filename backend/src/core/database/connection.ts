import mongoose from "mongoose";
import dns from "node:dns";
import { logger } from "../utils/logger";

// Configure reliable public DNS servers to resolve MongoDB Atlas SRV records without querySrv EBADRESP
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  if (typeof (dns as any).setDefaultResultOrder === "function") {
    (dns as any).setDefaultResultOrder("ipv4first");
  }
} catch {
  // Ignore if custom DNS servers are restricted in environment
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Converts a mongodb+srv:// Atlas URI to a direct replica-set URI if needed.
 * This completely prevents "querySrv EBADRESP" failures caused by local ISP/router DNS errors.
 */
export function getDirectMongoUri(uri: string): string {
  if (!uri || !uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  // Handle Store4Riders Atlas cluster explicitly
  if (uri.includes("store4riders.fg8q7zs.mongodb.net")) {
    const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)\/([^?]*)/);
    if (match) {
      const [, user, pass, , db] = match;
      const targetDb = db || "store4riders";
      return `mongodb://${user}:${pass}@ac-jtwmafz-shard-00-00.fg8q7zs.mongodb.net:27017,ac-jtwmafz-shard-00-01.fg8q7zs.mongodb.net:27017,ac-jtwmafz-shard-00-02.fg8q7zs.mongodb.net:27017/${targetDb}?ssl=true&replicaSet=atlas-18genv-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }

  return uri;
}

/**
 * Connects to MongoDB using a cached connection if available.
 * This prevents creating multiple connections during Next.js hot reloads.
 */
export async function connectToDatabase() {
  const rawUri = (process.env.MONGODB_URI as string) || "";
  if (!rawUri) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("MONGODB_URI is not defined. Skipping DB connection for static build phase.");
      return null;
    }
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }

  // Ensure public DNS servers are enforced
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  } catch {
    // Ignore if restricted
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const targetUri = getDirectMongoUri(rawUri);
    const opts = {
      bufferCommands: false,
    };

    logger.info("Connecting to MongoDB...");
    cached.promise = mongoose.connect(targetUri, opts).then(async (mongooseInstance) => {
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

      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    logger.error(e, "Error connecting to MongoDB");

    // If initial attempt failed with DNS SRV error and wasn't direct, retry with direct URI
    if (rawUri.startsWith("mongodb+srv://") && (e?.message?.includes("querySrv") || e?.code === "EBADRESP")) {
      logger.warn("SRV DNS lookup failed with EBADRESP. Retrying with direct MongoDB Atlas replicaSet URI...");
      const directUri = getDirectMongoUri(rawUri);
      if (directUri !== rawUri) {
        cached.conn = await mongoose.connect(directUri, { bufferCommands: false });
        logger.info("Successfully connected to MongoDB via direct replicaSet URI");
        return cached.conn;
      }
    }

    throw e;
  }

  return cached.conn;
}
