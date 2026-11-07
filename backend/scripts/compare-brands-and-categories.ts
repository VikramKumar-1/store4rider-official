import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function compare() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB Atlas');

  const Brand = mongoose.connection.collection('brands');
  const Category = mongoose.connection.collection('categories');

  const dbBrands = await Brand.find({}).toArray();
  const dbCategories = await Category.find({}).toArray();

  const magentoBrands = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../all-magento-brands.json'), 'utf8'));
  const magentoCategories = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../all-magento-categories.json'), 'utf8'));

  console.log('\n--- BRANDS COMPARISON ---');
  console.log('MongoDB brands count:', dbBrands.length);
  console.log('Magento brands count:', magentoBrands.length);

  const dbBrandSlugs = new Set(dbBrands.map(b => b.slug?.toLowerCase()));
  const dbBrandNames = new Set(dbBrands.map(b => b.name?.toLowerCase()));

  const missingBrands = [];
  for (const mb of magentoBrands) {
    const slug1 = mb.urlKey?.toLowerCase();
    const slug2 = mb.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const name = mb.name?.toLowerCase();

    const exists = dbBrandNames.has(name) || (slug1 && dbBrandSlugs.has(slug1)) || (slug2 && dbBrandSlugs.has(slug2));
    if (!exists) {
      missingBrands.push(mb);
    }
  }

  console.log('Missing Magento brands in MongoDB:', missingBrands.length);
  for (const b of missingBrands) {
    console.log(`- [ID ${b.brandId}] "${b.name}" | urlKey: ${b.urlKey || 'N/A'} | active: ${b.isActive} | thumb: ${b.thumbnail || 'N/A'}`);
  }

  console.log('\n--- CATEGORIES COMPARISON ---');
  console.log('MongoDB categories count:', dbCategories.length);
  console.log('Magento categories count:', magentoCategories.length);

  const dbCatSlugs = new Set(dbCategories.map(c => c.slug?.toLowerCase()));
  const dbCatNames = new Set(dbCategories.map(c => c.name?.toLowerCase()));

  const missingCategories = [];
  for (const mc of magentoCategories) {
    if (!mc.name || mc.name === 'Root Catalog' || mc.name === 'Root Test 01' || mc.name === 'Default Category') continue;
    const slug = mc.urlKey?.toLowerCase() || mc.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const name = mc.name?.toLowerCase();

    const exists = dbCatSlugs.has(slug) || dbCatNames.has(name);
    if (!exists) {
      missingCategories.push(mc);
    }
  }

  console.log('Missing Magento categories in MongoDB:', missingCategories.length);
  for (const c of missingCategories) {
    console.log(`- [ID ${c.entityId}] "${c.name}" | slug: ${c.urlKey} | parentId: ${c.parentId} | active: ${c.isActive} | inMenu: ${c.includeInMenu}`);
  }

  process.exit(0);
}

compare().catch((err) => {
  console.error(err);
  process.exit(1);
});
