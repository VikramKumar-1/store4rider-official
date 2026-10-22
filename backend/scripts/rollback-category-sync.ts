/**
 * @file rollback-category-sync.ts
 * @description Instant Rollback script for sync-product-categories.ts.
 * Restores all product categorySlugs and categoryId fields from the pre-sync-backup.json snapshot.
 * 
 * Usage:
 *   npx tsx backend/scripts/rollback-category-sync.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function rollback() {
  const backupFilePath = path.join(process.cwd(), 'backend', 'scripts', 'pre-sync-backup.json');
  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ No backup file found at: ${backupFilePath}`);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
  console.log(`Loaded backup file with ${backupData.length} records.`);

  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error("No MongoDB URI");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected. Starting rollback...\n");

  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  const bulkOps = backupData.map((item: any) => ({
    updateOne: {
      filter: { _id: item._id },
      update: {
        $set: {
          categorySlugs: item.categorySlugs,
          categoryId: item.categoryId,
        }
      }
    }
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
    const batch = bulkOps.slice(i, i + BATCH_SIZE);
    await Product.bulkWrite(batch, { ordered: false });
    console.log(`Restored ${Math.min(i + BATCH_SIZE, bulkOps.length)} / ${bulkOps.length} products...`);
  }

  console.log("\n✅ ROLLBACK COMPLETED: All product categories and IDs have been restored to their exact pre-sync state.");
  await mongoose.disconnect();
}

rollback().catch(err => {
  console.error("Rollback failed:", err);
  process.exit(1);
});
