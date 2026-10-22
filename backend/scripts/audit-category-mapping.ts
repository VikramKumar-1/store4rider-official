/**
 * @file audit-category-mapping.ts
 * @description READ-ONLY audit script. Does NOT write to database.
 * 
 * Purpose: Inspect current state of product-to-category mapping.
 * Shows how many products have clean categoryId/categorySlugs vs raw magentoCategories only.
 * Maps Magento CSV paths to client's exact navbar slugs.
 * 
 * Usage: npx tsx backend/scripts/audit-category-mapping.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// ──────────────────────────────────────────────────────────────
// Client's Navbar URLs (from nav.constants.ts) — SINGLE SOURCE OF TRUTH
// These MUST NOT change. Backend maps TO these slugs.
// ──────────────────────────────────────────────────────────────
const MAGENTO_TO_NAVBAR_SLUG: Record<string, string> = {
  // Helmets
  "full face helmets": "full-face-helmets",
  "premium full face helmets": "full-face-helmets",
  "modular helmets": "modular-helmets",
  "modular helmets (flip-up helmets)": "modular-helmets",
  "flip-up helmets": "modular-helmets",
  "off-road helmets": "off-road-helmets",
  "off-road helmets (motocross helmet)": "off-road-helmets",
  "motocross helmet": "off-road-helmets",
  "open face helmets": "open-face-helmets",
  "half face helmets": "open-face-helmets",
  "helmet accessories": "helmet-accessories",
  "helmet accessories/helmet visors": "helmet-accessories",
  "helmet visors": "helmet-accessories",
  "balaclava": "balaclava",
  "bluetooth intercoms": "bluetooth-intercoms",
  "communicators": "bluetooth-intercoms",
  "helmet cleaners": "helmet-cleaners",

  // Riding Jackets & Suits
  "riding jackets": "riding-jackets",
  "riding jackets / bike jackets": "riding-jackets",
  "riding jackets / motorcycle jackets": "riding-jackets",
  "bike jackets": "riding-jackets",
  "motorcycle jackets": "riding-jackets",
  "protectors / armour": "protectors-armour",
  "racing suits": "racing-suits",

  // Riding Pants
  "riding pants": "riding-pants",
  "riding jeans": "motorcycle-riding-jeans",
  "motorcycle riding jeans": "motorcycle-riding-jeans",
  "touring pants": "touring-pants",
  "knee guards": "knee-guards-bikers",
  "knee guards for bikers": "knee-guards-bikers",

  // Riding Gloves
  "riding gloves": "riding-gloves",
  "motorcycle riding gloves": "riding-gloves",
  "riding gloves / biker gloves": "riding-gloves",
  "biker gloves": "riding-gloves",
  "full gauntlet gloves": "full-gauntlet-gloves",
  "premium full gauntlet riding gloves": "full-gauntlet-gloves",
  "semi gauntlet gloves": "semi-gauntlet-gloves",
  "semi gauntlet bike riding gloves": "semi-gauntlet-gloves",
  "short motorbike gloves": "short-motorbike-gloves",
  "short cuff biker gloves": "short-motorbike-gloves",

  // Riding Boots
  "motorcycle riding boots": "motorcycle-riding-boots",
  "premium riding boots": "motorcycle-riding-boots",
  "short biking boots": "short-biking-boots",
  "short city riding biking boots": "short-biking-boots",
  "sports riding shoes": "sports-riding-shoes",
  "sport riding shoes": "sports-riding-shoes",
  "off-road riding boots": "off-road-riding-boots",
  "off-road riding boots / motocross boots": "off-road-riding-boots",
  "motocross boots": "off-road-riding-boots",
  "riding sneakers": "sports-riding-shoes",

  // Off-Road / Motocross Gear (Discipline - NOT product type)
  "off-road motocross riding gear": "off-road-motocross-riding-gear",
  "off-road / motocross": "off-road-motocross-riding-gear",
  "off-road motocross": "off-road-motocross-riding-gear",
  
  // Women
  "women riding gear": "riding-gear-for-women",
  "riding gear for women": "riding-gear-for-women",

  // Luggage
  "tank bags": "tank-bags-bikes",
  "tank bags for bike": "tank-bags-bikes",
  "saddle bags": "saddle-bags-bikes",
  "saddle bags for bikes": "saddle-bags-bikes",
  "saddle bags for bikes (panniers)": "saddle-bags-bikes",
  "saddle bags (panniers)": "saddle-bags-bikes",
  "motorcycle tail bags": "motorcycle-tail-bags",
  "tail bags": "motorcycle-tail-bags",
  "top box": "bike-top-box",
  "bike top box": "bike-top-box",
  "hydration bag": "hydration-bag",
  "hydration bags": "hydration-bag",
  "other luggage": "motorcycle-other-luggage",
  "motorcycle other luggage": "motorcycle-other-luggage",

  // Accessories
  "motorcycle accessories / bike accessories": "motorcycle-accessories-online",
  "motorcycle accessories online": "motorcycle-accessories-online",
  "bike accessories": "motorcycle-accessories-online",
  "bike auxiliary lights / filters / flashers": "bike-auxiliary-lights-filters-flashers",
  "bike auxiliary lights": "bike-auxiliary-lights",
  "auxiliary lights": "bike-auxiliary-lights",
  "auxiliary light filter": "auxiliary-light-filters",
  "auxiliary light filters": "auxiliary-light-filters",
  "clamps and mounts for lights": "bike-auxiliary-light-clamps-mounts",
  "bike auxiliary light clamps and mounts": "bike-auxiliary-light-clamps-mounts",
  "auxiliary light wiring harness and switch": "auxiliary-light-wiring-harness-switch",
  "off-beat accessories": "off-beat-motorcycle-accessories",
  "off-beat bike accessories online": "off-beat-motorcycle-accessories",
  "performance parts": "performance-parts",
  "rally tower": "rally-tower",
  "rally towers / navigation tower": "rally-tower",
  "bike covers": "bike-covers",
  "chain care": "chain-care",
  "motorcycle care": "chain-care",

  // Gadgets
  "bike phone holders": "bike-phone-holders",
  "bike phone holders / mobile holder for bike": "bike-phone-holders",
  "mobile holder for bike": "bike-phone-holders",

  // Spares
  "spares": "spares",
  "bike spare parts online": "spares",
  "bike spares": "spares",
  "chain sprocket kits": "chain-sprocket-kits",
  "iridium spark plugs": "iridium-spark-plugs",
  "iridium spark plug": "iridium-spark-plugs",
  "performance air filters": "performance-air-filters",
  "performance air filters for bikes": "performance-air-filters",
  "brake pads": "brake-pads",

  // Parent categories (top-level navbar groups)
  "motorcycle helmets": "motorcycle-helmets",
  "motorcycle bags / bike luggage": "motorcycle-bags-bike-luggage",
  "motorcycle bags": "motorcycle-bags-bike-luggage",
  "bike luggage": "motorcycle-bags-bike-luggage",
  "riding gear": "riding-gear",
};

// Tags/paths to SKIP (not product categories)
const SKIP_PATTERNS = [
  "root test",
  "default category",
  "default",
  "brands",
  "promotions",
  "on sale",
  "new arrivals",
  "best sellers",
  "featured",
  "shop by",
];

function parseMagentoCategories(raw: string): string[] {
  if (!raw) return [];
  // Split by comma for multiple category assignments
  return raw.split(",").map(p => p.trim()).filter(Boolean);
}

function extractLeafCategory(catPath: string): string | null {
  // "Root Test 01/Motorcycle Helmets/Off-Road Helmets (Motocross Helmet)"
  // Extract leaf: "Off-Road Helmets (Motocross Helmet)"
  const segments = catPath.split("/").map(s => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;
  
  // Return the deepest segment (leaf)
  const leaf = segments[segments.length - 1];
  
  // Skip if it matches skip patterns
  if (SKIP_PATTERNS.some(p => leaf.toLowerCase().includes(p))) return null;
  
  return leaf;
}

function mapToNavbarSlug(leafName: string): string | null {
  const normalized = leafName.toLowerCase().trim();
  return MAGENTO_TO_NAVBAR_SLUG[normalized] || null;
}

async function audit() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error("ERROR: No MONGODB_URI or DATABASE_URL found in environment.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.\n");

  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));

  // ── 1. Database Stats ──
  const totalProducts = await Product.countDocuments();
  const withCategoryId = await Product.countDocuments({ categoryId: { $exists: true, $ne: null, $ne: "" } });
  const withCategorySlugs = await Product.countDocuments({ 'categorySlugs.0': { $exists: true } });
  const withMagentoCategories = await Product.countDocuments({ magentoCategories: { $exists: true, $ne: null, $ne: "" } });
  const totalCategories = await Category.countDocuments();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                   DATABASE CURRENT STATE                      ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Total Products:          ${totalProducts}`);
  console.log(`With categoryId:         ${withCategoryId} (${((withCategoryId/totalProducts)*100).toFixed(1)}%)`);
  console.log(`With categorySlugs[]:    ${withCategorySlugs} (${((withCategorySlugs/totalProducts)*100).toFixed(1)}%)`);
  console.log(`With magentoCategories:  ${withMagentoCategories} (${((withMagentoCategories/totalProducts)*100).toFixed(1)}%)`);
  console.log(`Total Category Docs:     ${totalCategories}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ── 2. Category Documents ──
  const allCategories = await Category.find().select('name slug parentId').lean();
  const categorySlugsSet = new Set(allCategories.map((c: any) => c.slug));
  console.log(`Category slugs in DB: ${allCategories.map((c: any) => c.slug).join(', ')}\n`);

  // ── 3. Product-by-Product Mapping Audit ──
  const products = await Product.find({ magentoCategories: { $exists: true, $ne: null, $ne: "" } })
    .select('name sku magentoCategories categorySlugs categoryId')
    .lean();

  let mapped = 0;
  let unmapped = 0;
  let alreadyHasSlugs = 0;
  const unmappedLeaves = new Map<string, number>();
  const mappingResults: Array<{sku: string; name: string; magentoPath: string; mappedSlug: string | null; currentSlugs: string[]}> = [];

  for (const p of products as any[]) {
    const paths = parseMagentoCategories(p.magentoCategories);
    let bestSlug: string | null = null;

    for (const catPath of paths) {
      const leaf = extractLeafCategory(catPath);
      if (!leaf) continue;
      
      const slug = mapToNavbarSlug(leaf);
      if (slug) {
        // Prefer the most specific (deepest leaf that's a product category, not a discipline)
        bestSlug = slug;
        break; // First valid match is the primary category
      }
    }

    if (bestSlug) {
      mapped++;
    } else {
      unmapped++;
      // Track which leaves we could not map
      for (const catPath of paths) {
        const leaf = extractLeafCategory(catPath);
        if (leaf) {
          unmappedLeaves.set(leaf, (unmappedLeaves.get(leaf) || 0) + 1);
        }
      }
    }

    if (p.categorySlugs && p.categorySlugs.length > 0) {
      alreadyHasSlugs++;
    }

    mappingResults.push({
      sku: p.sku,
      name: p.name,
      magentoPath: p.magentoCategories,
      mappedSlug: bestSlug,
      currentSlugs: p.categorySlugs || [],
    });
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                   MAPPING DRY-RUN RESULTS                    ");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Products with magentoCategories:  ${products.length}`);
  console.log(`Successfully mapped to slug:      ${mapped} (${((mapped/products.length)*100).toFixed(1)}%)`);
  console.log(`Could NOT map (need dictionary):  ${unmapped} (${((unmapped/products.length)*100).toFixed(1)}%)`);
  console.log(`Already have categorySlugs[]:     ${alreadyHasSlugs}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ── 4. Show unmapped leaf names ──
  if (unmappedLeaves.size > 0) {
    console.log("─── UNMAPPED LEAF CATEGORIES (Need to add to dictionary) ───");
    const sorted = [...unmappedLeaves.entries()].sort((a, b) => b[1] - a[1]);
    for (const [leaf, count] of sorted) {
      console.log(`  ${count}x  "${leaf}"`);
    }
    console.log("");
  }

  // ── 5. Sample mappings for verification ──
  console.log("─── SAMPLE MAPPINGS (First 30 for review) ───");
  for (const r of mappingResults.slice(0, 30)) {
    const status = r.mappedSlug ? "✅" : "❌";
    console.log(`${status} [${r.sku}] "${r.name}"`);
    console.log(`   CSV Path:     ${r.magentoPath}`);
    console.log(`   Mapped Slug:  ${r.mappedSlug || "UNMAPPED"}`);
    console.log(`   Current DB:   ${r.currentSlugs.length > 0 ? r.currentSlugs.join(', ') : "(empty)"}`);
    console.log("");
  }

  // ── 6. Specific checks the user cares about ──
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("               CRITICAL VERIFICATION CHECKS                   ");
  console.log("═══════════════════════════════════════════════════════════════");
  
  const hydrationProducts = mappingResults.filter(r => r.name?.toLowerCase().includes("hydration"));
  console.log("\n🎒 Hydration Bag Products:");
  for (const h of hydrationProducts) {
    console.log(`   "${h.name}" → ${h.mappedSlug} ${h.mappedSlug === 'hydration-bag' ? '✅' : '❌ WRONG!'}`);
  }

  const offRoadHelmetProducts = mappingResults.filter(r => r.mappedSlug === 'off-road-helmets');
  console.log(`\n🪖 Products mapped to off-road-helmets (${offRoadHelmetProducts.length}):`);
  for (const h of offRoadHelmetProducts) {
    console.log(`   "${h.name}" ✅`);
  }

  const leakedToHelmets = mappingResults.filter(r => 
    r.mappedSlug === 'off-road-helmets' && 
    (r.name?.toLowerCase().includes("bag") || r.name?.toLowerCase().includes("backpack") || r.name?.toLowerCase().includes("hydration"))
  );
  console.log(`\n🚨 Non-helmet products leaking into off-road-helmets: ${leakedToHelmets.length}`);
  if (leakedToHelmets.length > 0) {
    for (const l of leakedToHelmets) {
      console.log(`   ❌ "${l.name}" — THIS SHOULD NOT BE HERE`);
    }
  } else {
    console.log("   ✅ CLEAN — No bags/backpacks in helmet category!");
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                         DONE (READ-ONLY)                     ");
  console.log("        No database writes were made. This was a dry run.     ");
  console.log("═══════════════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

audit().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
