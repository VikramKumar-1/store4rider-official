import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkSpecific() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const Category = mongoose.connection.collection('categories');

  const terms = ['apex', 'agera', 'agnar', 'nova', 'ff800', 'ff320', 'stream', 'premium'];
  for (const t of terms) {
    const list = await Category.find({
      $or: [
        { name: { $regex: t, $options: 'i' } },
        { slug: { $regex: t, $options: 'i' } }
      ]
    }).toArray();
    console.log(`\nMatches for "${t}" (count: ${list.length}):`);
    for (const c of list) {
      console.log(`  - name: "${c.name}", slug: "${c.slug}", parentId: ${c.parentId}, isActive: ${c.isActive}`);
    }
  }

  process.exit(0);
}

checkSpecific().catch(console.error);
