require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function checkRidingGear() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

  const count = await Product.countDocuments({
    status: { $ne: "archived" },
    stockStatus: 1, // Optional: if stock filtering is on
    $or: [
      { magentoCategories: /riding gear/i },
      { name: /\b(jacket|jackets|glove|gloves|boot|boots|pant|pants)\b/i }
    ]
  });

  console.log(`Total products for riding-gear: ${count}`);

  const sample = await Product.findOne({
    status: { $ne: "archived" },
    $or: [
      { magentoCategories: /riding gear/i },
      { name: /\b(jacket|jackets|glove|gloves|boot|boots|pant|pants)\b/i }
    ]
  }).select("name magentoCategories").lean();

  console.log(`Sample:`, sample);
  process.exit(0);
}

checkRidingGear().catch(console.error);
