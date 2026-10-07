const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

  const configurables = await Product.find({
    productType: 'configurable',
    $or: [{ basePrice: 0 }, { basePrice: { $exists: false } }, { basePrice: null }]
  });

  console.log(`Found ${configurables.length} configurable products with 0 basePrice.`);
  let updatedCount = 0;

  for (const parent of configurables) {
    let children = [];
    let childSkus = [];

    if (parent.configurableVariations) {
      const parts = parent.configurableVariations.split('|');
      childSkus = parts.map(p => {
        const match = p.match(/sku=(.*?)(?:,|$)/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      if (childSkus.length > 0) {
        children = await Product.find({ sku: { $in: childSkus } }).lean();
      }
    }

    if (children.length === 0 && parent.sku) {
      children = await Product.find({ sku: new RegExp(`^${parent.sku}[-_]`, 'i'), productType: 'simple' }).lean();
    }
    
    // Also try without productType: 'simple' just in case
    if (children.length === 0 && parent.sku) {
      children = await Product.find({ sku: new RegExp(`^${parent.sku}[-_]`, 'i') }).lean();
    }

    if (children.length > 0) {
      // Find the minimum price > 0 among children
      const validPrices = children.map(c => c.basePrice || c.specialPrice || c.price).filter(p => p > 0);
      
      if (validPrices.length > 0) {
        const minPrice = Math.min(...validPrices);
        console.log(`[FIXED] ${parent.sku} (${parent.name}) -> basePrice updated to ₹${minPrice}`);
        await Product.updateOne({ _id: parent._id }, { $set: { basePrice: minPrice } });
        updatedCount++;
      } else {
        // Look at the children's actual data to see why they have 0 price
        console.log(`[SKIPPED] ${parent.sku} -> Children found but all have 0 price! Sample child:`, 
          JSON.stringify({sku: children[0].sku, basePrice: children[0].basePrice, specialPrice: children[0].specialPrice, price: children[0].price})
        );
      }
    } else {
      console.log(`[SKIPPED] ${parent.sku} -> No children found. Searched for SKUs:`, childSkus.slice(0, 3));
    }
  }

  console.log(`\nSuccessfully fixed prices for ${updatedCount} parent products.`);
  process.exit(0);
}

run().catch(console.error);
