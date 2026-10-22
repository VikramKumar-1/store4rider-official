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

  // Handle & in CSV (Magento uses & and &amp;)
  "helmet accessories & helmet visors": "helmet-accessories",
  "helmet accessories &amp; helmet visors": "helmet-accessories",

  // Singular forms (Magento CSV inconsistency)
  "full face helmet": "full-face-helmets",
  "off-road helmet": "off-road-helmets",
  "modular helmet": "modular-helmets",
  "open face helmet": "open-face-helmets",
  "half face helmet": "open-face-helmets",

  // Brand-specific Magento categories → parent product type
  "smk twister helmet": "full-face-helmets",
  "smk stellar helmet": "full-face-helmets",
  "smk typhoon helmet": "full-face-helmets",
  "smk glide helmet": "modular-helmets",
  "smk glide modular helmet": "modular-helmets",
  "smk titan helmet": "open-face-helmets",
  "smk hybrid evo": "off-road-helmets",

  // Marketing/price-range categories → parent type
  "helmets between rs.5000-6000": "motorcycle-helmets",
  "helmets between rs.4000-5000": "motorcycle-helmets",
  "helmets between rs.3000-4000": "motorcycle-helmets",
  "helmets between rs.2000-3000": "motorcycle-helmets",
  "helmets between rs.6000-8000": "motorcycle-helmets",
  "helmets between rs.8000-10000": "motorcycle-helmets",
  "helmets above rs.10000": "motorcycle-helmets",
  "helmets below rs.2000": "motorcycle-helmets",

  // Missing specific categories
  "flashers": "bike-auxiliary-lights-filters-flashers",
  "bike exhausts": "performance-parts",
  "exhaust": "performance-parts",
  "exhausts": "performance-parts",
  "panniers": "saddle-bags-bikes",
  "armour": "protectors-armour",
  "armor": "protectors-armour",
  "riding shirts": "riding-jackets",
  "inner wear": "riding-gear",
  "base layer": "riding-gear",
  "rain gear": "riding-gear",
  "rain suit": "riding-gear",
  "rain suits": "riding-gear",
  "riding suits": "racing-suits",

  // Products with escaped slashes and pipe-separated names in CSV
  "saddle bags for bikes / panniers": "saddle-bags-bikes",
  "bike auxiliary lights / filters/ flashers": "bike-auxiliary-lights-filters-flashers",
  "bike auxiliary lights / filters / flashers": "bike-auxiliary-lights-filters-flashers",
  "motorcycle accessories | bike accessories": "motorcycle-accessories-online",
  "motorcycle accessories / bike accessories": "motorcycle-accessories-online",
  "riding gloves | biker gloves": "riding-gloves",
  "riding gloves / biker gloves": "riding-gloves",
  "riding jackets | bike jackets": "riding-jackets",
  "biker t-shirts | motorcycle t shirts": "motorcycle-accessories-online",
  "biker t-shirts / motorcycle t shirts": "motorcycle-accessories-online",

  // Product-specific categories
  "royal enfield himalayan accessories": "motorcycle-accessories-online",
  "radiator guard": "motorcycle-accessories-online",
  "saddle stay / crash guard / leg guard": "motorcycle-accessories-online",
  "saddle stay": "motorcycle-accessories-online",
  "crash guard": "motorcycle-accessories-online",
  "leg guard": "motorcycle-accessories-online",
  "protectors": "protectors-armour",
  "gadgets": "motorcycle-accessories-online",
  "touring gear": "riding-gear",
  "monsoon gear for riders": "riding-gear",
  "short biker gloves between rs.3000-4000": "short-motorbike-gloves",

  // Skip marketing/non-product categories
  "sale": "motorcycle-helmets",
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
  // Magento exports escape path-separator slashes as \/
  // First, temporarily replace escaped slashes to preserve them in leaf names
  const preserved = catPath.replace(/\\\//g, '##SLASH##');
  const segments = preserved.split("/").map(s => s.replace(/##SLASH##/g, '/').trim()).filter(Boolean);
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
    const allMatchedSlugs: string[] = [];

    for (const catPath of paths) {
      const leaf = extractLeafCategory(catPath);
      if (!leaf) continue;
      
      const slug = mapToNavbarSlug(leaf);
      if (slug) {
        allMatchedSlugs.push(slug);
      }
    }

    if (allMatchedSlugs.length > 0) {
      // Prefer the most specific slug (longer slugs are more specific)
      // e.g., "hydration-bag" > "motorcycle-other-luggage" > "motorcycle-bags-bike-luggage"
      // Also prefer leaf categories over parent categories
      const PARENT_SLUGS = new Set([
        "motorcycle-helmets", "motorcycle-bags-bike-luggage", "riding-gear",
        "motorcycle-accessories-online", "motorcycle-riding-boots",
      ]);
      const leafSlugs = allMatchedSlugs.filter(s => !PARENT_SLUGS.has(s));
      bestSlug = leafSlugs.length > 0 ? leafSlugs[0] : allMatchedSlugs[0];
    }

    // Product name-based fallback for hydration products with CSV path "Other Luggage"
    if ((!bestSlug || bestSlug === "motorcycle-other-luggage") && p.name) {
      const nameLower = p.name.toLowerCase();
      if (nameLower.includes("hydration")) bestSlug = "hydration-bag";
      else if (nameLower.includes("tank bag") || nameLower.includes("tankbag")) bestSlug = "tank-bags-bikes";
      else if (nameLower.includes("saddle bag") || nameLower.includes("pannier")) bestSlug = "saddle-bags-bikes";
      else if (nameLower.includes("tail bag") || nameLower.includes("tailbag")) bestSlug = "motorcycle-tail-bags";
      else if (nameLower.includes("top box") || nameLower.includes("top case")) bestSlug = "bike-top-box";
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
