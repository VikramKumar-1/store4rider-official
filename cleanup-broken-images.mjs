import mongoose from "mongoose";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: "./backend/.env" });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema, "products");

async function checkImage(url) {
  try {
    const res = await fetch(url, { method: "HEAD", timeout: 3000 });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function fixAxorImages() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connected to DB");

    // Find the problematic product
    const p = await ProductModel.findOne({ slug: /axor-apex-hunter-helmets-gloss/ });
    if (!p) {
      console.log("❌ Product not found");
      process.exit();
    }

    console.log(`📦 Found Product: ${p.name}`);
    console.log(`🔍 Total images in DB: ${p.images.length}`);

    const validImages = [];
    
    // Check all images
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i];
      process.stdout.write(`Checking [${i}] ${img.url.substring(img.url.lastIndexOf('/') + 1)} ... `);
      const isValid = await checkImage(img.url);
      if (isValid) {
        console.log("✅ OK");
        validImages.push(img);
      } else {
        console.log("❌ BROKEN (404)");
      }
    }

    // Check variant images
    const validVariants = [];
    if (p.variants) {
      for (let i = 0; i < p.variants.length; i++) {
        const v = p.variants[i];
        if (v.imageUrl) {
          process.stdout.write(`Checking Variant ${v.sku} image ... `);
          const isValid = await checkImage(v.imageUrl);
          if (isValid) {
            console.log("✅ OK");
            validVariants.push(v.imageUrl);
          } else {
            console.log("❌ BROKEN (404)");
          }
        }
      }
    }

    console.log(`\n📊 Results: ${validImages.length} valid out of ${p.images.length}`);
    console.log(`📊 Variant Images: ${validVariants.length} valid`);

    if (validImages.length === 0 && validVariants.length > 0) {
      // If ALL parent images are broken, but variants have images, use the first variant image as the parent image!
      console.log("♻️ Fixing parent images using valid variant images...");
      const uniqueVariants = [...new Set(validVariants)];
      p.images = uniqueVariants.map((url, idx) => ({ url, altText: p.name + " " + idx }));
      await p.save();
      console.log(`💾 Database updated! Replaced 23 broken parent images with ${uniqueVariants.length} valid variant images.`);
    } else if (validImages.length > 0 && validImages.length < p.images.length) {
      p.images = validImages;
      await p.save();
      console.log("💾 Database updated! Broken links removed from product.");
    } else if (validImages.length === 0) {
      console.log("⚠️ ALL images are broken! Cannot fix automatically.");
    } else {
      console.log("✨ All images were already valid.");
    }

    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixAxorImages();
