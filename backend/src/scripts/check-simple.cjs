const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function checkSimple() {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.collection('products');
  const simple = await coll.findOne({ 'variants.0': { $exists: false } });
  console.log('Sample simple product:');
  console.log('Name:', simple.name);
  console.log('stockStatus:', simple.stockStatus);
  console.log('qty:', simple.qty);
  console.log('stock:', simple.stock);
  const withQty = await coll.countDocuments({ 'variants.0': { $exists: false }, qty: { $exists: true } });
  console.log('Simple products with qty field:', withQty);
  const withStockStatus = await coll.countDocuments({ 'variants.0': { $exists: false }, stockStatus: 1 });
  console.log('Simple products with stockStatus === 1:', withStockStatus);
  await mongoose.disconnect();
}
checkSimple().catch(console.error);
