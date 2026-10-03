import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../backend/.env") });

import { CategoryModel } from "../backend/src/modules/category/category.model";
import { ICategoryFilterConfig } from "@store4riders/shared-types";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/store4riders";

const CATEGORY_FILTER_CONFIGS: Record<string, ICategoryFilterConfig[]> = {
  // Helmets and sub-categories
  "motorcycle-helmets": [
    { code: "brand", label: "Brand", type: "checkbox", sortOrder: 1, isActive: true },
    { code: "helmet_type", label: "Helmet Type", type: "checkbox", sortOrder: 2, isActive: true },
    { code: "certification", label: "Certification", type: "checkbox", sortOrder: 3, isActive: true },
    { code: "size", label: "Size", type: "checkbox", sortOrder: 4, isActive: true },
    { code: "color", label: "Color", type: "swatch", sortOrder: 5, isActive: true },
    { code: "price", label: "Price", type: "range", sortOrder: 6, isActive: true },
  ],
  // Jackets
  "riding-jackets": [
    { code: "brand", label: "Brand", type: "checkbox", sortOrder: 1, isActive: true },
    { code: "gender", label: "Gender", type: "checkbox", sortOrder: 2, isActive: true },
    { code: "material", label: "Material", type: "checkbox", sortOrder: 3, isActive: true },
    { code: "riding_style", label: "Riding Style", type: "checkbox", sortOrder: 4, isActive: true },
    { code: "size", label: "Size", type: "checkbox", sortOrder: 5, isActive: true },
    { code: "color", label: "Color", type: "swatch", sortOrder: 6, isActive: true },
    { code: "price", label: "Price", type: "range", sortOrder: 7, isActive: true },
  ],
  // Gloves
  "riding-gloves": [
    { code: "brand", label: "Brand", type: "checkbox", sortOrder: 1, isActive: true },
    { code: "gender", label: "Gender", type: "checkbox", sortOrder: 2, isActive: true },
    { code: "material", label: "Material", type: "checkbox", sortOrder: 3, isActive: true },
    { code: "size", label: "Size", type: "checkbox", sortOrder: 4, isActive: true },
    { code: "color", label: "Color", type: "swatch", sortOrder: 5, isActive: true },
    { code: "price", label: "Price", type: "range", sortOrder: 6, isActive: true },
  ],
  // Luggage / Bags
  "motorcycle-luggage": [
    { code: "brand", label: "Brand", type: "checkbox", sortOrder: 1, isActive: true },
    { code: "color", label: "Color", type: "swatch", sortOrder: 2, isActive: true },
    { code: "price", label: "Price", type: "range", sortOrder: 3, isActive: true },
  ],
  // Default for any category without explicit config
  "_default": [
    { code: "brand", label: "Brand", type: "checkbox", sortOrder: 1, isActive: true },
    { code: "size", label: "Size", type: "checkbox", sortOrder: 2, isActive: true },
    { code: "color", label: "Color", type: "swatch", sortOrder: 3, isActive: true },
    { code: "price", label: "Price", type: "range", sortOrder: 4, isActive: true },
  ],
};

async function seedCategoryFilters() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    let updatedCount = 0;

    // We can also query the database and update specific parent categories, 
    // and let the logic apply to children if needed.
    // For now, we are updating categories exactly matching these slugs.
    for (const [slug, config] of Object.entries(CATEGORY_FILTER_CONFIGS)) {
      if (slug === "_default") continue;

      const result = await CategoryModel.updateMany(
        { slug: { $regex: new RegExp(slug, 'i') } }, // Updating the parent and matching ones
        { $set: { filterConfig: config } }
      );
      
      updatedCount += result.modifiedCount;
      console.log(`Updated ${result.modifiedCount} categories for slug: ${slug}`);
    }

    console.log(`Successfully seeded filters for ${updatedCount} categories.`);
  } catch (error) {
    console.error("Error during seeding filters:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedCategoryFilters();
