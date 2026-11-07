import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env.local') });

import { connectToDatabase } from '../src/core/database/connection';
import mongoose from 'mongoose';

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ICategoryDef {
  name: string;
  slug?: string;
  parentSlugOrId: string; // Will resolve to Mongo ObjectId
  matchKeywords: string[]; // Used to find products with this category in magentoCategories
  menuGroup: string;
}

const ALL_SUB_CATEGORIES: ICategoryDef[] = [
  // ── 1. HELMETS ──
  // Open Face Helmets
  {
    name: "Axor Open Face Helmets",
    slug: "axor-open-face-helmets",
    parentSlugOrId: "open-face-helmets",
    matchKeywords: ["Axor Open Face"],
    menuGroup: "SEO / Model",
  },
  {
    name: "SMK Open Face Helmets",
    slug: "smk-open-face-helmets",
    parentSlugOrId: "open-face-helmets",
    matchKeywords: ["SMK Open Face"],
    menuGroup: "SEO / Model",
  },
  {
    name: "SMK GTJ Helmets",
    slug: "smk-gtj-helmets",
    parentSlugOrId: "open-face-helmets",
    matchKeywords: ["SMK GTJ"],
    menuGroup: "SEO / Model",
  },
  {
    name: "Royal Enfield Open Face Helmet",
    slug: "royal-enfield-open-face-helmet",
    parentSlugOrId: "open-face-helmets",
    matchKeywords: ["Royal Enfield Open Face"],
    menuGroup: "SEO / Model",
  },
  {
    name: "Royal Enfield 1901 MLG Helmet",
    slug: "royal-enfield-1901-mlg-helmet",
    parentSlugOrId: "open-face-helmets",
    matchKeywords: ["Royal Enfield 1901", "1901 MLG"],
    menuGroup: "SEO / Model",
  },

  // Modular Helmets
  {
    name: "SMK Gullwing Helmets",
    slug: "smk-gullwing-helmets",
    parentSlugOrId: "modular-helmets",
    matchKeywords: ["SMK Gullwing"],
    menuGroup: "SEO / Model",
  },
  {
    name: "SMK Glide Modular Helmet",
    slug: "smk-glide-modular-helmet",
    parentSlugOrId: "modular-helmets",
    matchKeywords: ["SMK Glide"],
    menuGroup: "SEO / Model",
  },
  {
    name: "Royal Enfield Flip Up Helmets",
    slug: "royal-enfield-flip-up-helmets",
    parentSlugOrId: "modular-helmets",
    matchKeywords: ["Royal Enfield Flip Up", "RE Modular"],
    menuGroup: "SEO / Model",
  },

  // Off-Road Helmets
  {
    name: "SMK Allterra Helmets",
    slug: "smk-allterra-helmets",
    parentSlugOrId: "off-road-helmets",
    matchKeywords: ["SMK Allterra"],
    menuGroup: "SEO / Model",
  },
  {
    name: "Axor X-Cross Off Road & Motocross Helmets",
    slug: "axor-x-cross-off-road-motocross-helmets",
    parentSlugOrId: "off-road-helmets",
    matchKeywords: ["Axor X-Cross"],
    menuGroup: "SEO / Model",
  },
  {
    name: "SMK Hybrid Evo Helmet",
    slug: "smk-hybrid-evo-helmet",
    parentSlugOrId: "off-road-helmets",
    matchKeywords: ["SMK Hybrid Evo"],
    menuGroup: "SEO / Model",
  },

  // Helmet Accessories
  {
    name: "Pinlock Visor Inserts",
    slug: "pinlock-visor-inserts",
    parentSlugOrId: "helmet-accessories",
    matchKeywords: ["pinlock", "Pin-lock"],
    menuGroup: "SEO / Feature",
  },
  {
    name: "Helmet Cleaners & Care",
    slug: "helmet-cleaners-care",
    parentSlugOrId: "helmet-accessories",
    matchKeywords: ["Helmet Cleaners", "cleaner"],
    menuGroup: "SEO / Care",
  },

  // ── 2. RIDING JACKETS ──
  {
    name: "Bike Riding Jackets Below Rs.6000",
    slug: "bike-riding-jackets-below-rs-6000",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["Jackets Below Rs.6000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Motorcycle Riding Jackets Between Rs.6000-8000",
    slug: "riding-jackets-between-rs-6000-8000",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["Jackets Between Rs.6000-8000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Bike Jackets Between Rs.8000-10000",
    slug: "bike-jackets-between-rs-8000-10000",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["Jackets Between Rs.8000-10000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Best Riding Jackets Between Rs.10000-20000",
    slug: "riding-jackets-between-rs-10000-20000",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["Jackets Between Rs.10000-20000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Premium Mesh & Textile Riding Jackets",
    slug: "premium-mesh-textile-riding-jackets",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["Premium Mesh/Textile", "Premium Mesh"],
    menuGroup: "SEO / Feature",
  },
  {
    name: "Touring Riding Jackets",
    slug: "touring-jackets",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["Touring Jackets"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Rynox Riding Jackets",
    slug: "rynox-riding-jackets",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["Rynox Riding Jacket"],
    menuGroup: "SEO / Brand",
  },
  {
    name: "LS2 Riding Jackets",
    slug: "ls2-riding-jackets",
    parentSlugOrId: "riding-jackets",
    matchKeywords: ["LS2 Riding Jackets"],
    menuGroup: "SEO / Brand",
  },

  // ── 3. RIDING PANTS ──
  {
    name: "Riding Pants Below Rs.7000",
    slug: "riding-pants-below-rs-7000",
    parentSlugOrId: "riding-pants",
    matchKeywords: ["Riding Pants below Rs.7000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Riding Pants Between Rs.7000-15000",
    slug: "riding-pants-between-rs-7000-15000",
    parentSlugOrId: "riding-pants",
    matchKeywords: ["Riding Pants between Rs.7000-15000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Premium Riding Pants",
    slug: "premium-riding-pants",
    parentSlugOrId: "riding-pants",
    matchKeywords: ["Premium Riding Pants"],
    menuGroup: "SEO / Feature",
  },
  {
    name: "Touring Pants",
    slug: "touring-pants-bikers",
    parentSlugOrId: "riding-pants",
    matchKeywords: ["Touring Pants"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Sports Riding Pants",
    slug: "sports-pants",
    parentSlugOrId: "riding-pants",
    matchKeywords: ["Sports Pants"],
    menuGroup: "SEO / Style",
  },

  // ── 4. RIDING BOOTS ──
  {
    name: "Riding Boots Below Rs.8000",
    slug: "riding-boots-below-rs-8000",
    parentSlugOrId: "motorcycle-riding-boots",
    matchKeywords: ["Riding Boots below Rs.8000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Riding Boots Between Rs.8000-13000",
    slug: "riding-boots-between-rs-8000-13000",
    parentSlugOrId: "motorcycle-riding-boots",
    matchKeywords: ["Riding Boots between Rs.8000-13000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Premium Riding Boots",
    slug: "premium-riding-boots-biking",
    parentSlugOrId: "motorcycle-riding-boots",
    matchKeywords: ["Premium Riding Boots"],
    menuGroup: "SEO / Feature",
  },
  {
    name: "Adventure & Off-Road Riding Boots",
    slug: "adventure-off-road-riding-boots",
    parentSlugOrId: "motorcycle-riding-boots",
    matchKeywords: ["Adventure & Off-Road Riding Boots"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Touring Boots",
    slug: "touring-boots-motorcycle",
    parentSlugOrId: "motorcycle-riding-boots",
    matchKeywords: ["Touring Boots"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Short City Riding Boots & Shoes",
    slug: "short-riding-boots-city-shoes",
    parentSlugOrId: "motorcycle-riding-boots",
    matchKeywords: ["Short Riding Boots & City Riding Shoes"],
    menuGroup: "SEO / Style",
  },

  // ── 5. RIDING GLOVES ──
  // Short Cuff
  {
    name: "Bike Gloves Below Rs.3000",
    slug: "bike-gloves-below-rs-3000",
    parentSlugOrId: "short-motorbike-gloves",
    matchKeywords: ["Bike Gloves below Rs.3000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Short Biker Gloves Between Rs.3000-4000",
    slug: "short-biker-gloves-between-rs-3000-4000",
    parentSlugOrId: "short-motorbike-gloves",
    matchKeywords: ["Short Biker Gloves between Rs.3000-4000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Short Biking Gloves Between Rs.4000-5000",
    slug: "short-biking-gloves-between-rs-4000-5000",
    parentSlugOrId: "short-motorbike-gloves",
    matchKeywords: ["Short Biking Gloves Between Rs.4000-5000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Premium Short Gloves",
    slug: "premium-short-gloves",
    parentSlugOrId: "short-motorbike-gloves",
    matchKeywords: ["Premium Short Gloves"],
    menuGroup: "SEO / Feature",
  },

  // Full Gauntlet
  {
    name: "Full Gauntlet Riding Gloves Below Rs.3000",
    slug: "full-gauntlet-gloves-below-rs-3000",
    parentSlugOrId: "full-gauntlet-gloves",
    matchKeywords: ["Full Gauntlet Riding Gloves Below Rs.3000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Full Gauntlet Riding Gloves Between Rs.3000-4000",
    slug: "full-gauntlet-gloves-between-rs-3000-4000",
    parentSlugOrId: "full-gauntlet-gloves",
    matchKeywords: ["Full Gauntlet  Riding Gloves Between Rs.3000-4000", "Full Gauntlet Riding Gloves Between Rs.3000-4000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Full Gauntlet Riding Gloves Between Rs.4000-5000",
    slug: "full-gauntlet-gloves-between-rs-4000-5000",
    parentSlugOrId: "full-gauntlet-gloves",
    matchKeywords: ["Full Gauntlet Riding Gloves Between Rs.4000-5000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Full Gauntlet Riding Gloves Between Rs.5000-8000",
    slug: "full-gauntlet-gloves-between-rs-5000-8000",
    parentSlugOrId: "full-gauntlet-gloves",
    matchKeywords: ["Full Gauntlet riding gloves Between Rs.5000-8000", "Between Rs.5000-8000"],
    menuGroup: "SEO / Price",
  },
  {
    name: "Premium Full Gauntlet Gloves",
    slug: "premium-full-gauntlet-gloves",
    parentSlugOrId: "full-gauntlet-gloves",
    matchKeywords: ["Premium Full Gauntlet Riding Gloves"],
    menuGroup: "SEO / Feature",
  },

  // Other Glove Ranges
  {
    name: "Touring Riding Gloves",
    slug: "touring-gloves",
    parentSlugOrId: "riding-gloves",
    matchKeywords: ["Touring Gloves"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Rynox Riding Gloves",
    slug: "rynox-gloves",
    parentSlugOrId: "riding-gloves",
    matchKeywords: ["Rynox Gloves"],
    menuGroup: "SEO / Brand",
  },
  {
    name: "LS2 Riding Gloves",
    slug: "ls2-riding-gloves",
    parentSlugOrId: "riding-gloves",
    matchKeywords: ["LS2 Riding Gloves"],
    menuGroup: "SEO / Brand",
  },
  {
    name: "Motorcycle Base Layers",
    slug: "motorcycle-base-layers",
    parentSlugOrId: "riding-gear",
    matchKeywords: ["Motorcycle Base Layers"],
    menuGroup: "SEO / Feature",
  },

  // ── 6. LUGGAGE ──
  {
    name: "Rynox Saddle Bags",
    slug: "rynox-saddle-bags",
    parentSlugOrId: "saddle-bags-bikes",
    matchKeywords: ["Rynox Saddle bags"],
    menuGroup: "SEO / Brand",
  },
  {
    name: "Rynox Tail Bags",
    slug: "rynox-tail-bags",
    parentSlugOrId: "motorcycle-tail-bags",
    matchKeywords: ["Rynox Tail bags"],
    menuGroup: "SEO / Brand",
  },
  {
    name: "Rynox Tank Bags",
    slug: "rynox-tank-bags",
    parentSlugOrId: "tank-bags-bikes",
    matchKeywords: ["Rynox Tank Bags"],
    menuGroup: "SEO / Brand",
  },
  {
    name: "Crash Bar Bags for Motorcycles",
    slug: "crash-bar-bags",
    parentSlugOrId: "motorcycle-bags-bike-luggage",
    matchKeywords: ["Crash Bar Bags"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Bike Top Boxes & Aluminium Top Case",
    slug: "bike-top-box-cases",
    parentSlugOrId: "motorcycle-bags-bike-luggage",
    matchKeywords: ["Bike Top Boxes", "top box"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Thigh Bags for Motorcycle Riders",
    slug: "thigh-bags-motorcycle",
    parentSlugOrId: "motorcycle-bags-bike-luggage",
    matchKeywords: ["Thigh Bags"],
    menuGroup: "SEO / Style",
  },
  {
    name: "Helmet Bags for Bike Riders",
    slug: "helmet-bags",
    parentSlugOrId: "motorcycle-bags-bike-luggage",
    matchKeywords: ["Helmet Bags"],
    menuGroup: "SEO / Style",
  },

  // ── 7. ACCESSORIES ──
  {
    name: "Paddocks & Bike Stands",
    slug: "paddocks-bike-stands",
    parentSlugOrId: "motorcycle-accessories-online",
    matchKeywords: ["Paddocks"],
    menuGroup: "SEO / Utility",
  },
  {
    name: "Radiator Guards",
    slug: "radiator-guards",
    parentSlugOrId: "motorcycle-accessories-online",
    matchKeywords: ["Radiator Guard"],
    menuGroup: "SEO / Protection",
  },
  {
    name: "Royal Enfield Himalayan Accessories",
    slug: "re-himalayan-accessories",
    parentSlugOrId: "motorcycle-accessories-online",
    matchKeywords: ["Himalayan Accessories"],
    menuGroup: "SEO / Model",
  },

  // ── 8. MERCHANDISE ──
  {
    name: "Bandana / Buff / Face Covering",
    slug: "bandana-buff-face-covering",
    parentSlugOrId: "merchandise",
    matchKeywords: ["Bandana", "Buff"],
    menuGroup: "SEO / Merchandise",
  },
  {
    name: "Keychains for Bikers",
    slug: "keychains-for-bike",
    parentSlugOrId: "merchandise",
    matchKeywords: ["KeyChains for Bike"],
    menuGroup: "SEO / Merchandise",
  },
  {
    name: "Biker Hoodies",
    slug: "biker-hoodies",
    parentSlugOrId: "merchandise",
    matchKeywords: ["Biker Hoodies"],
    menuGroup: "SEO / Merchandise",
  },
];

async function syncAllCategories() {
  await connectToDatabase();
  const categoryCol = mongoose.connection.collection('categories');
  const productCol = mongoose.connection.collection('products');

  console.log('=== SYNCING ALL MAGENTO SUB-CATEGORIES TO MONGODB ===');

  // Load all categories into cache
  const allExistingCats = await categoryCol.find({}).toArray();
  const catBySlug = new Map<string, any>();
  const catById = new Map<string, any>();

  for (const c of allExistingCats) {
    if (c.slug) catBySlug.set(c.slug.toLowerCase().trim(), c);
    catById.set(String(c._id), c);
  }

  console.log(`Found ${allExistingCats.length} existing categories in DB.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const def of ALL_SUB_CATEGORIES) {
    // 1. Resolve Parent ObjectId
    let parentDoc = catBySlug.get(def.parentSlugOrId.toLowerCase()) || catById.get(def.parentSlugOrId);
    if (!parentDoc) {
      // Try search by name or slug regex
      const found = allExistingCats.find(c => 
        (c.slug && c.slug.includes(def.parentSlugOrId)) ||
        (c.name && c.name.toLowerCase().includes(def.parentSlugOrId.replace(/-/g, ' ')))
      );
      if (found) parentDoc = found;
    }

    if (!parentDoc) {
      console.warn(`[WARN] Could not find parent for "${def.name}" (target parent: "${def.parentSlugOrId}")`);
      continue;
    }

    const parentId = String(parentDoc._id);
    const targetSlug = def.slug || toSlug(def.name);

    // 2. Check if category exists
    let existingDoc = catBySlug.get(targetSlug) || allExistingCats.find(c => c.name && c.name.toLowerCase() === def.name.toLowerCase());

    if (existingDoc) {
      await categoryCol.updateOne(
        { _id: existingDoc._id },
        {
          $set: {
            parentId: parentId,
            includeInMenu: false, // Keep storefront menu clean, show in Admin
            menuGroup: def.menuGroup,
            updatedAt: new Date(),
          }
        }
      );
      catById.set(String(existingDoc._id), { ...existingDoc, parentId, includeInMenu: false, menuGroup: def.menuGroup });
      updatedCount++;
    } else {
      const inserted = await categoryCol.insertOne({
        name: def.name,
        slug: targetSlug,
        parentId: parentId,
        includeInMenu: false,
        menuGroup: def.menuGroup,
        description: `<p>Explore our premium collection of ${def.name}. Top certified safety, durability, and comfort for motorcyclists.</p>`,
        metaTitle: `Buy ${def.name} Online at Best Prices | Store4Riders`,
        metaDescription: `Shop authentic ${def.name} online in India. Certified safety, fast delivery, COD & Easy EMI options available at Store4Riders.`,
        faqs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      catBySlug.set(targetSlug, { _id: inserted.insertedId, name: def.name, slug: targetSlug, parentId });
      catById.set(String(inserted.insertedId), { _id: inserted.insertedId, name: def.name, slug: targetSlug, parentId });
      createdCount++;
    }
  }

  console.log(`\nCategory Sync Complete: ${createdCount} created, ${updatedCount} updated.\n`);

  // 3. Backfill matching products with categorySlugs
  console.log('=== BACKFILLING PRODUCTS categorySlugs ===');
  let productsModified = 0;

  for (const def of ALL_SUB_CATEGORIES) {
    const slug = def.slug || toSlug(def.name);
    const regexOr = def.matchKeywords.map(kw => ({ magentoCategories: { $regex: kw, $options: 'i' } }));

    const matchingProds = await productCol.find({
      $or: regexOr
    }).project({ _id: 1, categorySlugs: 1 }).toArray();

    if (matchingProds.length === 0) continue;

    const idsToUpdate: any[] = [];
    for (const p of matchingProds) {
      const currentSlugs = p.categorySlugs || [];
      if (!currentSlugs.includes(slug)) {
        idsToUpdate.push(p._id);
      }
    }

    if (idsToUpdate.length > 0) {
      await productCol.updateMany(
        { _id: { $in: idsToUpdate } },
        { $addToSet: { categorySlugs: slug } }
      );
      productsModified += idsToUpdate.length;
      console.log(`- Linked "${slug}" to ${idsToUpdate.length} products (matching keywords: ${def.matchKeywords.join(', ')})`);
    }
  }

  console.log(`\nSuccessfully backfilled categorySlugs on ${productsModified} product associations!`);
  console.log('ALL DONE!');
  process.exit(0);
}

syncAllCategories().catch(console.error);
