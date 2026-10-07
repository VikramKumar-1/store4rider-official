const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function checkStock() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

  const parent = await Product.findOne({ name: 'MotoTech Sniper Denim Biker Jeans' }).lean();
  console.log("Parent Status:", {
    name: parent.name,
    stockStatus: parent.stockStatus,
    status: parent.status,
    visibility: parent.visibility
  });

  process.exit(0);
}
checkStock().catch(console.error);
