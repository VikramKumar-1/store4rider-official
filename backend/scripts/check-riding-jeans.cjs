const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function checkRidingJeans() {
  await mongoose.connect(MONGODB_URI);
  
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

  const filter = {
    status: { $ne: "archived" },
    $or: [{ name: /\b(jeans?|denims?)\b/i }, { magentoCategories: /\b(jeans?|denims?)\b/i }],
    name: { $not: /\b(jacket|shirt|top)\b/i }
  };

  const count = await Product.countDocuments(filter);
  console.log(`\n===========================================`);
  console.log(`Total products for riding-jeans (with regex): ${count}`);

  if (count > 0) {
    const sample = await Product.find(filter).select("name magentoCategories").limit(5).lean();
    console.log(`\nSamples:`, sample);
  } else {
    console.log(`\nZero products found. Let's check what happens if we remove the negative filter...`);
    const countWithoutNegative = await Product.countDocuments({
      status: { $ne: "archived" },
      $or: [{ name: /\b(jeans?|denims?)\b/i }, { magentoCategories: /\b(jeans?|denims?)\b/i }]
    });
    console.log(`Total if we DON'T exclude jackets: ${countWithoutNegative}`);
    
    if (countWithoutNegative > 0) {
      const sample2 = await Product.find({
        status: { $ne: "archived" },
        $or: [{ name: /\b(jeans?|denims?)\b/i }, { magentoCategories: /\b(jeans?|denims?)\b/i }]
      }).select("name magentoCategories").limit(5).lean();
      console.log(`\nSamples without negative filter:`, sample2);
    }
  }
  
  console.log(`===========================================\n`);
  process.exit(0);
}

checkRidingJeans().catch(console.error);
