import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/store4riders";

const ALL_COLORS = ["black", "white", "red", "blue", "green", "yellow", "orange", "grey", "gray", "pink", "purple", "brown", "silver", "gold", "neon", "flu", "matte", "gloss"];

async function run() {
  await mongoose.connect(MONGODB_URI);
  const ProductModel = mongoose.model("Product", new mongoose.Schema({}, { strict: false, collection: "products" }));

  const products = await ProductModel.find({ 
    images: { $exists: true, $not: { $size: 0 } },
    $or: [
      { variants: { $exists: true, $not: { $size: 0 } } },
      { configurableVariations: { $exists: true, $ne: "" } }
    ]
  });

  let updatedCount = 0;

  for (const p of products) {
    const availableColors = new Set<string>();
    
    if (p.variants) {
      p.variants.forEach((v: any) => {
        if (v.attributes?.color) availableColors.add(v.attributes.color.trim());
        if (v.attributes?.colour) availableColors.add(v.attributes.colour.trim());
      });
    }
    if (p.configurableVariations) {
      const vars = p.configurableVariations.split("|");
      for (const variant of vars) {
        variant.split(",").forEach((attr: string) => {
          const [k, v] = attr.split("=");
          if (k && v && (k.trim().toLowerCase() === 'color' || k.trim().toLowerCase() === 'colour')) {
            availableColors.add(v.trim());
          }
        });
      }
    }

    if (availableColors.size === 0) continue;

    const colorImages: Record<string, string> = {};
    const images = p.images || [];

    for (const color of availableColors) {
      const colorWords = color.toLowerCase().split(/[\/\s-]/).filter((w: string) => w.length > 2 && w !== 'flu.');
      
      let bestImg = null;
      let bestScore = -1;

      for (const img of images) {
        const textToSearch = ((img.url || "") + " " + (img.altText || "")).toLowerCase();
        
        // Exact match in alt text is always best
        if (img.altText && img.altText.toLowerCase() === color.toLowerCase()) {
          bestImg = img;
          bestScore = 1000;
          break;
        }

        // Must contain all words
        if (colorWords.length > 0 && colorWords.every((w: string) => textToSearch.includes(w))) {
          // Calculate penalty for OTHER colors present in the URL
          let penalty = 0;
          for (const c of ALL_COLORS) {
            // If the image URL contains a color name that is NOT in our target color, penalize it!
            if (!colorWords.includes(c) && textToSearch.includes(c)) {
              penalty += 10;
            }
          }
          
          const score = 100 - penalty;
          if (score > bestScore) {
            bestScore = score;
            bestImg = img;
          }
        }
      }

      if (bestImg && bestImg.url) {
        colorImages[color] = bestImg.url;
      }
    }

    if (Object.keys(colorImages).length > 0) {
      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { colorImages: colorImages } }
      );
      updatedCount++;
    }
  }

  console.log(`Successfully mapped colorImages intelligently for ${updatedCount} products.`);
  mongoose.disconnect();
}
run().catch(console.error);
