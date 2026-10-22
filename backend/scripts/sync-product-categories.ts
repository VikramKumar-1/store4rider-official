/**
 * @file sync-product-categories.ts
 * @description Safe, Non-Destructive Category Sync Script for Store4Riders.
 * 
 * Strict Rules:
 * 1. NEVER modifies or changes the Navbar URLs (Rule #17).
 * 2. Maps ALL products (both Magento CSV-imported and subsequent imports) 
 *    directly to the EXACT canonical slugs defined in `nav.constants.ts`.
 * 3. Links `product.categoryId` to the actual `Category._id` in MongoDB.
 * 4. Runs in --dry-run by default (ZERO database writes).
 * 5. Only writes to MongoDB when --apply flag is explicitly passed.
 * 
 * Usage:
 *   Dry-run (safe): npx tsx backend/scripts/sync-product-categories.ts
 *   Apply writes:   npx tsx backend/scripts/sync-product-categories.ts --apply
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// ──────────────────────────────────────────────────────────────
// CLIENT NAVBAR CANONICAL SLUGS (Source of Truth: nav.constants.ts)
// All products MUST map to these exact slugs.
// ──────────────────────────────────────────────────────────────
const NAVBAR_CANONICAL_SLUGS = new Set([
  // Helmets
  "motorcycle-helmets",
  "full-face-helmets",
  "modular-helmets",
  "off-road-helmets",
  "open-face-helmets",
  "helmet-accessories",
  "balaclava",
  "bluetooth-intercoms",
  "helmet-cleaners",

  // Riding Jackets
  "riding-gear",
  "riding-jackets",
  "protectors-armour",

  // Riding Pants
  "riding-pants",
  "motorcycle-riding-jeans",
  "touring-pants",
  "knee-guards-bikers",

  // Riding Gloves
  "riding-gloves",
  "full-gauntlet-gloves",
  "semi-gauntlet-gloves",
  "short-motorbike-gloves",

  // Riding Boots
  "motorcycle-riding-boots",
  "short-biking-boots",
  "sports-riding-shoes",
  "off-road-riding-boots",

  // Specialized Gear
  "riding-gear-for-women",
  "off-road-motocross-riding-gear",

  // Luggage
  "motorcycle-bags-bike-luggage",
  "tank-bags-bikes",
  "saddle-bags-bikes",
  "motorcycle-tail-bags",
  "bike-top-box",
  "hydration-bag",
  "motorcycle-other-luggage",

  // Accessories
  "motorcycle-accessories-online",
  "bike-auxiliary-lights-filters-flashers",
  "bike-auxiliary-lights",
  "auxiliary-light-filters",
  "bike-auxiliary-light-clamps-mounts",
  "auxiliary-light-wiring-harness-switch",
  "off-beat-motorcycle-accessories",
  "performance-parts",
  "rally-tower",
  "bike-covers",
  "chain-care",
  "bike-phone-holders",

  // Spares
  "spares",
  "chain-sprocket-kits",
  "iridium-spark-plugs",
  "performance-air-filters",
  "brake-pads",
]);

// ──────────────────────────────────────────────────────────────
// MAPPING: Legacy Slugs & Magento CSV Paths -> Canonical Navbar Slug
// ──────────────────────────────────────────────────────────────
const SLUG_TO_CANONICAL: Record<string, string> = {
  // Helmets
  "full-face-helmet": "full-face-helmets",
  "full-face-helmets": "full-face-helmets",
  "premium-full-face-helmets": "full-face-helmets",
  "modular-helmets": "modular-helmets",
  "modular-helmet": "modular-helmets",
  "modular-helmets-flip-up-helmets": "modular-helmets",
  "modular-flip-up": "modular-helmets",
  "off-road-helmets": "off-road-helmets",
  "off-road-helmet": "off-road-helmets",
  "off-road-helmets-motocross-helmet": "off-road-helmets",
  "motocross-helmet": "off-road-helmets",
  "open-face-helmets": "open-face-helmets",
  "open-face-helmet": "open-face-helmets",
  "half-face-helmets": "open-face-helmets",
  "half-face-helmet": "open-face-helmets",
  "helmet-accessories": "helmet-accessories",
  "helmet-accessories-helmet-visors": "helmet-accessories",
  "helmet-visors": "helmet-accessories",
  "balaclava": "balaclava",
  "bluetooth-intercoms": "bluetooth-intercoms",
  "communicators": "bluetooth-intercoms",
  "helmet-cleaners": "helmet-cleaners",
  "helmet-cleaner": "helmet-cleaners",

  // Jackets
  "riding-jackets": "riding-jackets",
  "riding-jacket": "riding-jackets",
  "riding-jackets-bike-jackets": "riding-jackets",
  "riding-jackets-bike-jacket": "riding-jackets",
  "riding-jackets-motorcycle-jackets": "riding-jackets",
  "motorcycle-jackets": "riding-jackets",
  "motorcycle-jacket": "riding-jackets",
  "rynox-riding-jacket": "riding-jackets",
  "protectors-armour": "protectors-armour",
  "protectors": "protectors-armour",
  "racing-suits": "racing-suits",
  "racing-suit": "racing-suits",

  // Pants & Jeans
  "riding-pants": "riding-pants",
  "riding-pant": "riding-pants",
  "riding-jeans": "motorcycle-riding-jeans",
  "riding-jean": "motorcycle-riding-jeans",
  "motorcycle-riding-jeans": "motorcycle-riding-jeans",
  "touring-pants": "touring-pants",
  "touring-pant": "touring-pants",
  "knee-guards-for-bikers": "knee-guards-bikers",
  "knee-guards-bikers": "knee-guards-bikers",
  "knee-guards": "knee-guards-bikers",
  "knee-guard": "knee-guards-bikers",

  // Gloves
  "riding-gloves": "riding-gloves",
  "riding-glove": "riding-gloves",
  "riding-gloves-biker-gloves": "riding-gloves",
  "riding-gloves-biker-glove": "riding-gloves",
  "motorcycle-riding-gloves": "riding-gloves",
  "motorcycle-riding-glove": "riding-gloves",
  "full-gauntlet-gloves": "full-gauntlet-gloves",
  "full-gauntlet-glove": "full-gauntlet-gloves",
  "premium-full-gauntlet-riding-gloves": "full-gauntlet-gloves",
  "semi-gauntlet-gloves": "semi-gauntlet-gloves",
  "semi-gauntlet-glove": "semi-gauntlet-gloves",
  "semi-gauntlet-bike-riding-gloves": "semi-gauntlet-gloves",
  "short-motorbike-gloves": "short-motorbike-gloves",
  "short-cuff-biker-gloves": "short-motorbike-gloves",
  "short-cuff-biker-glove": "short-motorbike-gloves",

  // Boots
  "motorcycle-riding-boots": "motorcycle-riding-boots",
  "motorcycle-riding-boot": "motorcycle-riding-boots",
  "premium-riding-boots": "motorcycle-riding-boots",
  "short-biking-boots": "short-biking-boots",
  "short-biking-boot": "short-biking-boots",
  "short-city-riding-biking-boots": "short-biking-boots",
  "sports-riding-shoes": "sports-riding-shoes",
  "sports-riding-shoe": "sports-riding-shoes",
  "sport-riding-shoes": "sports-riding-shoes",
  "off-road-riding-boots": "off-road-riding-boots",
  "off-road-boots": "off-road-riding-boots",
  "off-road-riding-boots-motocross-boots": "off-road-riding-boots",

  // Specialized
  "women-riding-gear": "riding-gear-for-women",
  "riding-gear-for-women": "riding-gear-for-women",
  "off-road-motocross-riding-gear": "off-road-motocross-riding-gear",
  "off-road-motocross": "off-road-motocross-riding-gear",

  // Luggage
  "tank-bags-bikes": "tank-bags-bikes",
  "tank-bags": "tank-bags-bikes",
  "tank-bags-for-bike": "tank-bags-bikes",
  "rynox-tank-bags": "tank-bags-bikes",
  "saddle-bags-bikes": "saddle-bags-bikes",
  "saddle-bags": "saddle-bags-bikes",
  "saddle-bags-for-bikes-panniers": "saddle-bags-bikes",
  "saddle-bags-for-bikes": "saddle-bags-bikes",
  "rynox-saddle-bags": "saddle-bags-bikes",
  "motorcycle-tail-bags": "motorcycle-tail-bags",
  "tail-bags": "motorcycle-tail-bags",
  "tail-bag": "motorcycle-tail-bags",
  "rynox-tail-bags": "motorcycle-tail-bags",
  "bike-top-box": "bike-top-box",
  "top-box": "bike-top-box",
  "top-boxes": "bike-top-box",
  "hydration-bag": "hydration-bag",
  "hydration-bags": "hydration-bag",
  "other-luggage": "motorcycle-other-luggage",
  "motorcycle-other-luggage": "motorcycle-other-luggage",

  // Accessories
  "motorcycle-accessories-online": "motorcycle-accessories-online",
  "motorcycle-accessories-bike-accessories": "motorcycle-accessories-online",
  "bike-accessories": "motorcycle-accessories-online",
  "motorcycle-accessories-onlines": "motorcycle-accessories-online",
  "bike-auxiliary-lights-filters-flashers": "bike-auxiliary-lights-filters-flashers",
  "bike-auxiliary-lights": "bike-auxiliary-lights",
  "auxiliary-lights": "bike-auxiliary-lights",
  "auxiliary-light-filters": "auxiliary-light-filters",
  "auxiliary-light-filter": "auxiliary-light-filters",
  "bike-auxiliary-light-clamps-mounts": "bike-auxiliary-light-clamps-mounts",
  "bike-auxiliary-light-clamps-and-mounts": "bike-auxiliary-light-clamps-mounts",
  "clamps-and-mounts-for-lights": "bike-auxiliary-light-clamps-mounts",
  "auxiliary-light-wiring-harness-switch": "auxiliary-light-wiring-harness-switch",
  "auxiliary-light-wiring-harness-and-switch": "auxiliary-light-wiring-harness-switch",
  "off-beat-motorcycle-accessories": "off-beat-motorcycle-accessories",
  "off-beat-accessories": "off-beat-motorcycle-accessories",
  "off-beat-bike-accessories-online": "off-beat-motorcycle-accessories",
  "performance-parts": "performance-parts",
  "performance-part": "performance-parts",
  "bike-exhausts": "performance-parts",
  "bike-exhaust": "performance-parts",
  "rally-tower": "rally-tower",
  "bike-covers": "bike-covers",
  "bike-cover": "bike-covers",
  "chain-care": "chain-care",
  "motorcycle-care": "chain-care",
  "bike-phone-holders": "bike-phone-holders",
  "bike-phone-holders-mobile-holder-for-bike": "bike-phone-holders",
  "gadgets": "bike-phone-holders",
  "gadget": "bike-phone-holders",
  "smk-twister-helmet": "full-face-helmets",
  "smk-twister-helmets": "full-face-helmets",
  "smk-stellar-helmet": "full-face-helmets",
  "smk-stellar-helmets": "full-face-helmets",
  "smk-glide-modular-helmet": "modular-helmets",
  "smk-hybrid-evo-helmet": "off-road-helmets",
  "biker-t-shirts-motorcycle-t-shirts": "motorcycle-accessories-online",
  "biker-t-shirts-motorcycle-t-shirt": "motorcycle-accessories-online",

  // Spares
  "spares": "spares",
  "spare": "spares",
  "bike-spares": "spares",
  "bike-spare-parts-online": "spares",
  "chain-sprocket-kits": "chain-sprocket-kits",
  "iridium-spark-plugs": "iridium-spark-plugs",
  "iridium-spark-plug": "iridium-spark-plugs",
  "performance-air-filters": "performance-air-filters",
  "performance-air-filters-for-bikes": "performance-air-filters",
  "performance-air-filter-bike": "performance-air-filters",
  "brake-pads": "brake-pads",
  "brake-pad": "brake-pads",

  // Top-level groups
  "motorcycle-helmets": "motorcycle-helmets",
  "motorcycle-helmet": "motorcycle-helmets",
  "motorcycle-bags-bike-luggage": "motorcycle-bags-bike-luggage",
  "riding-gear": "riding-gear",
  "riding-gears": "riding-gear",
};

// ──────────────────────────────────────────────────────────────
// Parent slug mapping for each leaf slug
// ──────────────────────────────────────────────────────────────
const LEAF_TO_PARENT: Record<string, string> = {
  // Helmets
  "full-face-helmets": "motorcycle-helmets",
  "modular-helmets": "motorcycle-helmets",
  "off-road-helmets": "motorcycle-helmets",
  "open-face-helmets": "motorcycle-helmets",
  "helmet-accessories": "motorcycle-helmets",
  "balaclava": "motorcycle-helmets",
  "bluetooth-intercoms": "motorcycle-helmets",
  "helmet-cleaners": "motorcycle-helmets",

  // Riding Gear
  "riding-jackets": "riding-gear",
  "protectors-armour": "riding-gear",
  "riding-pants": "riding-gear",
  "motorcycle-riding-jeans": "riding-gear",
  "touring-pants": "riding-gear",
  "knee-guards-bikers": "riding-gear",
  "riding-gloves": "riding-gear",
  "full-gauntlet-gloves": "riding-gear",
  "semi-gauntlet-gloves": "riding-gear",
  "short-motorbike-gloves": "riding-gear",
  "motorcycle-riding-boots": "riding-gear",
  "short-biking-boots": "riding-gear",
  "sports-riding-shoes": "riding-gear",
  "off-road-riding-boots": "riding-gear",
  "off-road-motocross-riding-gear": "riding-gear",

  // Luggage
  "tank-bags-bikes": "motorcycle-bags-bike-luggage",
  "saddle-bags-bikes": "motorcycle-bags-bike-luggage",
  "motorcycle-tail-bags": "motorcycle-bags-bike-luggage",
  "bike-top-box": "motorcycle-bags-bike-luggage",
  "hydration-bag": "motorcycle-bags-bike-luggage",
  "motorcycle-other-luggage": "motorcycle-bags-bike-luggage",

  // Accessories
  "bike-auxiliary-lights-filters-flashers": "motorcycle-accessories-online",
  "bike-auxiliary-lights": "motorcycle-accessories-online",
  "auxiliary-light-filters": "motorcycle-accessories-online",
  "bike-auxiliary-light-clamps-mounts": "motorcycle-accessories-online",
  "auxiliary-light-wiring-harness-switch": "motorcycle-accessories-online",
  "off-beat-motorcycle-accessories": "motorcycle-accessories-online",
  "performance-parts": "motorcycle-accessories-online",
  "rally-tower": "motorcycle-accessories-online",
  "bike-covers": "motorcycle-accessories-online",
  "chain-care": "motorcycle-accessories-online",
  "bike-phone-holders": "motorcycle-accessories-online",

  // Spares
  "chain-sprocket-kits": "spares",
  "iridium-spark-plugs": "spares",
  "performance-air-filters": "spares",
  "brake-pads": "spares",
};

async function syncCategories() {
  const isApply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error("No MongoDB URI found in environment");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log(`Connected. Mode: ${isApply ? '🔥 APPLY (WRITING TO DB)' : '🛡️ DRY-RUN (READ-ONLY)'}\n`);

  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  // Load all categories for slug -> ObjectId lookup
  const categories = await Category.find({}).select('_id slug name').lean();
  const slugToCatDoc = new Map<string, any>();
  for (const c of categories as any[]) {
    if (c.slug) slugToCatDoc.set(c.slug, c);
  }

  const products = await Product.find({})
    .select('_id name sku magentoCategories categorySlugs categoryId')
    .lean();

  console.log(`Total products to evaluate: ${products.length}`);

  let updatedCount = 0;
  let skippedCount = 0;
  let alreadyCleanCount = 0;

  const sampleUpdates: any[] = [];
  const skippedProducts: any[] = [];
  const backupRecords: any[] = [];
  const bulkOps: any[] = [];

  for (const p of products as any[]) {
    const existingSlugs: string[] = p.categorySlugs || [];
    const canonicalSlugsSet = new Set<string>();

    // 1. From existing categorySlugs, map any legacy slug to canonical navbar slug
    for (const slug of existingSlugs) {
      if (slug.includes('/') || slug.includes('\\')) {
        // Handle unparsed Magento paths inside categorySlugs array
        const preserved = slug.replace(/\\\//g, '##SLASH##');
        const segments = preserved.split('/').map(s => s.replace(/##SLASH##/g, '/').trim()).filter(Boolean);
        const leaf = segments[segments.length - 1];
        if (leaf) {
          const leafNorm = leaf.toLowerCase().trim();
          const canonical = SLUG_TO_CANONICAL[leafNorm] || SLUG_TO_CANONICAL[leafNorm.replace(/[^a-z0-9]+/g, '-')];
          if (canonical && NAVBAR_CANONICAL_SLUGS.has(canonical)) {
            canonicalSlugsSet.add(canonical);
            const parent = LEAF_TO_PARENT[canonical];
            if (parent) canonicalSlugsSet.add(parent);
          }
        }
        continue;
      }

      const canonical = SLUG_TO_CANONICAL[slug];
      if (canonical && NAVBAR_CANONICAL_SLUGS.has(canonical)) {
        canonicalSlugsSet.add(canonical);
        const parent = LEAF_TO_PARENT[canonical];
        if (parent) canonicalSlugsSet.add(parent);
      } else if (NAVBAR_CANONICAL_SLUGS.has(slug)) {
        canonicalSlugsSet.add(slug);
        const parent = LEAF_TO_PARENT[slug];
        if (parent) canonicalSlugsSet.add(parent);
      }
    }

    // 2. Specific product-name overrides for known ambiguous cases (like Hydration Bags)
    const nameLower = (p.name || '').toLowerCase();
    if (nameLower.includes('hydration')) {
      canonicalSlugsSet.add('hydration-bag');
      canonicalSlugsSet.add('motorcycle-bags-bike-luggage');
    }

    // 2b. If product has completely empty categorySlugs, infer from title keywords
    if (canonicalSlugsSet.size === 0 && p.name) {
      if (nameLower.includes('jacket')) {
        canonicalSlugsSet.add('riding-jackets');
        canonicalSlugsSet.add('riding-gear');
      } else if (nameLower.includes('helmet')) {
        canonicalSlugsSet.add('motorcycle-helmets');
      } else if (nameLower.includes('glove')) {
        canonicalSlugsSet.add('riding-gloves');
        canonicalSlugsSet.add('riding-gear');
      } else if (nameLower.includes('boot') || nameLower.includes('shoe')) {
        canonicalSlugsSet.add('motorcycle-riding-boots');
        canonicalSlugsSet.add('riding-gear');
      } else if (nameLower.includes('bungee') || nameLower.includes('cord')) {
        canonicalSlugsSet.add('motorcycle-accessories-online');
      }
    }

    // 3. Find primary leaf category for categoryId link
    let primaryLeafSlug: string | null = null;
    for (const slug of canonicalSlugsSet) {
      if (LEAF_TO_PARENT[slug]) {
        primaryLeafSlug = slug; // Specific leaf
        break;
      }
    }
    if (!primaryLeafSlug && canonicalSlugsSet.size > 0) {
      primaryLeafSlug = [...canonicalSlugsSet][0];
    }

    // Check target Category Document in MongoDB
    const targetCatDoc = primaryLeafSlug ? slugToCatDoc.get(primaryLeafSlug) : null;
    const targetCatId = targetCatDoc ? targetCatDoc._id : p.categoryId;

    // Combine existing slugs with newly resolved canonical slugs (non-destructive)
    const finalSlugs = [...new Set([...existingSlugs, ...canonicalSlugsSet])];

    const needsSlugUpdate = canonicalSlugsSet.size > 0 && finalSlugs.length > existingSlugs.length;
    const needsCatIdUpdate = targetCatId && (!p.categoryId || p.categoryId.toString() !== targetCatId.toString());

    if (needsSlugUpdate || needsCatIdUpdate) {
      updatedCount++;

      if (sampleUpdates.length < 25) {
        sampleUpdates.push({
          sku: p.sku,
          name: p.name,
          primaryLeaf: primaryLeafSlug,
          addedSlugs: [...canonicalSlugsSet].filter(s => !existingSlugs.includes(s)),
          categoryIdAction: needsCatIdUpdate ? `${p.categoryId || 'null'} -> ${targetCatId}` : 'unchanged',
        });
      }

      if (isApply) {
        backupRecords.push({
          _id: p._id,
          sku: p.sku,
          categorySlugs: existingSlugs,
          categoryId: p.categoryId || null,
        });

        const updateDoc: any = {};
        if (needsSlugUpdate) updateDoc.categorySlugs = finalSlugs;
        if (needsCatIdUpdate) updateDoc.categoryId = targetCatId;

        bulkOps.push({
          updateOne: {
            filter: { _id: p._id },
            update: { $set: updateDoc },
          }
        });
      }
    } else {
      if (canonicalSlugsSet.size > 0) {
        alreadyCleanCount++;
      } else {
        skippedCount++;
        if (skippedProducts.length < 30) {
          skippedProducts.push({ sku: p.sku, name: p.name, existingSlugs: p.categorySlugs });
        }
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                     SYNC EVALUATION REPORT                    ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Total Products Evaluated:          ${products.length}`);
  console.log(`Already Clean & Fully Linked:      ${alreadyCleanCount}`);
  console.log(`Products to Enrich with Nav Slug:  ${updatedCount}`);
  console.log(`Unmatched / Unassigned:            ${skippedCount}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  if (skippedProducts.length > 0) {
    console.log("─── UNMATCHED PRODUCTS SAMPLES ───");
    for (const s of skippedProducts) {
      console.log(`[${s.sku}] "${s.name}" | Existing Slugs: [${(s.existingSlugs || []).join(', ')}]`);
    }
    console.log("");
  }

  console.log("─── SAMPLE PRODUCT ENRICHMENTS (First 20) ───");
  for (const s of sampleUpdates.slice(0, 20)) {
    console.log(`[${s.sku}] "${s.name}"`);
    console.log(`  Canonical Leaf: ${s.primaryLeaf || 'none'}`);
    console.log(`  Added Navbar Slugs: ${s.addedSlugs.join(', ') || '(already had all)'}`);
    console.log(`  CategoryId: ${s.categoryIdAction}`);
    console.log("");
  }

  if (!isApply) {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("ℹ️  This was a DRY RUN. Zero changes were written to MongoDB.");
    console.log("To apply these changes, run with: --apply");
    console.log("═══════════════════════════════════════════════════════════════\n");
  } else {
    // 1. SAVE BACKUP FILE FIRST
    const backupFilePath = path.join(process.cwd(), 'backend', 'scripts', 'pre-sync-backup.json');
    console.log(`\n📦 Creating pre-sync safety backup file at: ${backupFilePath}`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupRecords, null, 2), 'utf-8');
    console.log(`✅ Safety backup saved with ${backupRecords.length} records.\n`);

    // 2. EXECUTE BATCH BULK WRITE (Batches of 500)
    console.log(`🚀 Executing bulk update for ${bulkOps.length} products...`);
    const BATCH_SIZE = 500;
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      await Product.bulkWrite(batch, { ordered: false });
      console.log(`   Written ${Math.min(i + BATCH_SIZE, bulkOps.length)} / ${bulkOps.length} products...`);
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("✅ ALL CHANGES HAVE BEEN APPLIED TO MONGODB SUCCESSFULLY.");
    console.log("═══════════════════════════════════════════════════════════════\n");
  }

  await mongoose.disconnect();
}

syncCategories().catch(err => {
  console.error("Sync script failed:", err);
  process.exit(1);
});
