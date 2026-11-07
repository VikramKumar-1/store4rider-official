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
  "touring-gear": ["touring-gear", "touring-gears"],
  "monsoon-gear": ["monsoon-gear-for-riders", "monsoon-gear", "monsoon-gear-for-rider"],
  "monsoon-gear-for-riders": ["monsoon-gear-for-riders", "monsoon-gear", "monsoon-gear-for-rider"],

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
  "riding-boots": ["motorcycle-riding-boots", "premium-riding-boots", "short-biking-boots", "sports-riding-shoes"],
  "motorcycle-riding-boots": ["motorcycle-riding-boots", "premium-riding-boots", "riding-boots"],
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
  "crash-bar-bags": ["crash-bar-bags", "crash-bar-bag", "frame-bags"],
  "crash-bar-bag": ["crash-bar-bags", "crash-bar-bag", "frame-bags"],
  "thigh-bags": ["thigh-bags", "thigh-bag", "thigh-pouch"],
  "thigh-bag": ["thigh-bags", "thigh-bag", "thigh-pouch"],
  "helmet-bags": ["helmet-bags", "helmet-bag"],
  "helmet-bag": ["helmet-bags", "helmet-bag"],
  "other-luggage": ["other-luggage"],
  "motorcycle-other-luggage": ["other-luggage", "other-luggages", "motorcycle-other-luggage"],

  // ── Sale & Merchandise ──
  "sale": ["sale"],
  "merchandise": ["merchandise"],

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
  "gadgets": ["gadgets", "bike-phone-holders", "bike-phone-holders-mobile-holder-for-bike", "communicators", "bluetooth-intercoms"],
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

  // ── Exhausts ──
  "bike-exhausts": ["bike-exhausts", "bike-exhaust", "exhausts", "exhaust"],
  "bike-exhaust": ["bike-exhausts", "bike-exhaust", "exhausts", "exhaust"],
  "exhausts": ["bike-exhausts", "bike-exhaust", "exhausts", "exhaust"],
  "exhaust": ["bike-exhausts", "bike-exhaust", "exhausts", "exhaust"],
  "exauts": ["exhausts", "exhaust", "bike-exhausts"],
  "exaut": ["exhausts", "exhaust", "bike-exhausts"],
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
    "crash-bar-bags", "crash-bar-bag", "frame-bags",
    "thigh-bags", "thigh-bag", "thigh-pouch",
    "helmet-bags", "helmet-bag",
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
  EXHAUSTS: [
    "bike-exhausts", "bike-exhaust", "exhausts", "exhaust",
  ],
  GUARDS: [
    "knee-guards", "knee-guards-for-bikers", "knee-guards-bikers",
  ],
  DISCIPLINE: [
    "off-road-motocross", "off-road-motocross-riding-gear",
    "women-riding-gear", "riding-gear-for-women",
    "touring-gear", "monsoon-gear", "monsoon-gear-for-riders",
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
  "off-road-helmets": "off-road-helmets",
  "off-road-motocross": "off-road-motocross-riding-gear",
  "off-road-motocross-riding-gear": "off-road-motocross-riding-gear",
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
  "bike-top-box": "bike-top-box",
  "crash-bar-bags": "crash-bar-bags",
  "thigh-bags": "thigh-bags",
  "helmet-bags": "helmet-bags",
  "hydration-bag": "hydration-bag",
  "motorcycle-other-luggage": "other-luggage",
  "women-riding-gear": "riding-gear-for-women",
  "riding-gear-for-women": "riding-gear-for-women",
  "touring-gear": "touring-gear",
  "monsoon-gear": "monsoon-gear-for-riders",
  "monsoon-gear-for-riders": "monsoon-gear-for-riders",
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
  "bike-exhausts": "exhausts",
  "exhausts": "exhausts",
  "exauts": "exhausts",
  "exaut": "exhausts",
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
  "touring gear": "touring-gear",
  "monsoon gear": "monsoon-gear-for-riders",
  "monsoon gear for riders": "monsoon-gear-for-riders",

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
  "bike exhausts": "exhausts",
  "exhaust": "exhausts",
  "exhausts": "exhausts",
  "rally tower": "rally-tower",
  "rally towers / navigation tower": "rally-tower",
  "bike covers": "bike-covers",
  "chain care": "chain-care",
  "motorcycle care": "chain-care",
  "bike phone holders": "bike-phone-holders",
  "mobile holder for bike": "bike-phone-holders",
  "gadgets": "gadgets",
  "action cameras": "motorcycle-accessories-online",
  "camera accessories": "motorcycle-accessories-online",

  // Spares
  "spares": "spares",
  "bike spare parts online": "spares",
  "bike spares": "spares",
  "chain sprocket kits": "chain-sprocket-kits",
  "chain/sprocket kits": "chain-sprocket-kits",
  "chain / sprocket kits": "chain-sprocket-kits",
  "chain-sprocket kits": "chain-sprocket-kits",
  "iridium spark plugs": "iridium-spark-plugs",
  "iridium spark plug": "iridium-spark-plugs",
  "performance air filters": "performance-air-filters",
  "performance air filters for bikes": "performance-air-filters",
  "brake pads": "brake-pads",
  "oils & lubes": "spares",
  "oils lubes": "spares",

  // Generic parent categories & additional CSV mappings
  "sale": "sale",
  "merchandise": "merchandise",
  "off road helmets / motocross helmet": "off-road-helmets",
  "modular helmets / flip up helmets": "modular-helmets",
  "helmets": "motorcycle-helmets",
  "motorcycle helmets": "motorcycle-helmets",
  "motorcycle-helmets": "motorcycle-helmets",
  "riding gear": "riding-gear",
  "riding-gear": "riding-gear",
  "luggage": "motorcycle-bags-bike-luggage",
  "motorcycle bags": "motorcycle-bags-bike-luggage",
  "bike luggage": "motorcycle-bags-bike-luggage",
  "motorcycle bags / bike luggage": "motorcycle-bags-bike-luggage",
  "motorcycle bags bike luggage": "motorcycle-bags-bike-luggage",
  "motorcycle-bags-bike-luggage": "motorcycle-bags-bike-luggage",
  "motorcycle rain gear for bikers": "monsoon-gear-for-riders",
  "rain gear": "monsoon-gear-for-riders",
  "off-road / motocross riding gear": "off-road-motocross-riding-gear",
  "off-road-motocross": "off-road-motocross-riding-gear",
  "motorcycle touring gear": "touring-gear",
  "motorcycle balaclavas": "balaclava",
  "thigh bags for motorcycle riders": "thigh-bags",
  "thigh bags": "thigh-bags",
  "thigh pouch": "thigh-bags",
  "crash bar bags for motorcycles": "crash-bar-bags",
  "crash bar bags": "crash-bar-bags",
  "frame bags for re himalayan": "crash-bar-bags",
  "rynox saddle bags": "saddle-bags-bikes",
  "rynox tail bags": "motorcycle-tail-bags",
  "rynox tank bags": "tank-bags-bikes",
  "bike top boxes / aluminium top box": "bike-top-box",
  "bike top boxes aluminium top box": "bike-top-box",
  "bike top boxes | aluminium top box": "bike-top-box",
  "top case": "bike-top-box",
  "biker t-shirts | motorcycle t shirts": "merchandise",
  "biker t-shirts motorcycle t shirts": "merchandise",
  "biker t-shirts": "merchandise",
  "biker t shirts": "merchandise",
  "keychains for bike": "merchandise",
  "keychains": "merchandise",
  "bandana / buff / face covering": "balaclava",
  "bandana buff face covering": "balaclava",
  "motorcycle base layers": "riding-gear",
  "base layers": "riding-gear",
  "royal enfield full face helmet": "full-face-helmets",
  "royal enfield open face helmet": "open-face-helmets",
  "royal enfield flip up helmets / re modular helmet": "modular-helmets",
  "royal enfield flip up helmets re modular helmet": "modular-helmets",
  "royal enfield helmets": "motorcycle-helmets",
  "axor retro helmets": "motorcycle-helmets",
  "axor street helmets": "full-face-helmets",
  "axor rage helmets": "full-face-helmets",
  "axor stealth motorcycle helmet": "full-face-helmets",
  "smk retro helmet": "motorcycle-helmets",
  "smk hybrid evo helmet": "off-road-helmets",
  "tvs xpod helmets": "motorcycle-helmets",
  "mt stinger helmet": "full-face-helmets",
  "mt revenge 2 helmet": "full-face-helmets",
  "mt mugello helmets": "full-face-helmets",
  "mt blade 2 helmets": "full-face-helmets",
  "mt thunder 3 helmets": "full-face-helmets",
  "mt targo helmet": "full-face-helmets",
  "mt rapide helmet": "full-face-helmets",
  "mt hummer helmets": "full-face-helmets",
  "helmet bags for bike riders": "helmet-bags",
  "helmet bags": "helmet-bags",
  "biker hoodies": "merchandise",
  "royal enfield himalayan accessories": "motorcycle-accessories-online",
};

