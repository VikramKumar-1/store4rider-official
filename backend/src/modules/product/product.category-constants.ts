/**
 * @file product.category-constants.ts
 * @description Single source of truth for category alias mappings, domain groups,
 * and search slug resolution. Eliminates the triplicated aliasMap that was previously
 * maintained independently in product.service.ts, product.validator.ts, and category.service.ts.
 *
 * IMPORTANT: When adding new categories or aliases, update ONLY this file.
 * All three consumers import from here.
 */

// ──────────────────────────────────────────────────────────────
// CATEGORY ALIAS MAP — Maps every known category slug variant
// to an array of alternative slugs that should also match.
// Used by product queries to find products regardless of which
// slug variant was stored in the DB's categorySlugs array.
// ──────────────────────────────────────────────────────────────
export const CATEGORY_ALIAS_MAP: Record<string, string[]> = {
  // ── Helmets ──
  "full-face-helmets": ["full-face-helmets", "full-face-helmet", "full-face", "premium-full-face-helmets"],
  "modular-helmets": ["modular-helmets-flip-up-helmets", "modular-flip-up", "modular-helmet", "smk-glide-modular-helmet"],
  "modular-helmets-flip-up-helmets": ["modular-helmets", "modular-flip-up", "modular-helmet"],
  "off-road-helmets": ["off-road-helmets-motocross-helmet", "motocross-helmet", "off-road-helmet", "motocross-helmets"],
  "off-road-helmets-motocross-helmet": ["off-road-helmets", "motocross-helmet", "off-road-helmet", "motocross-helmets"],
  "open-face-helmets": ["open-face-helmets", "half-face-helmets", "open-face", "open-face-helmet", "half-face-helmet"],
  "half-face-helmets": ["open-face-helmets", "half-face-helmets", "open-face", "open-face-helmet", "half-face-helmet"],
  "helmet-accessories": ["helmet-accessories-helmet-visors", "helmet-visors", "helmet-accessories", "visors", "visor"],
  "helmet-visors": ["helmet-accessories-helmet-visors", "helmet-accessories", "helmet-visors", "visors", "visor"],
  "helmet-accessories-helmet-visors": ["helmet-accessories", "helmet-visors", "visors", "visor"],
  "balaclava": ["balaclava", "face-mask", "head-mask"],
  "bluetooth-intercoms": ["communicators", "communicator", "intercom", "bluetooth"],
  "communicators": ["bluetooth-intercoms", "communicators", "communicator"],
  "helmet-cleaners": ["helmet-cleaner", "motorcycle-care", "cleaner"],

  // ── Riding Jackets & Suits ──
  "riding-jacket": ["riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets", "riding-jackets", "motorcycle-jackets", "rynox-riding-jacket"],
  "riding-jackets": ["riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets", "riding-jacket", "motorcycle-jackets", "rynox-riding-jacket"],
  "riding-jackets-bike-jackets": ["riding-jackets", "riding-jacket", "riding-jackets-motorcycle-jackets", "motorcycle-jackets"],
  "riding-jackets-motorcycle-jackets": ["riding-jackets", "riding-jacket", "riding-jackets-bike-jackets", "motorcycle-jackets"],
  "protectors-armour": ["protectors-armour", "protectors", "armour", "armor"],
  "racing-suits": ["racing-suits", "racing-suit"],
  "women-riding-gear": ["women-riding-gear", "riding-gear-for-women"],
  "riding-gear-for-women": ["riding-gear-for-women", "women-riding-gear"],
  "off-road-motocross": ["off-road-motocross-riding-gear", "off-road-motocross"],
  "off-road-motocross-riding-gear": ["off-road-motocross", "off-road-motocross-riding-gear"],

  // ── Riding Pants ──
  "riding-pants": ["riding-pants", "touring-pants", "touring-pant"],
  "riding-jeans": ["riding-jeans", "motorcycle-riding-jeans", "riding-jean"],
  "motorcycle-riding-jeans": ["motorcycle-riding-jeans", "riding-jeans", "riding-jean"],
  "touring-pants": ["touring-pants", "touring-pant", "riding-pants"],
  "knee-guards": ["knee-guards-for-bikers", "knee-guard", "knee-guards"],
  "knee-guards-for-bikers": ["knee-guards", "knee-guard"],
  "knee-guards-bikers": ["knee-guards-for-bikers", "knee-guards", "knee-guard", "knee-guards-bikers"],

  // ── Riding Gloves ──
  "riding-gloves": ["riding-gloves-biker-gloves", "motorcycle-riding-gloves", "gloves", "biker-gloves"],
  "motorcycle-riding-gloves": ["riding-gloves", "riding-gloves-biker-gloves", "gloves", "biker-gloves"],
  "riding-gloves-biker-gloves": ["riding-gloves", "motorcycle-riding-gloves", "gloves", "biker-gloves"],
  "full-gauntlet-gloves": ["full-gauntlet-gloves", "premium-full-gauntlet-riding-gloves"],
  "premium-full-gauntlet-riding-gloves": ["full-gauntlet-gloves"],
  "semi-gauntlet-gloves": ["semi-gauntlet-bike-riding-gloves", "semi-gauntlet"],
  "semi-gauntlet-bike-riding-gloves": ["semi-gauntlet-gloves", "semi-gauntlet"],
  "short-motorbike-gloves": ["short-cuff-biker-gloves", "short-cuff-biker-glove"],
  "short-cuff-biker-gloves": ["short-motorbike-gloves", "short-cuff-biker-glove"],

  // ── Riding Boots ──
  "motorcycle-riding-boots": ["motorcycle-riding-boots", "premium-riding-boots"],
  "short-biking-boots": ["short-city-riding-biking-boots", "short-biking-boots", "short-biking-boot"],
  "short-city-riding-biking-boots": ["short-biking-boots", "short-biking-boot"],
  "sports-riding-shoes": ["sport-riding-shoes", "sports-riding-shoes", "sport-riding-shoe"],
  "sport-riding-shoes": ["sports-riding-shoes", "sport-riding-shoes"],
  "off-road-boots": ["off-road-riding-boots-motocross-boots", "off-road-riding-boots", "motocross-boots"],
  "off-road-riding-boots": ["off-road-boots", "off-road-riding-boots", "motocross-boots"],
  "off-road-riding-boots-motocross-boots": ["off-road-boots", "off-road-riding-boots", "motocross-boots"],

  // ── Luggage ──
  "tank-bags": ["tank-bags-for-bike", "rynox-tank-bags", "tank-bags"],
  "tank-bags-bikes": ["tank-bags-for-bike", "tank-bags", "rynox-tank-bags", "tank-bags-bikes"],
  "tank-bags-for-bike": ["tank-bags", "rynox-tank-bags"],
  "saddle-bags": ["saddle-bags-for-bikes-panniers", "saddle-bags-bikes", "rynox-saddle-bags", "saddle-bags"],
  "saddle-bags-bikes": ["saddle-bags-for-bikes-panniers", "saddle-bags", "rynox-saddle-bags"],
  "saddle-bags-for-bikes-panniers": ["saddle-bags", "saddle-bags-bikes", "rynox-saddle-bags"],
  "motorcycle-tail-bags": ["motorcycle-tail-bags", "rynox-tail-bags", "tail-bags"],
  "tail-bags": ["motorcycle-tail-bags", "rynox-tail-bags"],
  "top-box": ["top-box", "top-case"],
  "bike-top-box": ["top-box", "top-boxes", "bike-top-box"],
  "hydration-bag": ["hydration-bag", "hydration-bags"],
  "hydration-bags": ["hydration-bag", "hydration-bags"],
  "other-luggage": ["other-luggage"],
  "motorcycle-other-luggage": ["other-luggage", "other-luggages", "motorcycle-other-luggage"],

  // ── Accessories ──
  "motorcycle-accessories-online": ["motorcycle-accessories-bike-accessories", "motorcycle-accessories-online", "bike-accessories"],
  "motorcycle-accessories-bike-accessories": ["motorcycle-accessories-online", "motorcycle-accessories-bike-accessories", "bike-accessories"],
  "bike-accessories": ["motorcycle-accessories-bike-accessories", "motorcycle-accessories-online"],
  "bike-auxiliary-lights-filters-flashers": ["bike-auxiliary-lights-filters-flashers", "bike-auxiliary-lights"],
  "auxiliary-lights": ["bike-auxiliary-lights", "bike-auxiliary-light", "bike-auxiliary-lights-filters-flashers"],
  "bike-auxiliary-lights": ["auxiliary-lights", "bike-auxiliary-lights", "bike-auxiliary-lights-filters-flashers"],
  "auxiliary-light-filter": ["auxiliary-light-filters", "auxiliary-light-filter"],
  "auxiliary-light-filters": ["auxiliary-light-filter", "auxiliary-light-filters"],
  "clamps-and-mounts-for-lights": ["bike-auxiliary-light-clamps-and-mounts", "bike-auxiliary-light-clamps-and-mount"],
  "bike-auxiliary-light-clamps-mounts": ["bike-auxiliary-light-clamps-and-mounts", "clamps-and-mounts-for-lights", "bike-auxiliary-light-clamps-mounts"],
  "bike-auxiliary-light-clamps-and-mounts": ["clamps-and-mounts-for-lights", "bike-auxiliary-light-clamps-and-mounts"],
  "auxiliary-light-wiring-harness-and-switch": ["auxiliary-light-wiring-harness-and-switch", "auxiliary-light-wiring-harness-and-switchs"],
  "auxiliary-light-wiring-harness-switch": ["auxiliary-light-wiring-harness-and-switch", "auxiliary-light-wiring-harness-switch"],
  "off-beat-accessories": ["off-beat-bike-accessories-online", "off-beat-bike-accessories-onlines"],
  "off-beat-motorcycle-accessories": ["off-beat-bike-accessories-online", "off-beat-accessories", "off-beat-motorcycle-accessories"],
  "off-beat-bike-accessories-online": ["off-beat-accessories", "off-beat-bike-accessories-online"],
  "performance-parts": ["performance-parts"],
  "rally-tower": ["rally-tower", "rally-towers-navigation-tower", "navigation-tower"],
  "rally-towers-navigation-tower": ["rally-tower", "rally-towers-navigation-tower"],
  "bike-covers": ["bike-covers"],
  "chain-care": ["chain-care", "chain-cares", "motorcycle-care"],
  "motorcycle-care": ["chain-care", "motorcycle-care"],

  // ── Gadgets ──
  "bike-phone-holders": ["bike-phone-holders-mobile-holder-for-bike", "mobile-holder-for-bike", "bike-phone-holders"],
  "bike-phone-holders-mobile-holder-for-bike": ["bike-phone-holders", "mobile-holder-for-bike"],

  // ── Spares ──
  "spares": ["bike-spare-parts-online", "performance-parts", "spares", "bike-spares"],
  "bike-spares": ["bike-spare-parts-online", "performance-parts", "spares", "bike-spares"],
  "bike-spare-parts-online": ["spares", "bike-spare-parts-online", "bike-spares"],
  "chain-sprocket-kits": ["chain-sprocket-kits", "chain-sprocket-kit"],
  "iridium-spark-plugs": ["iridium-spark-plug", "iridium-spark-plugs"],
  "iridium-spark-plug": ["iridium-spark-plugs", "iridium-spark-plug"],
  "performance-air-filters": ["performance-air-filters-for-bikes", "performance-air-filters-for-bike"],
  "performance-air-filter-bike": ["performance-air-filters-for-bikes", "performance-air-filters", "performance-air-filter-bike"],
  "performance-air-filters-for-bikes": ["performance-air-filters", "performance-air-filters-for-bike"],
  "brake-pads": ["brake-pads", "brake-pad"],
};

