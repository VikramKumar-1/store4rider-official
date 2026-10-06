import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectToDatabase } from "../src/core/database/connection";
import { ProductModel } from "../src/modules/product/product.model";
import { CategoryModel } from "../src/modules/category/category.model";
import { BrandModel } from "../src/modules/brand/brand.model";

function generateSlug(text: string) {
  const baseSlug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // SEO URL preservation from old site
  const seoMap: Record<string, string> = {
    // Helmets
    'helmets': 'motorcycle-helmets',
    'full-face': 'full-face-helmets',
    'full-face-helmets': 'full-face-helmets',
    'modular-flip-up': 'modular-helmets',
    'open-face': 'half-face-helmets',
    'off-road-motocross': 'off-road-helmets',
    'visor': 'helmet-visors',
    'balaclava': 'balaclava',
    'bluetooth-intercom': 'bluetooth-intercoms',
    'helmet-cleaner': 'helmet-cleaners',
    
    // Riding Gear
    'riding-gear': 'riding-gear',
    'riding-jackets': 'riding-jacket',
    'riding-jacket': 'riding-jacket',
    'protector-armour': 'protectors-armour',
    'riding-jeans': 'riding-jeans',
    'touring-pants': 'touring-pants',
    'knee-guards': 'knee-guards',
    'knee-guard': 'knee-guards',
    'full-gauntlet': 'full-gauntlet-gloves',
    'semi-gauntlet': 'semi-gauntlet-gloves',
    'short-glove': 'short-motorbike-gloves',
    'short-motorbike-gloves': 'short-motorbike-gloves',
    'city-short-boots': 'short-biking-boots',
    'sports-riding-shoes': 'sports-riding-shoes',
    'off-road-riding-boots': 'off-road-riding-boots',
    'riding-gear-for-women': 'women-riding-gear',
    'off-road-motocross-gear': 'off-road-motocross',

    // Luggage
    'motorcycle-bags-bike-luggage': 'motorcycle-bags-bike-luggage',
    'tank-bags': 'tank-bags',
    'saddle-bags-bikes': 'saddle-bags-bikes',
    'motorcycle-tail-bags': 'motorcycle-tail-bags',
    'tail-bags': 'motorcycle-tail-bags',
    'top-box': 'top-box',
    'hydration-bags': 'hydration-bags',

    // Accessories
    'motorcycle-accessories': 'motorcycle-accessories-online',
    'auxiliary-light-filter': 'bike-auxiliary-lights-filters-flashers',
    'auxiliary-lights': 'auxiliary-lights',
    'clamps-and-mounts-for-lights': 'clamps-and-mounts-for-lights',
    'auxiliary-light-wiring-harness-and-switch': 'auxiliary-light-wiring-harness-and-switch',
    'off-beat-accessories': 'off-beat-accessories',
    'performance-parts': 'performance-parts',
    'rally-towers-navigation-tower': 'rally-towers-navigation-tower',
    'bike-covers': 'bike-covers',
    'chain-care': 'chain-care'
  };

  return seoMap[baseSlug] || baseSlug;
}

