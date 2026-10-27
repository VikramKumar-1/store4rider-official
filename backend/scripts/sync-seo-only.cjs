const fs = require('fs');
const Papa = require('papaparse');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'backend/.env' });

async function syncSeoOnly() {
  console.log("==================================================");
  console.log("  ACCURATE SEO-ONLY MAPPING & BACKFILL SCRIPT");
  console.log("  Scope: metaTitle, metaKeywords, metaDescription ONLY");
  console.log("==================================================");

  const csvPath = 'backup-data/latestcsv.csv';
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  // 1. Read CSV and extract ONLY SEO fields + variation linkages
  console.log("\n[1/3] Parsing CSV for SEO fields...");
  const csvDataMap = new Map();
  const configurables = [];

  await new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(csvPath);
    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      step: function(results) {
        const row = results.data;
        const sku = row.sku ? row.sku.trim() : "";
        if (!sku) return;

        const metaTitle = row.meta_title ? row.meta_title.trim() : "";
        const metaKeywords = (row.meta_keywords || row.meta_keyword) ? (row.meta_keywords || row.meta_keyword).trim() : "";
        const metaDescription = row.meta_description ? row.meta_description.trim() : "";
        const productType = row.product_type ? row.product_type.trim() : "simple";
        const configurableVariations = row.configurable_variations ? row.configurable_variations.trim() : "";

        const item = {
          sku,
          productType,
          configurableVariations,
          metaTitle,
          metaKeywords,
          metaDescription,
        };

        csvDataMap.set(sku, item);
        if (productType === "configurable") {
          configurables.push(item);
        }
      },
      complete: function() {
        resolve();
      },
      error: function(err) {
        reject(err);
      }
    });
  });

  console.log(`Parsed ${csvDataMap.size} unique SKUs from CSV (${configurables.length} configurables).`);

  // 2. Fallback inheritance: If parent configurable product is missing SEO tags, inherit from child variants
  let inheritedCount = 0;
  for (const parent of configurables) {
    if (!parent.metaTitle || !parent.metaKeywords || !parent.metaDescription) {
      const varStr = parent.configurableVariations;
      let childSkus = [];
      if (varStr.includes("sku=")) {
        const matches = varStr.match(/sku=([^,|]+)/g);
        if (matches) {
          childSkus = matches.map(s => s.split("=")[1].trim());
        }
      } else if (varStr) {
        childSkus = varStr.split(",").map(s => s.trim()).filter(Boolean);
      }

      for (const childSku of childSkus) {
        const child = csvDataMap.get(childSku);
        if (child) {
          let updated = false;
          if (!parent.metaTitle && child.metaTitle) {
            parent.metaTitle = child.metaTitle;
            updated = true;
          }
          if (!parent.metaKeywords && child.metaKeywords) {
            parent.metaKeywords = child.metaKeywords;
            updated = true;
          }
          if (!parent.metaDescription && child.metaDescription) {
            parent.metaDescription = child.metaDescription;
            updated = true;
          }
          if (updated) inheritedCount++;
        }
        if (parent.metaTitle && parent.metaKeywords && parent.metaDescription) break;
      }
    }
  }
  console.log(`Inherited SEO metadata for ${inheritedCount} parent/child variants where parent had empty tags.`);

  // 3. Connect to MongoDB
  const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Missing DATABASE_URL / MONGODB_URI in backend/.env");
    process.exit(1);
  }

  console.log("\n[2/3] Connecting to MongoDB...");
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const productsColl = db.collection("products");

  // Fetch only necessary fields for comparison
  console.log("Fetching existing products from database...");
  const dbProducts = await productsColl.find(
    {},
    { projection: { _id: 1, sku: 1, slug: 1, metaTitle: 1, metaKeywords: 1, metaDescription: 1 } }
  ).toArray();

  console.log(`Found ${dbProducts.length} products in MongoDB.`);

  // 4. Compute changes strictly for SEO fields
  console.log("\n[3/3] Preparing strictly SEO updates...");
  const bulkOps = [];
  let alreadyUpToDate = 0;
  let noCsvMatch = 0;

  for (const p of dbProducts) {
    const csvData = csvDataMap.get(p.sku);
    if (!csvData) {
      noCsvMatch++;
      continue;
    }

    const updates = {};

    // Check metaTitle
    if (csvData.metaTitle && p.metaTitle !== csvData.metaTitle) {
      updates.metaTitle = csvData.metaTitle;
    }
    // Check metaKeywords
    if (csvData.metaKeywords && p.metaKeywords !== csvData.metaKeywords) {
      updates.metaKeywords = csvData.metaKeywords;
    }
    // Check metaDescription
    if (csvData.metaDescription && p.metaDescription !== csvData.metaDescription) {
      updates.metaDescription = csvData.metaDescription;
    }

    if (Object.keys(updates).length > 0) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: updates }
        }
      });
    } else {
      alreadyUpToDate++;
    }
  }

  console.log(`Products already accurate: ${alreadyUpToDate}`);
  console.log(`Products without CSV SKU match: ${noCsvMatch}`);
  console.log(`Products requiring SEO updates: ${bulkOps.length}`);

  if (bulkOps.length > 0) {
    const BATCH_SIZE = 500;
    let modifiedTotal = 0;
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      const res = await productsColl.bulkWrite(batch, { ordered: false });
      modifiedTotal += res.modifiedCount;
      console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1} (${Math.min(i + BATCH_SIZE, bulkOps.length)}/${bulkOps.length}) - Modified: ${res.modifiedCount}`);
    }
    console.log(`\nSuccessfully updated SEO fields on ${modifiedTotal} products!`);
  } else {
    console.log("\nAll products in DB already match CSV SEO fields. No updates required.");
  }

  // 5. Verification Check
  console.log("\n=== VERIFICATION IN DATABASE ===");
  const countWithMetaTitle = await productsColl.countDocuments({ metaTitle: { $exists: true, $nin: ["", null] } });
  const countWithMetaKeywords = await productsColl.countDocuments({ metaKeywords: { $exists: true, $nin: ["", null] } });
  const countWithMetaDescription = await productsColl.countDocuments({ metaDescription: { $exists: true, $nin: ["", null] } });

  console.log(`Total Products in DB: ${dbProducts.length}`);
  console.log(`Products with metaTitle: ${countWithMetaTitle}`);
  console.log(`Products with metaKeywords: ${countWithMetaKeywords}`);
  console.log(`Products with metaDescription: ${countWithMetaDescription}`);

  const sample = await productsColl.find(
    { metaTitle: { $exists: true, $nin: ["", null] } },
    { projection: { sku: 1, name: 1, metaTitle: 1, metaKeywords: 1, metaDescription: 1 } }
  ).limit(3).toArray();
  console.log("\nSample Verified Product in DB:", JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
  console.log("\nSync Completed Cleanly with ZERO interference to other fields!");
}

syncSeoOnly().catch((err) => {
  console.error("Fatal Error during SEO sync:", err);
  process.exit(1);
});
