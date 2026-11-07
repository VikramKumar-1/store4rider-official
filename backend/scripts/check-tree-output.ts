import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const Category = mongoose.connection.collection('categories');
  const allCats = await Category.find({}).toArray();

  const idMap = new Map();
  allCats.forEach(c => idMap.set(String(c._id), c));

  const buildTree = (pId?: string) => {
    return allCats
      .filter(c => {
        const itemPid = c.parentId ? String(c.parentId) : undefined;
        return itemPid === pId;
      })
      .map(c => ({
        ...c,
        children: buildTree(String(c._id))
      }));
  };

  const tree = buildTree(undefined);
  const helmet = tree.find(c => c.slug === 'motorcycle-helmets' || c.slug === 'helmets');
  console.log('Helmets in tree:', helmet ? helmet.name : 'NOT FOUND');
  if (helmet) {
    console.log('Helmets direct children count:', helmet.children.length);
    for (const ch of helmet.children) {
      console.log('  -', ch.name, `(${ch.slug})`, 'children count:', ch.children.length);
      if (ch.slug === 'full-face-helmets') {
        for (const ffc of ch.children) {
          console.log('      * ', ffc.name, `(${ffc.slug})`);
        }
      }
    }
  }

  process.exit(0);
}

run().catch(console.error);
