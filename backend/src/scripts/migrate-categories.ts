import mongoose from "mongoose";
import dotenv from "dotenv";
import { ProductModel } from "../modules/product/product.model";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Load environment variables
dotenv.config();

async function migrateCategories() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/store4riders";
    console.log("Connecting to MongoDB...", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    console.log("Fetching all products...");
    const products = await ProductModel.find({}).select("_id magentoCategories");
    console.log(`Found ${products.length} products to migrate.`);

    let updatedCount = 0;

    for (const product of products) {
      if (!product.magentoCategories) continue;

      const slugs = new Set<string>();
      const paths = product.magentoCategories.split(",");
      
      for (const path of paths) {
        // Skip messy price-based Magento categories
        const pathLower = path.toLowerCase();
        if (pathLower.includes("between") || pathLower.includes("under ") || pathLower.includes("price") || pathLower.includes("rs.") || pathLower.includes("₹")) {
          continue;
        }

        const parts = path.split("/").map((part: string) => part.trim()).filter((part: string) => part && !part.toLowerCase().includes("root") && !part.toLowerCase().includes("default"));
        
        for (const part of parts) {
          if (part) {
            slugs.add(slugify(part));
          }
        }
      }

      const slugArray = Array.from(slugs);
      
      // Update the document with the new categorySlugs array
      // Note: We use updateOne with strict: false so we can push fields not strictly defined in Schema if needed,
      // but we should ideally add categorySlugs to product.model.ts as well.
      await ProductModel.updateOne(
        { _id: product._id },
        { $set: { categorySlugs: slugArray } },
        { strict: false }
      );

      updatedCount++;
      if (updatedCount % 500 === 0) {
        console.log(`Processed ${updatedCount} products...`);
      }
    }

    console.log(`Migration complete! Successfully added exact category slugs to ${updatedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateCategories();
