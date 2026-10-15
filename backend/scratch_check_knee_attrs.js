import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const kneeProducts = await db.collection('products').find({
    categorySlugs: { $in: ['knee-guards-for-bikers', 'knee-guards', 'knee-guard', 'knee-guards-bikers'] },
    name: { $not: /\b(hip|elbow|shoulder|back|chest|tailbone)\b/i }
  }).toArray();
  
  console.log('Knee products count:', kneeProducts.length);
  const sizes = new Set();
  const colors = new Set();
  for (const p of kneeProducts) {
    if (p.size) sizes.add(p.size);
    if (p.attributes?.size) sizes.add(p.attributes.size);
    if (p.variants) {
      for (const v of p.variants) {
        if (v.attributes?.size) sizes.add(v.attributes.size);
      }
    }
    if (p.color) colors.add(p.color);
    if (p.attributes?.color) colors.add(p.attributes.color);
  }
  console.log('Sizes found on knee products:', Array.from(sizes));
  console.log('Colors found on knee products:', Array.from(colors));
  process.exit(0);
}
run().catch(console.error);
