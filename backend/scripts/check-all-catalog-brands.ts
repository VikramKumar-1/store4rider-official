import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkCatalogBrands() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB Atlas');

  const Product = mongoose.connection.collection('products');
  const Brand = mongoose.connection.collection('brands');

  const distinctBrands = await Product.distinct('brand');
  const distinctAttrBrands = await Product.distinct('attributes.brand');
  const distinctMfg = await Product.distinct('attributes.manufacturer');

  const allProductBrands = new Set([
    ...distinctBrands,
    ...distinctAttrBrands,
    ...distinctMfg
  ].filter(Boolean).map(b => b.trim()));

  console.log('\nTotal unique brand strings found on products in DB:', allProductBrands.size);
  console.log([...allProductBrands].sort());

  const magentoBrands = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../all-magento-brands.json'), 'utf8'));
  const dbBrands = await Brand.find({}).toArray();

  console.log('\nMongoDB brands currently:', dbBrands.map(b => b.name));

  process.exit(0);
}

checkCatalogBrands().catch(console.error);
