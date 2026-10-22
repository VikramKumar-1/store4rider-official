import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  
  const cats = await Category.find({
    description: { $regex: 'Price Bracket', $options: 'i' }
  }).lean();
  
  console.log('Found categories with Price Bracket in description:', cats.length);
  for (const c of cats as any[]) {
    console.log('====================================');
    console.log('Category Name:', c.name);
    console.log('Category Slug:', c.slug);
    console.log('Description:\n', c.description);
  }

  // Also let's check if there are other categories with price links in descriptions
  const priceCats = await Category.find({
    description: { $regex: 'below Rs', $options: 'i' }
  }).lean();
  console.log('\nFound categories with "below Rs" in description:', priceCats.length);
  for (const c of priceCats as any[]) {
    console.log('Category Name:', c.name, '| Slug:', c.slug);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
