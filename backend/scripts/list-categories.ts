import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error("No MongoDB URI");

  await mongoose.connect(uri);
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  const cats = await Category.find({}).select('_id name slug parentId').lean();
  console.log('Total categories:', cats.length);
  cats.sort((a: any, b: any) => a.slug.localeCompare(b.slug)).forEach((c: any) => {
    console.log(`${c._id.toString()} | ${(c.slug || '').padEnd(42)} | ${(c.parentId ? c.parentId.toString() : 'ROOT').padEnd(26)} | ${c.name}`);
  });
  await mongoose.disconnect();
}

run().catch(console.error);
