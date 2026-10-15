import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const misclassified = await db.collection('products').find({
    categorySlugs: { $in: ['knee-guards-for-bikers', 'knee-guards', 'knee-guard', 'knee-guards-bikers'] },
    name: { $regex: /\b(hip|back|chest|tailbone)\b/i }
  }).toArray();
  
  console.log('Misclassified knee guards count:', misclassified.length);
  for (const p of misclassified) {
    console.log(p.sku, p.name, p.categorySlugs);
  }
  process.exit(0);
}
run().catch(console.error);