// ──────────────────────────────────────────────────────────────
// CATEGORY DOMAIN GROUPS — Classifies category slugs into
// product type domains for cross-contamination prevention.
// A query for a HELMET category should NEVER return LUGGAGE, etc.
// ──────────────────────────────────────────────────────────────
export const CATEGORY_DOMAIN_GROUPS = {
  HELMETS: [
    "full-face-helmets", "modular-helmets", "off-road-helmets",
    "open-face-helmets", "half-face-helmets",
  ],
  HELMET_ACCESSORIES: [
    "helmet-accessories", "helmet-visors", "helmet-accessories-helmet-visors",
    "balaclava", "bluetooth-intercoms", "communicators", "helmet-cleaners",
  ],
  LUGGAGE: [
    "tank-bags-bikes", "tank-bags", "tank-bags-for-bike",
    "saddle-bags-bikes", "saddle-bags", "saddle-bags-for-bikes-panniers",
    "motorcycle-tail-bags", "tail-bags",
    "bike-top-box", "top-box",
    "hydration-bag", "hydration-bags",
    "motorcycle-other-luggage", "other-luggage",
  ],
  APPAREL: [
    "riding-jackets", "riding-jacket", "riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets",
    "riding-pants", "touring-pants",
    "motorcycle-riding-jeans", "riding-jeans",
    "racing-suits",
    "protectors-armour",
  ],
  FOOTWEAR: [
    "motorcycle-riding-boots",
    "short-biking-boots", "short-city-riding-biking-boots",
    "sports-riding-shoes", "sport-riding-shoes",
    "off-road-riding-boots", "off-road-boots", "off-road-riding-boots-motocross-boots",
  ],
  GLOVES: [
    "riding-gloves", "motorcycle-riding-gloves", "riding-gloves-biker-gloves",
    "full-gauntlet-gloves", "premium-full-gauntlet-riding-gloves",
    "semi-gauntlet-gloves", "semi-gauntlet-bike-riding-gloves",
    "short-motorbike-gloves", "short-cuff-biker-gloves",
  ],
  ACCESSORIES: [
    "motorcycle-accessories-online", "motorcycle-accessories-bike-accessories", "bike-accessories",
    "bike-auxiliary-lights-filters-flashers", "bike-auxiliary-lights", "auxiliary-lights",
    "auxiliary-light-filter", "auxiliary-light-filters",
    "bike-auxiliary-light-clamps-mounts", "bike-auxiliary-light-clamps-and-mounts", "clamps-and-mounts-for-lights",
    "auxiliary-light-wiring-harness-switch", "auxiliary-light-wiring-harness-and-switch",
    "off-beat-motorcycle-accessories", "off-beat-accessories", "off-beat-bike-accessories-online",
    "performance-parts",
    "rally-tower", "rally-towers-navigation-tower",
    "bike-covers",
    "chain-care", "motorcycle-care",
    "bike-phone-holders", "bike-phone-holders-mobile-holder-for-bike",
  ],
  SPARES: [
    "spares", "bike-spares", "bike-spare-parts-online",
    "chain-sprocket-kits",
    "iridium-spark-plugs", "iridium-spark-plug",
    "performance-air-filters", "performance-air-filter-bike", "performance-air-filters-for-bikes",
    "brake-pads",
  ],
  GUARDS: [
    "knee-guards", "knee-guards-for-bikers", "knee-guards-bikers",
  ],
  DISCIPLINE: [
    "off-road-motocross", "off-road-motocross-riding-gear",
    "women-riding-gear", "riding-gear-for-women",
  ],
} as const;

