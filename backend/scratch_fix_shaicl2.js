import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const current = await db.collection('products').findOne({ sku: 'SHAICL2' });
  if (!current) {
    console.error('SHAICL2 not found!');
    process.exit(1);
  }
  
  console.log('Current categorySlugs:', current.categorySlugs);
  console.log('Current magentoCategories:', current.magentoCategories);
  
  // Clean up categorySlugs
  const filteredSlugs = (current.categorySlugs || []).filter(
    (slug) => !slug.includes('knee') && !slug.includes('touring-pant')
  );
  if (!filteredSlugs.includes('protectors-armour')) filteredSlugs.push('protectors-armour');
  if (!filteredSlugs.includes('protectors-armours')) filteredSlugs.push('protectors-armours');
  
  const newMagentoCategories = 'Root Test 01/Riding Gear,Root Test 01/Riding Gear/Riding Jackets | Bike Jackets/Protectors / Armour';
  
  const updateResult = await db.collection('products').updateOne(
    { sku: 'SHAICL2' },
    {
      $set: {
        categorySlugs: filteredSlugs,
        magentoCategories: newMagentoCategories,
        updatedAt: new Date()
      }
    }
  );
  
  console.log('Update result:', updateResult);
  
  const updated = await db.collection('products').findOne({ sku: 'SHAICL2' });
  console.log('Updated categorySlugs:', updated.categorySlugs);
  console.log('Updated magentoCategories:', updated.magentoCategories);
  
  process.exit(0);
}
run().catch(console.error);
