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
  slug: string;
  parentSlug: string;
  matchKeywords: string[];
  menuGroup: string;
}

const REMAINING_CATEGORIES: ICategoryDef[] = [
  // ── 1. HELMET MODELS ──
  {
    name: "MT Targo Helmets",
    slug: "mt-targo-helmet",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Targo"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "MT Revenge 2 Helmets",
    slug: "mt-revenge-2-helmet",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Revenge 2", "Revenge 2"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "MT Rapide Helmets",
    slug: "mt-rapide-helmet",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Rapide"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "MT Hummer Helmets",
    slug: "mt-hummer-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Hummer"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "MT Mugello Helmets",
    slug: "mt-mugello-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Mugello"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "MT Blade 2 Helmets",
    slug: "mt-blade-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Blade 2", "MT Blade"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "MT Thunder 3 Helmets",
    slug: "mt-thunder3-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Thunder 3", "Thunder 3"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "MT Stinger Helmets",
    slug: "mt-stinger-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["MT Stinger"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "Axxis Draken Full Face Helmets",
    slug: "axxis-draken-full-face-helmet",
    parentSlug: "full-face-helmets",
    matchKeywords: ["Axxis Draken", "Draken"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "Axor Stealth Motorcycle Helmet",
    slug: "axor-stealth-motorcycle-helmet",
    parentSlug: "full-face-helmets",
    matchKeywords: ["Axor Stealth"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "Axor Street Helmets",
    slug: "axor-street-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["Axor Street"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "Axor Rage Helmets",
    slug: "axor-rage-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["Axor Rage"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "SMK Force Helmets",
    slug: "smk-force-helmets",
    parentSlug: "full-face-helmets",
    matchKeywords: ["SMK Force"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "Aspida Tourance Full Face Helmets",
    slug: "aspida-tourance-full-face-helmet",
    parentSlug: "full-face-helmets",
    matchKeywords: ["Aspida Tourance"],
    menuGroup: "SEO / Brand Model",
  },
  {
    name: "Aspida Discovery Modular Helmets",
    slug: "aspida-discovery-modular-helmets",
    parentSlug: "modular-helmets",
    matchKeywords: ["Aspida Discovery"],
    menuGroup: "SEO / Brand Model",
  },

  // ── 2. BIKE PROTECTION ACCESSORIES ──
  {
    name: "Frame Sliders",
    slug: "frame-sliders",
    parentSlug: "motorcycle-accessories-online",
    matchKeywords: ["Frame Sliders"],
    menuGroup: "SEO / Protection",
  },
  {
    name: "Fork Sliders",
    slug: "fork-sliders",
    parentSlug: "motorcycle-accessories-online",
    matchKeywords: ["Fork Sliders"],
    menuGroup: "SEO / Protection",
  },
  {
    name: "Engine Guards",
    slug: "engine-guard",
    parentSlug: "motorcycle-accessories-online",
    matchKeywords: ["Engine Guard", "Engine Guards"],
    menuGroup: "SEO / Protection",
  },
  {
    name: "Swingarm Spools & Sliders",
    slug: "swingarm-spools",
    parentSlug: "motorcycle-accessories-online",
    matchKeywords: ["Swingarm Spools", "spools"],
    menuGroup: "SEO / Protection",
  },
  {
    name: "Tail Tidy Kits",
    slug: "tail-tidy",
    parentSlug: "motorcycle-accessories-online",
    matchKeywords: ["Tail Tidy"],
    menuGroup: "SEO / Styling",
  },
  {
    name: "Paddocks & Motorcycle Stands",
    slug: "motorcycle-stand",
    parentSlug: "motorcycle-accessories-online",
    matchKeywords: ["Paddocks", "motorcycle-stand"],
    menuGroup: "SEO / Utility",
  },
  {
    name: "Motorcycle Seating & Cushions",
    slug: "seating",
    parentSlug: "motorcycle-accessories-online",
    matchKeywords: ["Seating", "cushion"],
    menuGroup: "SEO / Comfort",
  },

  // ── 3. OILS, LUBES & MAINTENANCE ──
  {
    name: "Engine Oils",
    slug: "engine-oils",
    parentSlug: "spares",
    matchKeywords: ["Engine Oils", "engine oil"],
    menuGroup: "SEO / Maintenance",
  },
  {
    name: "Performance Additives",
    slug: "performance-additives",
    parentSlug: "spares",
    matchKeywords: ["Performance Additives", "additive"],
    menuGroup: "SEO / Maintenance",
  },
  {
    name: "Brake Fluid",
    slug: "brake-fluid",
    parentSlug: "spares",
    matchKeywords: ["Brake Fluid"],
    menuGroup: "SEO / Maintenance",
  },
  {
    name: "Fork Oil",
    slug: "fork-oil",
    parentSlug: "spares",
    matchKeywords: ["Fork Oil"],
    menuGroup: "SEO / Maintenance",
  },
  {
    name: "Gear Oil",
    slug: "gear-oil",
    parentSlug: "spares",
    matchKeywords: ["Gear Oil"],
    menuGroup: "SEO / Maintenance",
  },

  // ── 4. GADGETS: ACTION CAMERAS ──
  {
    name: "Action Cameras",
    slug: "action-cameras",
    parentSlug: "gadgets",
    matchKeywords: ["Action Cameras", "camera"],
    menuGroup: "SEO / Gadgets",
  },
  {
    name: "Camera Accessories",
    slug: "action-camera-accessories",
    parentSlug: "gadgets",
    matchKeywords: ["Camera Accessories"],
    menuGroup: "SEO / Gadgets",
  },

  // ── 5. MERCHANDISE ──
  {
    name: "Biker Stickers Online",
    slug: "bike-stickers-online",
    parentSlug: "merchandise",
    matchKeywords: ["Bike Stickers", "stickers"],
    menuGroup: "SEO / Merchandise",
  },
  {
    name: "Metal Badges for Bikers",
    slug: "metal-badges-for-bikers",
    parentSlug: "merchandise",
    matchKeywords: ["Badges for Bikers", "metal-badges"],
    menuGroup: "SEO / Merchandise",
  },
  {
    name: "Leather Riding Jackets",
    slug: "leather-jacket",
    parentSlug: "riding-jackets",
    matchKeywords: ["Leather Jacket"],
    menuGroup: "SEO / Style",
  },
];

async function syncRemaining() {
  await connectToDatabase();
  const categoryCol = mongoose.connection.collection('categories');
  const productCol = mongoose.connection.collection('products');

  console.log('=== SYNCING REMAINING MAGENTO CATEGORIES ===');

  const allCats = await categoryCol.find({}).toArray();
  const catBySlug = new Map<string, any>();
  for (const c of allCats) {
    if (c.slug) catBySlug.set(c.slug.toLowerCase().trim(), c);
  }

  let created = 0;
  let updated = 0;

  for (const def of REMAINING_CATEGORIES) {
    // Resolve parent
    let parent = catBySlug.get(def.parentSlug.toLowerCase());
    if (!parent) {
      // Fallback aliases
      if (def.parentSlug === 'spares') parent = catBySlug.get('bike-spares');
      if (def.parentSlug === 'motorcycle-accessories-online') parent = catBySlug.get('bike-accessories');
    }

    if (!parent) {
      console.warn(`[WARN] Could not find parent "${def.parentSlug}" for "${def.name}"`);
      continue;
    }

    const parentId = String(parent._id);
    const existing = catBySlug.get(def.slug.toLowerCase()) || allCats.find(c => c.name && c.name.toLowerCase() === def.name.toLowerCase());

    if (existing) {
      await categoryCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            parentId: parentId,
            includeInMenu: false,
            menuGroup: def.menuGroup,
            updatedAt: new Date(),
          }
        }
      );
      updated++;
    } else {
      const inserted = await categoryCol.insertOne({
        name: def.name,
        slug: def.slug,
        parentId: parentId,
        includeInMenu: false,
        menuGroup: def.menuGroup,
        description: `<p>Explore our premium range of ${def.name}. Certified authentic gear, best prices, fast delivery across India.</p>`,
        metaTitle: `Buy ${def.name} Online at Best Prices | Store4Riders`,
        metaDescription: `Shop authentic ${def.name} online in India. Certified safety, fast delivery, COD & Easy EMI options available at Store4Riders.`,
        faqs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      catBySlug.set(def.slug.toLowerCase(), { _id: inserted.insertedId, ...def, parentId });
      created++;
    }
  }

  console.log(`Sync complete: ${created} created, ${updated} updated.`);

  // Backfill products
  let productsModified = 0;
  for (const def of REMAINING_CATEGORIES) {
    const regexOr = def.matchKeywords.map(kw => ({ magentoCategories: { $regex: kw, $options: 'i' } }));
    const matchingProds = await productCol.find({ $or: regexOr }).project({ _id: 1, categorySlugs: 1 }).toArray();

    if (matchingProds.length === 0) continue;

    const idsToUpdate: any[] = [];
    for (const p of matchingProds) {
      const currentSlugs = p.categorySlugs || [];
      if (!currentSlugs.includes(def.slug)) {
        idsToUpdate.push(p._id);
      }
    }

    if (idsToUpdate.length > 0) {
      await productCol.updateMany(
        { _id: { $in: idsToUpdate } },
        { $addToSet: { categorySlugs: def.slug } }
      );
      productsModified += idsToUpdate.length;
      console.log(`- Linked "${def.slug}" to ${idsToUpdate.length} products`);
    }
  }

  console.log(`\nBackfilled ${productsModified} product associations.`);
  console.log('ALL DONE!');
  process.exit(0);
}

syncRemaining().catch(console.error);
