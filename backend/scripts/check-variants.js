const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  const p = await Product.findOne({ slug: 'raida-kavac-motorcycle-jacket' });
  console.log("Config Variations:", p?.configurableVariations);
  
  if (p?.configurableVariations) {
    const vars = p.configurableVariations.split("|");
    const skus = vars.map(v => v.split(',').find(a => a.startsWith('sku='))?.split('=')[1]);
    console.log("Child SKUs:", skus);
    const children = await Product.find({ sku: { $in: skus } }).toArray();
    console.log("Found children in DB:", children.map(c => c.sku));
  }
  process.exit(0);
}
check();
