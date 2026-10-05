import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../backend/.env") });
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/store4riders";

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

  console.log(`Found ${products.length} products to check for color images...`);

  let updatedCount = 0;

  for (const p of products) {
    const availableColors = new Set<string>();
    
    // Extract colors
    if (p.variants && p.variants.length > 0) {
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
      
      // Try exact match in altText first
      let matchedImg = images.find((img: any) => img.altText && img.altText.toLowerCase().includes(color.toLowerCase()));
      
      // Try word match in URL or altText
      if (!matchedImg && colorWords.length > 0) {
        matchedImg = images.find((img: any) => {
          const textToSearch = ((img.url || "") + " " + (img.altText || "")).toLowerCase();
          return colorWords.every((w: string) => textToSearch.includes(w));
        });
      }

      if (matchedImg && matchedImg.url) {
        colorImages[color] = matchedImg.url;
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

  console.log(`Successfully mapped and saved colorImages to the DB for ${updatedCount} products.`);
  mongoose.disconnect();
}

run().catch(console.error);
