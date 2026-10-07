const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://store4riders:vikram@cluster0.zoxp7.mongodb.net/store4riders?retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const p = await Product.findOne({ name: { $regex: /Rynox Tornado Pro 4/i }, productType: 'configurable' }).lean();
  if (!p) {
    console.log("Not found");
    process.exit(0);
  }
  
  console.log("Images for: " + p.name);
  p.images.forEach((img, i) => {
    console.log(`[${i}] URL: ${img.url}`);
    console.log(`    ALT: ${img.altText}`);
  });
  
  process.exit(0);
}

run().catch(console.error);
