import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { getStoreNavbarCategoryTree } from '../../frontend/src/core/utils/navCategories';

dotenv.config({ path: path.resolve(process.cwd(), '../backend/.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

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
  const menuTree = getStoreNavbarCategoryTree(tree);

  console.log('menuTree top items count:', menuTree.length);
  const helmetNode = menuTree.find(n => n.slug === 'motorcycle-helmets' || n.id === 'helmets');
  console.log('Helmets menu node:', helmetNode ? helmetNode.name : 'NOT FOUND');

  if (helmetNode) {
    console.log('Helmets direct subcategories count:', helmetNode.children.length);
    for (const sub of helmetNode.children) {
      console.log(`  - [${sub.slug}] "${sub.name}" | children count: ${sub.children ? sub.children.length : 0}`);
      if (sub.slug === 'full-face-helmets') {
        for (const child of sub.children || []) {
          console.log(`      * [${child.slug}] "${child.name}"`);
        }
      }
    }
  }

  process.exit(0);
}

run().catch(console.error);