/**
 * Returns the domain group name a category slug belongs to.
 * Returns null for unknown slugs.
 */
export function getCategoryDomain(slug: string): string | null {
  const normalized = slug.toLowerCase().trim();
  for (const [domain, slugs] of Object.entries(CATEGORY_DOMAIN_GROUPS)) {
    if ((slugs as readonly string[]).includes(normalized)) {
      return domain;
    }
  }
  return null;
}

/**
 * Builds the full array of search slugs for a given category slug.
 * Includes the original slug, singular/plural variants, hyphen-stripped variants,
 * and all aliases from CATEGORY_ALIAS_MAP.
 *
 * This replaces the duplicated slug-expansion logic that was previously
 * maintained independently in product.service.ts and product.validator.ts.
 */
export function buildSearchSlugs(cleanSlug: string): string[] {
  const isPlural = cleanSlug.endsWith('s');
  const singularSlug = isPlural ? cleanSlug.slice(0, -1) : cleanSlug;
  const pluralSlug = isPlural ? cleanSlug : cleanSlug + 's';

  const searchSlugs = [
    cleanSlug,
    singularSlug,
    pluralSlug,
    cleanSlug.replace(/-/g, ''),
    singularSlug.replace(/-/g, ''),
    pluralSlug.replace(/-/g, ''),
  ];

  if (CATEGORY_ALIAS_MAP[cleanSlug]) searchSlugs.push(...CATEGORY_ALIAS_MAP[cleanSlug]);
  if (CATEGORY_ALIAS_MAP[singularSlug]) searchSlugs.push(...CATEGORY_ALIAS_MAP[singularSlug]);
  if (CATEGORY_ALIAS_MAP[pluralSlug]) searchSlugs.push(...CATEGORY_ALIAS_MAP[pluralSlug]);

  // Deduplicate while preserving order
  return [...new Set(searchSlugs)];
}