/**
 * Parent slug lookup for each leaf category
 */
export const LEAF_TO_PARENT_MAP: Record<string, string> = {
  // Helmets
  "full-face-helmets": "motorcycle-helmets",
  "modular-helmets": "motorcycle-helmets",
  "modular-helmets-flip-up-helmets": "motorcycle-helmets",
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
  "touring-gear": "riding-gear",
  "monsoon-gear": "riding-gear",
  "monsoon-gear-for-riders": "riding-gear",

  // Luggage
  "tank-bags-bikes": "motorcycle-bags-bike-luggage",
  "saddle-bags-bikes": "motorcycle-bags-bike-luggage",
  "motorcycle-tail-bags": "motorcycle-bags-bike-luggage",
  "bike-top-box": "motorcycle-bags-bike-luggage",
  "crash-bar-bags": "motorcycle-bags-bike-luggage",
  "thigh-bags": "motorcycle-bags-bike-luggage",
  "helmet-bags": "motorcycle-bags-bike-luggage",
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
  "bike-phone-holders": "gadgets",
  "communicators": "gadgets",
  "merchandise": "motorcycle-accessories-online",
  "sale": "sale",

  // Spares
  "chain-sprocket-kits": "spares",
  "iridium-spark-plugs": "spares",
  "performance-air-filters": "spares",
  "brake-pads": "spares",
  "bike-exhausts": "exhausts",
  "exhausts": "exhausts",
  "exauts": "exhausts",
  "exaut": "exhausts",
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
  const n = (product.name || '').toLowerCase();
  const mc = (product.magentoCategories || '');

  // Flags for specific product nature
  const isHelmetAccessory =
    /\b(pinlock|pin-lock|visor\s*insert|lens\s*insert|antifog\s*insert)\b/i.test(n) ||
    /\b(pivot\s*kit|side\s*pivot|ratchet|visor\s*mechanism)\b/i.test(n) ||
    /\b(cheek\s*pad|cheek\s*padding|inner\s*liner|full\s*padding)\b/i.test(n) ||
    /\b(air\s*vent|chin\s*vent|breath\s*deflector|nose\s*deflector|chin\s*curtain|nose\s*guard)\b/i.test(n) ||
    /\b(spare\s*visor|replacement\s*visor)\b/i.test(n) ||
    /\bhelmet\s*visor\b/i.test(n) ||
    (/\bvisor\b/i.test(n) && !/\b(helmet|helmets)\b/i.test(n)) ||
    (/\bvisor\b/i.test(n) && /\b(for\s+\w+\s+helmets?|for\s+kre|for\s+sirius|for\s+titan|for\s+stellar|v12|v14|v09|v12\s*b)\b/i.test(n));

  const isCommunicator = /(bluetooth|intercom|communicator|headset|earphone)/i.test(n) && !/(mount|holder)/i.test(n) && !/smart\s*bluetooth\s*helmet|smart\s*helmet/i.test(n);
  const isHelmetBag = /(helmet\s*bag)/i.test(n) || /helmet bags/i.test(mc);
  const isActualHelmet = /\b(helmet|helmets)\b/i.test(n) && !isHelmetAccessory && !isCommunicator && !isHelmetBag;
  const isGoggles = /goggle/i.test(n);
  const isBalaclava = /balaclava/i.test(n);
  const isBikeGuard = /(headlight\s*protector|radiator\s*guard|engine\s*guard|crash\s*guard|heel\s*plate|handguard|bash\s*plate|sump\s*guard|brake\s*reservoir\s*guard|fork\s*guard|chain\s*guard|disc\s*guard|exhaust\s*guard|sensor\s*guard)/i.test(n);
  // Helmets must never be classified as rider armour (e.g. Axor XBHP Bionic Helmet)
  const isRiderArmour = /(chest\s*guard|chest\s*protector|back\s*protector|spine\s*protector|armour\s*insert|armor\s*insert|elbow\s*guard|bionic|protective\s*base\s*layer|hip\s*protector|shoulder\s*protector|knee\s*protector|armour\s*vest)/i.test(n) && !isBikeGuard && !/helmet/i.test(n);
  const isSocks = /socks?/i.test(n);
  const isTopBox = /(top\s*box|top\s*case)/i.test(n) || /bike top boxes/i.test(mc);
  const isSprocket = /sprocket/i.test(n) || /sprocket/i.test(mc);
  const isPhoneHolder = /(phone\s*holder|mobile\s*holder|mobile\s*mount|phone\s*mount|jaw-grip|claw)/i.test(n) && !isCommunicator;
  const isChainCare = /(chain\s*(lube|clean|cleaner|spray|brush|paste|wax)|(lube|clean|cleaner|spray|wax)\s*chain|bike\s*cleaner)/i.test(n);
  const isBungee = /(bungee|cargo\s*net|tie-down)/i.test(n);
  const isRallyTower = /rally\s*tower|navigation\s*tower/i.test(n);
  const isCrashBarBag = /(crash\s*bar\s*bag|frame\s*bag)/i.test(n) || /crash bar bags|frame bags/i.test(mc);
  const isThighBag = /(thigh\s*bag|thigh\s*pouch)/i.test(n) || /thigh bags/i.test(mc);

  // Helmet Subtype Flags
  const isModularHelmet = isActualHelmet && /(modular|flip\s*up)/i.test(n);
  const isOpenFaceHelmet = isActualHelmet && /(open\s*face|half\s*face|jet\b)/i.test(n);
  const isOffRoadHelmet = isActualHelmet && /(off\s*road|motocross|dirt\s*bike|allterra|x-cross)/i.test(n);
  const isFullFaceHelmet = isActualHelmet && (/full\s*face/i.test(n) || (!isModularHelmet && !isOpenFaceHelmet && !isOffRoadHelmet)) && !isBalaclava && !isGoggles;

  // Luggage Subtype Flags
  const isPureTankBag = /(tank\s*bag|tankbag)/i.test(n) && !/(tail\s*bag|hybrid)/i.test(n);
  const isPureTailBag = /(tail\s*bag|tailbag)/i.test(n) && !/(tank\s*bag|hybrid)/i.test(n);
  const isPureSaddleBag = /(saddle\s*bag|saddlebag|panniers?)/i.test(n) && !/(tail\s*bag|tank\s*bag)/i.test(n);
  const isHydration = /hydration/i.test(n);
  const isLuggageItem = isPureTankBag || isPureTailBag || isPureSaddleBag || isTopBox || isCrashBarBag || isThighBag || isHelmetBag || isHydration || isBungee || /(luggage|backpack|duffle|waist\s*pack|dry\s*bag)/i.test(n);

  const matchSegment = (seg: string): string | null => {
    if (!seg) return null;
    const clean = seg.toLowerCase().trim().replace(/\s+/g, ' ');
    const slug = clean.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return MAGENTO_PATH_TO_NAVBAR_SLUG[clean] ||
      MAGENTO_PATH_TO_NAVBAR_SLUG[slug] ||
      (NAVBAR_TO_DB_SLUG_MAP[clean] ? clean : null) ||
      (NAVBAR_TO_DB_SLUG_MAP[slug] ? slug : null);
  };

  const processCategoryPath = (rawPath: string) => {
    if (!rawPath) return;
    const protectedPath = rawPath.replace(/\\+\//g, '##ESCAPED_SLASH##');
    const segments = protectedPath
      .split('/')
      .map(s => s.replace(/##ESCAPED_SLASH##/g, ' / ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const isPathBikeAccessories = segments.some(s => /motorcycle accessories|bike accessories/i.test(s));

    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i].toLowerCase();
      if (/^(root|default category)/i.test(seg)) continue;

      // Handle Protectors ambiguity: bike protector vs rider protector
      if (seg === 'protectors') {
        if (isPathBikeAccessories || isBikeGuard) {
          resolved.add('motorcycle-accessories-online');
          break;
        } else if (isRiderArmour) {
          resolved.add('protectors-armour');
          resolved.add('riding-gear');
          break;
        }
      }

      // Handle Gadgets: don't map to phone holders blindly
      if (seg === 'gadgets') {
        resolved.add('gadgets');
        if (isCommunicator) {
          resolved.add('communicators');
          resolved.add('bluetooth-intercoms');
          resolved.delete('motorcycle-helmets');
        } else if (isPhoneHolder) {
          resolved.add('bike-phone-holders');
          resolved.add('motorcycle-accessories-online');
        }
        break;
      }

      // Handle Top Box segment
      if (seg.includes('top box') || seg.includes('top case') || seg.includes('top boxes')) {
        resolved.add('bike-top-box');
        resolved.add('motorcycle-bags-bike-luggage');
        break;
      }

      // Handle Sprocket segment
      if (seg.includes('sprocket')) {
        resolved.add('chain-sprocket-kits');
        resolved.add('spares');
        break;
      }

      const mapped = matchSegment(seg);
      if (mapped) {
        if ((isHelmetAccessory || isGoggles) && (mapped === 'full-face-helmets' || mapped === 'modular-helmets' || mapped === 'off-road-helmets' || mapped === 'open-face-helmets')) {
          resolved.add('helmet-accessories');
          resolved.add('motorcycle-helmets');
          break;
        }

        if (isSocks && (mapped === 'motorcycle-riding-boots' || mapped === 'short-biking-boots' || mapped === 'sports-riding-shoes' || mapped === 'off-road-riding-boots')) {
          resolved.add('monsoon-gear-for-riders');
          resolved.add('riding-gear');
          break;
        }

        if (isBikeGuard && (mapped === 'protectors-armour' || mapped === 'riding-gear')) {
          resolved.add('motorcycle-accessories-online');
          break;
        }

        // Do not add generic "saddle-bags-bikes" from "rynox saddle bags" if product is a tail bag or tank bag
        if (mapped === 'saddle-bags-bikes' && (isPureTankBag || isPureTailBag)) {
          break;
        }

        resolved.add(mapped);
        const parent = LEAF_TO_PARENT_MAP[mapped];
        if (parent) resolved.add(parent);
        break;
      }
    }
  };

  // 1. From raw magentoCategories CSV column
  if (product.magentoCategories && typeof product.magentoCategories === 'string') {
    const paths = product.magentoCategories.split(',').map(p => p.trim()).filter(Boolean);
    for (const catPath of paths) {
      processCategoryPath(catPath);
    }
  }

  // 2. Explicit safeguards based on validated product nature
  if (isHelmetAccessory) {
    resolved.add('helmet-accessories');
    resolved.delete('motorcycle-helmets');
    resolved.delete('full-face-helmets');
    resolved.delete('modular-helmets');
    resolved.delete('off-road-helmets');
    resolved.delete('open-face-helmets');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  if (isActualHelmet) {
    resolved.add('motorcycle-helmets');
    resolved.delete('helmet-accessories');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  if (isGoggles) {
    resolved.add('helmet-accessories');
    resolved.add('motorcycle-helmets');
    resolved.add('off-road-motocross-riding-gear');
    resolved.add('riding-gear');
    resolved.delete('off-road-helmets');
    resolved.delete('full-face-helmets');
  }

  if (isBalaclava) {
    resolved.add('balaclava');
    resolved.add('motorcycle-helmets');
  }

  if (isCommunicator) {
    resolved.add('communicators');
    resolved.add('bluetooth-intercoms');
    resolved.add('gadgets');
    resolved.delete('motorcycle-helmets');
    resolved.delete('full-face-helmets');
    resolved.delete('modular-helmets');
    resolved.delete('open-face-helmets');
    resolved.delete('off-road-helmets');
    resolved.delete('bike-phone-holders');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  if (isPhoneHolder) {
    resolved.add('bike-phone-holders');
    resolved.add('gadgets');
    resolved.add('motorcycle-accessories-online');
    resolved.delete('communicators');
    resolved.delete('bluetooth-intercoms');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  if (isTopBox) {
    resolved.add('bike-top-box');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('motorcycle-tail-bags');
    resolved.delete('saddle-bags-bikes');
    resolved.delete('tank-bags-bikes');
  }

  if (isSprocket) {
    resolved.add('chain-sprocket-kits');
    resolved.add('spares');
  }

  if (isBikeGuard) {
    resolved.add('motorcycle-accessories-online');
    resolved.delete('protectors-armour');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  if (isRiderArmour) {
    resolved.add('protectors-armour');
    resolved.add('riding-gear');
    resolved.delete('motorcycle-accessories-online');
  }

  if (isSocks) {
    resolved.add('monsoon-gear-for-riders');
    resolved.add('riding-gear');
    resolved.delete('motorcycle-riding-boots');
    resolved.delete('short-biking-boots');
    resolved.delete('sports-riding-shoes');
    resolved.delete('off-road-riding-boots');
  }

  if (isBungee) {
    resolved.delete('chain-care');
    resolved.add('motorcycle-other-luggage');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  if (isChainCare) {
    resolved.add('chain-care');
    resolved.add('motorcycle-accessories-online');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
    resolved.delete('spares');
  }

  if (isRallyTower) {
    resolved.add('rally-tower');
    resolved.add('motorcycle-accessories-online');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  if (isCrashBarBag) {
    resolved.add('crash-bar-bags');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('motorcycle-other-luggage');
  }

  if (isThighBag) {
    resolved.add('thigh-bags');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('motorcycle-other-luggage');
    resolved.delete('merchandise');
    resolved.delete('saddle-bags-bikes');
  }

  if (isHelmetBag) {
    resolved.add('helmet-bags');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('motorcycle-other-luggage');
    resolved.delete('motorcycle-helmets');
    resolved.delete('full-face-helmets');
    resolved.delete('modular-helmets');
    resolved.delete('open-face-helmets');
    resolved.delete('off-road-helmets');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  // 3. Strict Helmet Subtype Resolution
  if (isModularHelmet) {
    resolved.add('modular-helmets');
    resolved.add('motorcycle-helmets');
    resolved.delete('full-face-helmets');
    resolved.delete('open-face-helmets');
    resolved.delete('off-road-helmets');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  } else if (isOpenFaceHelmet) {
    resolved.add('open-face-helmets');
    resolved.add('motorcycle-helmets');
    resolved.delete('full-face-helmets');
    resolved.delete('modular-helmets');
    resolved.delete('off-road-helmets');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  } else if (isOffRoadHelmet) {
    resolved.add('off-road-helmets');
    resolved.add('motorcycle-helmets');
    resolved.delete('full-face-helmets');
    resolved.delete('modular-helmets');
    resolved.delete('open-face-helmets');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  } else if (isFullFaceHelmet) {
    resolved.add('full-face-helmets');
    resolved.add('motorcycle-helmets');
    resolved.delete('modular-helmets');
    resolved.delete('open-face-helmets');
    resolved.delete('off-road-helmets');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  // 4. Strict Luggage Subtype Resolution
  if (isPureTankBag) {
    resolved.add('tank-bags-bikes');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('saddle-bags-bikes');
    resolved.delete('motorcycle-tail-bags');
  }
  if (isPureTailBag) {
    resolved.add('motorcycle-tail-bags');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('saddle-bags-bikes');
    resolved.delete('tank-bags-bikes');
  }
  if (isPureSaddleBag) {
    resolved.add('saddle-bags-bikes');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('tank-bags-bikes');
    resolved.delete('motorcycle-tail-bags');
  }

  if (isHydration) {
    resolved.add('hydration-bag');
    resolved.add('motorcycle-bags-bike-luggage');
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
    resolved.delete('saddle-bags-bikes');
    resolved.delete('motorcycle-tail-bags');
    resolved.delete('tank-bags-bikes');
  }

  // Stacker / Modulayer / Dry bags / Duffles are universal/tail bag, never saddle bag
  if (/\b(stacker|modulayer|dry\s*bag|duffle|duffel)\b/i.test(n) && !/\bsaddle\b/i.test(n)) {
    resolved.delete('saddle-bags-bikes');
  }

  // Armour Inserts (Chest/Back/Shoulder/Elbow/Hip inserts) vs Jackets/Pants
  const isArmourInsert = /\b(back\s*protector|chest\s*protector|armour\s*insert|armor\s*insert|armour\s*pair|shoulder\s*armour|elbow\s*armour|hip\s*armour|hip\s*protector)\b/i.test(n) && !/\b(jacket|jacket-pair)\b/i.test(n);
  if (isArmourInsert) {
    resolved.delete('riding-jackets');
    resolved.delete('riding-jackets-bike-jackets');
    resolved.delete('riding-pants');
    resolved.delete('touring-pants');
    resolved.add('protectors-armour');
    resolved.add('riding-gear');
  }

  // Knee Guards vs Riding Pants
  const isKneeGuard = /\b(knee\s*guard|shin\s*guard|bionic\s*action\s*knee)\b/i.test(n);
  if (isKneeGuard) {
    resolved.delete('riding-pants');
    resolved.delete('motorcycle-riding-jeans');
    resolved.delete('touring-pants');
    resolved.add('knee-guards-bikers');
    resolved.add('riding-gear');
  }

  // Riding Pants / Jeans vs Knee Guards
  const isRidingPant = /\b(riding\s*pants?|touring\s*pants?|riding\s*jeans?|motorcycle\s*jeans?)\b/i.test(n) && !isKneeGuard && !isArmourInsert;
  if (isRidingPant) {
    resolved.delete('knee-guards-bikers');
  }

  // 5. Luggage items must NEVER be in Riding Gear
  if (isLuggageItem) {
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
    resolved.delete('riding-jackets');
    resolved.delete('riding-jackets-bike-jackets');
    resolved.delete('riding-gloves');
    resolved.delete('riding-gloves-biker-gloves');
    resolved.delete('motorcycle-riding-boots');
    resolved.delete('riding-pants');
    resolved.delete('protectors-armour');
  }

  // 6. Jackets / Vests must NEVER be in Luggage
  if (/(vest|jacket)/i.test(n) && !/(bag|backpack)/i.test(n)) {
    resolved.delete('motorcycle-bags-bike-luggage');
    resolved.delete('motorcycle-other-luggage');
  }

  // 7. Helmets must NEVER be in Riding Gear
  if (/helmet/i.test(n) && !isHelmetAccessory && !isBalaclava) {
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  // 8. Bandanas / Buffs / Face coverings must NEVER be in Riding Gear
  if (/\b(bandana|buff|face\s*covering)\b/i.test(n)) {
    resolved.delete('riding-gear');
    resolved.delete('touring-gear');
    resolved.delete('off-road-motocross-riding-gear');
    resolved.delete('off-road-motocross');
  }

  // Boot sub-classification for products with motorcycle-riding-boots
  if (resolved.has('motorcycle-riding-boots')) {
    if (n.includes('short') || n.includes('sneaker') || n.includes('urban') || n.includes('city') || n.includes('ankle')) {
      resolved.add('short-biking-boots');
    }
    if (n.includes('off-road') || n.includes('off road') || n.includes('motocross') || n.includes('mx') || n.includes('enduro') || n.includes('terrain') || n.includes('adventure')) {
      resolved.add('off-road-riding-boots');
    }
    if (n.includes('sport') || n.includes('racing') || n.includes('track') || n.includes('gp') || n.includes('speed')) {
      resolved.add('sports-riding-shoes');
    }
  }

  // Name-based category resolution fallback if no category matched
  if (resolved.size === 0) {
    if (n.includes('glove')) {
      resolved.add('riding-gloves');
      resolved.add('riding-gear');
    } else if (n.includes('boot') || n.includes('shoe')) {
      resolved.add('motorcycle-riding-boots');
      resolved.add('riding-gear');
    } else if (n.includes('pant') || n.includes('jean')) {
      resolved.add('riding-pants');
      resolved.add('riding-gear');
    } else if (n.includes('jacket') || n.includes('suit')) {
      resolved.add('riding-jackets');
      resolved.add('riding-gear');
    } else if (n.includes('helmet')) {
      resolved.add('motorcycle-helmets');
      resolved.add('full-face-helmets');
    } else if (n.includes('shad') || n.includes('bag') || n.includes('pannier') || n.includes('luggage')) {
      resolved.add('motorcycle-bags-bike-luggage');
    } else if (n.includes('mount') || n.includes('kit') || n.includes('guard')) {
      resolved.add('motorcycle-accessories-online');
    }
  }

  return [...resolved];
}
