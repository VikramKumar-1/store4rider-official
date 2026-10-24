import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: 'backend/.env' });

const REPLACEMENTS: { [oldPattern: string]: string } = {
  '/riding-gear/riding-jackets/riding-jackets/bike-riding-jackets-below-6000': '/riding-gear/riding-jackets?maxPrice=6000',
  '/riding-gear/riding-jackets/riding-jackets/riding-jackets-between-rs-6000-8000': '/riding-gear/riding-jackets?minPrice=6000&maxPrice=8000',
  '/riding-gear/riding-jackets/riding-jackets/bike-jackets-between-8000-10000': '/riding-gear/riding-jackets?minPrice=8000&maxPrice=10000',
  '/riding-gear/riding-jackets/riding-jackets/best-riding-jackets-between-10000-20000': '/riding-gear/riding-jackets?minPrice=10000&maxPrice=20000',
  '/riding-gear/riding-jackets/riding-jackets/premium-mesh-riding-jackets': '/riding-gear/riding-jackets?minPrice=20000',
  '/riding-gear/riding-gloves/short-motorbike-gloves/riding-gloves-below-rs-3000': '/riding-gear/riding-gloves/short-motorbike-gloves?maxPrice=3000',
  
  // Also check without the duplicate /riding-jackets/
  '/riding-gear/riding-jackets/bike-riding-jackets-below-6000': '/riding-gear/riding-jackets?maxPrice=6000',
  '/riding-gear/riding-jackets/riding-jackets-between-rs-6000-8000': '/riding-gear/riding-jackets?minPrice=6000&maxPrice=8000',
  '/riding-gear/riding-jackets/bike-jackets-between-8000-10000': '/riding-gear/riding-jackets?minPrice=8000&maxPrice=10000',
  '/riding-gear/riding-jackets/best-riding-jackets-between-10000-20000': '/riding-gear/riding-jackets?minPrice=10000&maxPrice=20000',
  '/riding-gear/riding-jackets/premium-mesh-riding-jackets': '/riding-gear/riding-jackets?minPrice=20000',

  // Brand link cleanup in riding-jackets description
  '/rynox-riding-jacket': '/riding-gear/riding-jackets?brand=Rynox',
  '/brands/royal-enfield-helmet-riding-gear': '/brands/royal-enfield',
  '/brands/tvs-racing-performance-gear': '/brands/tvs',
  '/brands/furygan-riding-gear-india': '/brands/furygan',
  '/brands/rs-taichi-india': '/brands/rs-taichi',
  '/brands/biking-brotherhood-riding-gear': '/brands/biking-brotherhood',
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  const categories = await Category.find({
    description: { $exists: true, $ne: null }
  });

  console.log(`Scanning ${categories.length} categories for price bracket and broken links...`);

  const backup: any[] = [];
  let updatedCount = 0;

  for (const cat of categories) {
    let desc: string = cat.description || '';
    let modified = false;

    for (const [oldUrl, newUrl] of Object.entries(REPLACEMENTS)) {
      if (desc.includes(oldUrl)) {
        // backup original
        if (!modified) {
          backup.push({
            id: cat._id,
            slug: cat.slug,
            name: cat.name,
            originalDescription: cat.description
          });
        }
        desc = desc.split(oldUrl).join(newUrl);
        modified = true;
        console.log(`[${cat.slug}] Replaced ${oldUrl} -> ${newUrl}`);
      }
    }

    if (modified) {
      cat.description = desc;
      await cat.save();
      updatedCount++;
    }
  }

  if (backup.length > 0) {
    fs.writeFileSync('backend/scripts/category-desc-backup.json', JSON.stringify(backup, null, 2));
    console.log(`Saved backup of ${backup.length} categories to backend/scripts/category-desc-backup.json`);
  }

  console.log(`\nSuccessfully updated ${updatedCount} categories in MongoDB Atlas!`);
  await mongoose.disconnect();
}

run().catch(console.error);
