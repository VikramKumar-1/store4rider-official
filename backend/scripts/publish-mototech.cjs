const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function fixMototech() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

  // Update it to published and in-stock so it shows up on frontend
  await Product.updateOne(
    { name: 'MotoTech Sniper Denim Biker Jeans' },
    { $set: { status: 'published', stockStatus: 1 } }
  );

  console.log("Success! Changed MotoTech Sniper Denim Biker Jeans to 'published' and 'In Stock'.");
  process.exit(0);
}
fixMototech().catch(console.error);
