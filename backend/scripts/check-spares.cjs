const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false, collection: 'categories' }));
  
  const spares = await Category.find({ name: /spare/i }).lean();
  console.log("Spares categories:", spares);

  const perform = await Category.find({ name: /performance/i }).lean();
  console.log("Performance categories:", perform);
  
  process.exit(0);
}

run().catch(console.error);
