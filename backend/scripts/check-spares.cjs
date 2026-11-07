require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

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
