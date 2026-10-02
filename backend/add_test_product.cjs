require("dotenv").config();
const mongoose = require("mongoose");
const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const MONGODB_URI = process.env.MONGODB_URI;

const productSchema = new mongoose.Schema({}, { strict: false });
const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema, "products");

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");
    
    const name = "Test Riding Jacket Pro";
    const sku = "TEST-JKT-PRO-001";
    
    const existing = await ProductModel.findOne({ sku });
    if (existing) {
      console.log("Product already exists with SKU:", sku);
      process.exit(0);
    }
    
    const doc = {
      name,
      description: "<p>A high-quality test riding jacket.</p>",
      shortDescription: "High quality test riding jacket.",
      slug: slugify(name),
      sku,
      basePrice: 5000,
      specialPrice: 4500,
      weight: 1.5,
      stockStatus: 1,
      qty: 100,
      productType: "simple",
      images: [
        {
          id: "img1",
          url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
          altText: "Jacket"
        }
      ],
      variants: [],
      status: "published",
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product = new ProductModel(doc);
    await product.save();
    console.log(`Test product inserted successfully! SKU: ${sku}`);
  } catch (error) {
    console.error("Error inserting product:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