// ──────────────────────────────────────────────────────────────
// NAVBAR-TO-DB SLUG MAP — Maps navbar/frontend slugs to the
// actual slug values stored in DB's categorySlugs arrays.
// Used by getCategoryRegexRule() in product.utils.ts to
// normalize incoming slugs before building regex queries.
//
// Purpose: When navbar sends "full-face-helmets" but the DB
// categorySlugs have "full-face", this map bridges them.
// ──────────────────────────────────────────────────────────────
export const NAVBAR_TO_DB_SLUG_MAP: Record<string, string> = {
  "full-face-helmets": "full-face",
  "modular-helmets": "modular-flip-up",
  "modular-helmets-flip-up-helmets": "modular-flip-up",
  "open-face-helmets": "open-face",
  "half-face-helmets": "open-face",
  "off-road-helmets": "off-road-motocross-gear",
  "off-road-motocross": "off-road-motocross-gear",
  "off-road-riding-boots": "off-road-riding-boots",
  "off-road-boots": "off-road-riding-boots",
  "riding-jacket": "riding-jackets",
  "riding-jackets": "riding-jackets",
  "protectors-armour": "protectors-armour",
  "riding-jean": "riding-jeans",
  "riding-jeans": "riding-jeans",
  "motorcycle-riding-jeans": "riding-jeans",
  "touring-pant": "touring-pants",
  "knee-guard": "knee-guards",
  "knee-guards-for-bikers": "knee-guards",
  "knee-guards-bikers": "knee-guards",
  "motorcycle-riding-gloves": "riding-gloves",
  "riding-gloves": "riding-gloves",
  "semi-gauntlet-gloves": "semi-gauntlet",
  "short-motorbike-gloves": "short-cuff-biker-gloves",
  "short-biking-boots": "short-city-riding-biking-boots",
  "sports-riding-shoes": "sport-riding-shoes",
  "tank-bags-bikes": "tank-bags",
  "saddle-bags": "saddle-bags-bikes",
  "saddle-bags-bikes": "saddle-bags-bikes",
  "motorcycle-tail-bags": "motorcycle-tail-bags",
  "tail-bags": "motorcycle-tail-bags",
  "bike-top-box": "top-box",
  "hydration-bag": "hydration-bag",
  "motorcycle-other-luggage": "other-luggage",
  "women-riding-gear": "riding-gear-for-women",
  "riding-gear-for-women": "riding-gear-for-women",
  "helmet-accessories": "helmet-accessories",
  "helmet-visors": "helmet-accessories",
  "bluetooth-intercoms": "communicators",
  "communicators": "communicators",
  "bike-phone-holders": "bike-phone-holders-mobile-holder-for-bike",
  "bike-auxiliary-light-clamps-mounts": "clamps-and-mounts-for-lights",
  "auxiliary-light-wiring-harness-switch": "auxiliary-light-wiring-harness-and-switch",
  "off-beat-motorcycle-accessories": "off-beat-accessories",
  "rally-tower": "rally-tower",
  "bike-spares": "spares",
  "iridium-spark-plugs": "iridium-spark-plug",
  "performance-air-filters": "performance-air-filters-for-bikes",
  "performance-air-filter-bike": "performance-air-filters-for-bikes",
  "brake-pads": "brake-pads",
};

