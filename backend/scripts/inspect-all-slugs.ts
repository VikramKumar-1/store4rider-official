import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error("No MongoDB URI");

  await mongoose.connect(uri);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  // 1. Get all category docs from DB
  const categories = await Category.find({}).select('name slug parentId').lean();
  const dbCategorySlugs = new Set(categories.map((c: any) => c.slug));
  console.log(`=== TOTAL CATEGORY DOCS IN DB: ${categories.length} ===`);

  // 2. Aggregate all unique categorySlugs currently in DB across all 3580 products
  const slugCounts = await Product.aggregate([
    { $unwind: '$categorySlugs' },
    { $group: { _id: '$categorySlugs', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log('\n=== CURRENT SLUGS PRESENT ON PRODUCTS (Top 50) ===');
  for (const s of slugCounts.slice(0, 50)) {
    const inCat = dbCategorySlugs.has(s._id) ? '✅' : '❌ NOT_IN_CAT_COLLECTION';
    console.log(`${s.count.toString().padStart(5)}x  "${s._id}" ${inCat}`);
  }

  // 3. Products with empty categorySlugs
  const noSlugs = await Product.countDocuments({
    $or: [{ categorySlugs: { $exists: false } }, { categorySlugs: { $size: 0 } }]
  });
  console.log(`\nProducts with NO categorySlugs at all: ${noSlugs}`);

  // 4. Products that have categoryId vs not
  const withCatId = await Product.countDocuments({ categoryId: { $exists: true, $ne: null, $ne: "" } });
  const totalProducts = await Product.countDocuments();
  console.log(`Products with categoryId: ${withCatId} / ${totalProducts} (${((withCatId / totalProducts) * 100).toFixed(1)}%)`);

  await mongoose.disconnect();
}

run().catch(console.error);
