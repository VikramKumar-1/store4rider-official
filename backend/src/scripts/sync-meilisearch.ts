import "dotenv/config";
import mongoose from "mongoose";
import { syncAllProductsToMeilisearch, initializeMeilisearch } from "../core/search/meilisearch";
import { logger } from "../core/utils/logger";

async function runSync() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(dbUrl);
    logger.info("Connected.");

    logger.info("Initializing Meilisearch Settings...");
    await initializeMeilisearch();

    logger.info("Syncing products...");
    await syncAllProductsToMeilisearch();

    logger.info("Done!");
    process.exit(0);
  } catch (error) {
    logger.error("Error during sync:", error);
    process.exit(1);
  }
}

runSync();