// ──────────────────────────────────────────────────────────────
// MAGENTO CSV PATH TO CANONICAL NAVBAR SLUG MAP
// Used for automatic categorization whenever a fresh CSV is imported
// or a product with magentoCategories is created/updated.
// ──────────────────────────────────────────────────────────────
export const MAGENTO_PATH_TO_NAVBAR_SLUG: Record<string, string> = {
  // Helmets
  "full face helmets": "full-face-helmets",
  "full face helmet": "full-face-helmets",
  "premium full face helmets": "full-face-helmets",
  "modular helmets": "modular-helmets",
  "modular helmet": "modular-helmets",
  "modular helmets (flip-up helmets)": "modular-helmets",
  "flip-up helmets": "modular-helmets",
  "off-road helmets": "off-road-helmets",
  "off-road helmet": "off-road-helmets",
  "off-road helmets (motocross helmet)": "off-road-helmets",
  "motocross helmet": "off-road-helmets",
  "open face helmets": "open-face-helmets",
  "open face helmet": "open-face-helmets",
  "half face helmets": "open-face-helmets",
  "half face helmet": "open-face-helmets",
  "helmet accessories": "helmet-accessories",
  "helmet accessories & helmet visors": "helmet-accessories",
  "helmet accessories &amp; helmet visors": "helmet-accessories",
  "helmet accessories/helmet visors": "helmet-accessories",
  "helmet visors": "helmet-accessories",
  "balaclava": "balaclava",
  "bluetooth intercoms": "bluetooth-intercoms",
  "communicators": "bluetooth-intercoms",
  "helmet cleaners": "helmet-cleaners",

  // Brand-specific Magento categories -> Parent Product Type
  "smk twister helmet": "full-face-helmets",
  "smk stellar helmet": "full-face-helmets",
  "smk typhoon helmet": "full-face-helmets",
  "smk glide helmet": "modular-helmets",
  "smk glide modular helmet": "modular-helmets",
  "smk titan helmet": "open-face-helmets",
  "smk hybrid evo": "off-road-helmets",

  // Jackets
  "riding jackets": "riding-jackets",
  "riding jackets / bike jackets": "riding-jackets",
  "riding jackets | bike jackets": "riding-jackets",
  "riding jackets / motorcycle jackets": "riding-jackets",
  "bike jackets": "riding-jackets",
  "motorcycle jackets": "riding-jackets",
  "protectors / armour": "protectors-armour",
  "protectors": "protectors-armour",
  "armour": "protectors-armour",
  "armor": "protectors-armour",
  "racing suits": "racing-suits",
  "riding shirts": "riding-jackets",

  // Pants & Jeans
  "riding pants": "riding-pants",
  "riding jeans": "motorcycle-riding-jeans",
  "motorcycle riding jeans": "motorcycle-riding-jeans",
  "touring pants": "touring-pants",
  "knee guards": "knee-guards-bikers",
  "knee guards for bikers": "knee-guards-bikers",

  // Gloves
  "riding gloves": "riding-gloves",
  "motorcycle riding gloves": "riding-gloves",
  "riding gloves / biker gloves": "riding-gloves",
  "riding gloves | biker gloves": "riding-gloves",
  "biker gloves": "riding-gloves",
  "full gauntlet gloves": "full-gauntlet-gloves",
  "premium full gauntlet riding gloves": "full-gauntlet-gloves",
  "semi gauntlet gloves": "semi-gauntlet-gloves",
  "semi gauntlet bike riding gloves": "semi-gauntlet-gloves",
  "short motorbike gloves": "short-motorbike-gloves",
  "short cuff biker gloves": "short-motorbike-gloves",

  // Boots
  "motorcycle riding boots": "motorcycle-riding-boots",
  "premium riding boots": "motorcycle-riding-boots",
  "short biking boots": "short-biking-boots",
  "short city riding biking boots": "short-biking-boots",
  "sports riding shoes": "sports-riding-shoes",
  "sport riding shoes": "sports-riding-shoes",
  "off-road riding boots": "off-road-riding-boots",
  "off-road riding boots / motocross boots": "off-road-riding-boots",
  "motocross boots": "off-road-riding-boots",

  // Specialized Gear
  "women riding gear": "riding-gear-for-women",
  "riding gear for women": "riding-gear-for-women",
  "off-road motocross riding gear": "off-road-motocross-riding-gear",
  "off-road / motocross": "off-road-motocross-riding-gear",

  // Luggage
  "tank bags": "tank-bags-bikes",
  "tank bags for bike": "tank-bags-bikes",
  "saddle bags": "saddle-bags-bikes",
  "saddle bags for bikes": "saddle-bags-bikes",
  "saddle bags for bikes (panniers)": "saddle-bags-bikes",
  "saddle bags for bikes / panniers": "saddle-bags-bikes",
  "saddle bags (panniers)": "saddle-bags-bikes",
  "panniers": "saddle-bags-bikes",
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
  "motorcycle accessories | bike accessories": "motorcycle-accessories-online",
  "motorcycle accessories online": "motorcycle-accessories-online",
  "bike accessories": "motorcycle-accessories-online",
  "bike auxiliary lights / filters / flashers": "bike-auxiliary-lights-filters-flashers",
  "bike auxiliary lights / filters/ flashers": "bike-auxiliary-lights-filters-flashers",
  "bike auxiliary lights": "bike-auxiliary-lights",
  "auxiliary lights": "bike-auxiliary-lights",
  "flashers": "bike-auxiliary-lights-filters-flashers",
  "auxiliary light filter": "auxiliary-light-filters",
  "auxiliary light filters": "auxiliary-light-filters",
  "clamps and mounts for lights": "bike-auxiliary-light-clamps-mounts",
  "bike auxiliary light clamps and mounts": "bike-auxiliary-light-clamps-mounts",
  "bike auxiliary light clamps mounts": "bike-auxiliary-light-clamps-mounts",
  "auxiliary light wiring harness and switch": "auxiliary-light-wiring-harness-switch",
  "auxiliary light wiring harness switch": "auxiliary-light-wiring-harness-switch",
  "off-beat accessories": "off-beat-motorcycle-accessories",
  "off-beat bike accessories online": "off-beat-motorcycle-accessories",
  "performance parts": "performance-parts",
  "bike exhausts": "performance-parts",
  "exhaust": "performance-parts",
  "exhausts": "performance-parts",
  "rally tower": "rally-tower",
  "rally towers / navigation tower": "rally-tower",
  "bike covers": "bike-covers",
  "chain care": "chain-care",
  "motorcycle care": "chain-care",
  "bike phone holders": "bike-phone-holders",
  "mobile holder for bike": "bike-phone-holders",
  "gadgets": "bike-phone-holders",

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
};

