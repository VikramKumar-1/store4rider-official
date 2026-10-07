const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function exploreBrands() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

  console.log("Checking for ANY trace of HJC, AGV, LS2, or ALPINESTARS...");
  
  const sample2 = await Product.findOne({
    $or: [
      { name: /hjc|agv|ls2|alpinestars/i },
      { brand: /hjc|agv|ls2|alpinestars/i },
      { magentoCategories: /hjc|agv|ls2|alpinestars/i },
      { 'attributes.brand': /hjc|agv|ls2|alpinestars/i },
      { 'attributes.manufacturer': /hjc|agv|ls2|alpinestars/i }
    ]
  }).lean();
  
  if (sample2) {
    console.log("\nFound a product!");
    console.log("Name:", sample2.name);
    console.log("Brand Field:", sample2.brand);
    console.log("Categories:", sample2.magentoCategories);
  } else {
    console.log("\nRegex found NO trace of HJC, AGV, LS2, or ALPINESTARS anywhere in the database.");
    console.log("This means these products were NOT part of your CSV export.");
  }

  process.exit(0);
}

exploreBrands().catch(console.error);
