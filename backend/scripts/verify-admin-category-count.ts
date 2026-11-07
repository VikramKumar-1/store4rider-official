import { getStoreNavbarCategoryTree, getUnmappedLegacyCategories } from '../../frontend/src/core/utils/navCategories';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), '../backend/.env') });
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

  const flatten = (nodes: any[], depth = 0): any[] => {
    let result: any[] = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children && node.children.length > 0) {
        result = result.concat(flatten(node.children, depth + 1));
      }
    }
    return result;
  };

  const canonicalMenuCategories = flatten(menuTree);
  const unmapped = getUnmappedLegacyCategories(tree, menuTree);

  console.log('Total Canonical Menu Categories in Admin Panel:', canonicalMenuCategories.length);
  console.log('Total Unmapped Categories in Admin Panel:', unmapped.length);
  console.log('Total Combined Categories visible to Admin:', canonicalMenuCategories.length + unmapped.length);

  // Check Full Face children in canonicalMenuCategories
  const ffChildren = canonicalMenuCategories.filter(c => c.parentId === '6ac9de6835b1b42fa90ac6d3' || c.depth >= 2 && c.linkUrl?.includes('full-face'));
  console.log('\nFull Face children in Admin canonical menu list:', ffChildren.length);
  for (const c of ffChildren.slice(0, 15)) {
    console.log(`  - [depth: ${c.depth}] ${c.name} (${c.slug})`);
  }

  process.exit(0);
}

run().catch(console.error);