/**
 * Parent slug lookup for each leaf category
 */
export const LEAF_TO_PARENT_MAP: Record<string, string> = {
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

/**
 * Automatically resolves and enriches product categories to match client navbar slugs.
 * Called automatically whenever a product is created, updated, or imported from CSV.
 * 
 * Guarantees:
 * 1. Output slugs strictly match canonical navbar URLs (nav.constants.ts).
 * 2. Leaves are automatically bundled with their parent category slug.
 * 3. Never produces cross-contamination (e.g. hydration backpacks in off-road-helmets).
 */
export function resolveCanonicalCategorySlugs(product: {
  name?: string;
  magentoCategories?: string;
  categorySlugs?: string[];
}): string[] {
  const resolved = new Set<string>();

  // 1. From existing categorySlugs array (if provided)
  if (product.categorySlugs && Array.isArray(product.categorySlugs)) {
    for (const rawSlug of product.categorySlugs) {
      if (!rawSlug) continue;
      const clean = rawSlug.toLowerCase().trim();
      
      // If it contains slashes, treat as path
      if (clean.includes('/') || clean.includes('\\')) {
        const preserved = clean.replace(/\\\//g, '##SLASH##');
        const segments = preserved.split('/').map(s => s.replace(/##SLASH##/g, '/').trim()).filter(Boolean);
        const leaf = segments[segments.length - 1];
        if (leaf) {
          const mapped = MAGENTO_PATH_TO_NAVBAR_SLUG[leaf.toLowerCase()] || MAGENTO_PATH_TO_NAVBAR_SLUG[leaf.toLowerCase().replace(/[^a-z0-9]+/g, '-')];
          if (mapped) {
            resolved.add(mapped);
            const parent = LEAF_TO_PARENT_MAP[mapped];
            if (parent) resolved.add(parent);
          }
        }
      } else {
        const mapped = MAGENTO_PATH_TO_NAVBAR_SLUG[clean] || (NAVBAR_TO_DB_SLUG_MAP[clean] ? clean : null);
        if (mapped) {
          resolved.add(mapped);
          const parent = LEAF_TO_PARENT_MAP[mapped];
          if (parent) resolved.add(parent);
        }
      }
    }
  }

  // 2. From raw magentoCategories CSV column (if present)
  if (product.magentoCategories && typeof product.magentoCategories === 'string') {
    const paths = product.magentoCategories.split(',').map(p => p.trim()).filter(Boolean);
    for (const catPath of paths) {
      const preserved = catPath.replace(/\\\//g, '##SLASH##');
      const segments = preserved.split('/').map(s => s.replace(/##SLASH##/g, '/').trim()).filter(Boolean);
      if (segments.length > 0) {
        const leaf = segments[segments.length - 1].toLowerCase().trim();
        const mapped = MAGENTO_PATH_TO_NAVBAR_SLUG[leaf] || MAGENTO_PATH_TO_NAVBAR_SLUG[leaf.replace(/[^a-z0-9]+/g, '-')];
        if (mapped) {
          resolved.add(mapped);
          const parent = LEAF_TO_PARENT_MAP[mapped];
          if (parent) resolved.add(parent);
        }
      }
    }
  }

  // 3. Title-based safeguard for ambiguous items
  const nameLower = (product.name || '').toLowerCase();
  if (nameLower.includes('hydration')) {
    resolved.add('hydration-bag');
    resolved.add('motorcycle-bags-bike-luggage');
  }

  return [...resolved];
}