function capitalize(text: string) {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface CategoryNode {
  name: string;
  slug: string;
  children: Map<string, CategoryNode>;
  parentId?: string;
  _id?: string;
}

const BAD_SEGMENT_KEYWORDS = ["Root", "Default Category", "Price", "Under ", "Rs.", "₹", "Between"];

function isBadSegment(seg: string): boolean {
  return BAD_SEGMENT_KEYWORDS.some(bad => seg.includes(bad));
}

function parsePaths(magentoCategories: string | undefined): string[][] {
  if (!magentoCategories) return [];
  // Split by comma in case there are multiple paths (common in magento exports)
  const rawPaths = magentoCategories.split(',');
  
  const parsedPaths: string[][] = [];
  for (const p of rawPaths) {
    // Replace \/ with a placeholder to avoid splitting escaped slashes
    const segments = p.replace(/\\\//g, '__ESCAPED_SLASH__').split('/')
      .map(seg => seg.replace(/__ESCAPED_SLASH__/g, '/').trim())
      .filter(seg => seg.length > 0)
      .filter(seg => !isBadSegment(seg));
    
    if (segments.length > 0) {
      parsedPaths.push(segments);
    }
  }
  return parsedPaths;
}

async function runMigration() {
  console.log("Connecting to database...");
  await connectToDatabase();
  console.log("Connected.");

  const products = await ProductModel.find({});
  console.log(`Found ${products.length} products.`);

  // 1. Process Brands
  console.log("Processing Brands...");
  const uniqueBrands = new Set<string>();
  for (const p of products) {
    if (p.brand && p.brand.trim()) {
      uniqueBrands.add(p.brand.trim());
    }
  }

  const brandMap = new Map<string, string>(); // brand original name -> _id
  for (const brandName of uniqueBrands) {
    const slug = generateSlug(brandName);
    const capitalized = capitalize(brandName);
    const brandDoc = await BrandModel.findOneAndUpdate(
      { slug },
      { name: capitalized, slug },
      { upsert: true, new: true }
    );
    brandMap.set(brandName, brandDoc._id.toString());
  }
  console.log(`Upserted ${uniqueBrands.size} brands.`);

  // 2. Process Categories
  console.log("Processing Categories...");
  const rootNodes = new Map<string, CategoryNode>();
  
  for (const p of products) {
    const paths = parsePaths(p.magentoCategories);
    for (const path of paths) {
      let currentLevel = rootNodes;
      for (const seg of path) {
        if (!currentLevel.has(seg)) {
          currentLevel.set(seg, {
            name: seg,
            slug: generateSlug(seg),
            children: new Map()
          });
        }
        currentLevel = currentLevel.get(seg)!.children;
      }
    }
  }

  // BFS to upsert categories
  const categoryMap = new Map<string, string>(); // full path string -> _id
  const slugMap = new Map<string, string>(); // full path string -> slug

  async function upsertNode(node: CategoryNode, parentId: string | undefined, pathStr: string) {
    const catDoc = await CategoryModel.findOneAndUpdate(
      { slug: node.slug },
      { name: node.name, slug: node.slug, parentId },
      { upsert: true, new: true }
    );
    
    node._id = catDoc._id.toString();
    categoryMap.set(pathStr, node._id!);
    slugMap.set(pathStr, node.slug);

    for (const [childName, childNode] of node.children.entries()) {
      await upsertNode(childNode, node._id, `${pathStr}/${childName}`);
    }
  }

  for (const [name, node] of rootNodes.entries()) {
    await upsertNode(node, undefined, name);
  }
  console.log(`Upserted categories hierarchy.`);

  // 3. Update Products
  console.log("Updating Products...");
  let updatedCount = 0;
  for (const p of products) {
    let changed = false;
    
    if (p.brand && p.brand.trim()) {
      const bId = brandMap.get(p.brand.trim());
      if (bId && p.brandId !== bId) {
        p.brandId = bId;
        changed = true;
      }
    }

    const paths = parsePaths(p.magentoCategories);
    if (paths.length > 0) {
      // Find the deepest leaf node among all paths for categoryId
      let deepestPath: string[] = [];
      for (const path of paths) {
        if (path.length > deepestPath.length) {
          deepestPath = path;
        }
      }

      if (deepestPath.length > 0) {
        const fullPathStr = deepestPath.join('/');
        const cId = categoryMap.get(fullPathStr);
        if (cId && p.categoryId !== cId) {
          p.categoryId = cId;
          changed = true;
        }
      }

      // Collect all ancestor category slugs
      const allSlugs = new Set<string>();
      for (const path of paths) {
        let currentStr = "";
        for (const seg of path) {
          currentStr = currentStr ? `${currentStr}/${seg}` : seg;
          const sl = slugMap.get(currentStr);
          if (sl) allSlugs.add(sl);
        }
      }
      
      const slugArray = Array.from(allSlugs);
      // Check if arrays are different
      if (!p.categorySlugs || p.categorySlugs.length !== slugArray.length || !p.categorySlugs.every((v: string) => slugArray.includes(v))) {
        p.categorySlugs = slugArray;
        changed = true;
      }
    }

    if (changed) {
      await ProductModel.updateOne(
        { _id: p._id },
        { $set: { 
          brandId: p.brandId, 
          categoryId: p.categoryId, 
          categorySlugs: p.categorySlugs 
        }}
      );
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} products.`);
  console.log("Migration complete.");
  process.exit(0);
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
