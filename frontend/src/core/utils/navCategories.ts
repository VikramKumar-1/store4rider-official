import { DEFAULT_NAV_ITEMS } from "@/modules/homepage/components/navbar/nav.constants";

export interface IStoreCategoryNode {
  _id: string;
  id: string;
  name: string;
  slug: string;
  linkUrl: string;
  parentId?: string;
  image?: string;
  bannerImage?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  videoUrl?: string;
  groupName?: string;
  badge?: string;
  badgeColor?: string;
  attributeSetCode?: string;
  hsnCode?: string;
  taxClassName?: string;
  weightUnit?: "kg" | "g" | "ml" | "L";
  sizeChart?: string;
  specDefinitions?: any[];
  faqs?: any[];
  heroCategoryIds?: string[];
  includeInMenu?: boolean;
  menuGroup?: string;
  menuLabel?: string;
  menuNavSection?: string;
  children?: IStoreCategoryNode[];
  hasDbRecord?: boolean;
  isCustom?: boolean;
}

/**
 * Authoritative mapping of Core Product Catalog Parents
 * Strictly filters out non-catalog sections like "Shop By Brand" and "Guides".
 */
export const CORE_PRODUCT_PARENTS: Record<string, { name: string; slug: string; linkUrl: string }> = {
  helmets: {
    name: "Motorcycle Helmets",
    slug: "motorcycle-helmets",
    linkUrl: "/motorcycle-helmets",
  },
  "riding-gear": {
    name: "Riding Gear",
    slug: "riding-gear",
    linkUrl: "/riding-gear",
  },
  luggage: {
    name: "Luggage & Bags",
    slug: "motorcycle-bags-bike-luggage",
    linkUrl: "/motorcycle-bags-bike-luggage",
  },
  accessories: {
    name: "Bike Accessories",
    slug: "motorcycle-accessories-online",
    linkUrl: "/motorcycle-accessories-online",
  },
  spares: {
    name: "Spares & Parts",
    slug: "spares",
    linkUrl: "/bike-spares",
  },
  exhausts: {
    name: "Exhausts",
    slug: "exhausts",
    linkUrl: "/exhausts",
  },
  gadgets: {
    name: "Gadgets",
    slug: "gadgets",
    linkUrl: "/gadgets",
  },
};

/**
 * Comprehensive mapping of category slug aliases to bridge legacy/imported database slugs
 * with the official Storefront Navbar and Submenu taxonomy.
 */
export const CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  // Helmets
  "motorcycle-helmets": ["motorcycle-helmets", "helmets"],
  "full-face-helmets": ["full-face-helmets", "full-face-helmet", "full-face"],
  "modular-helmets": ["modular-helmets", "modular-helmets-flip-up-helmets", "modular-flip-up", "modular-helmet"],
  "off-road-helmets": ["off-road-helmets", "off-road-helmets-motocross-helmet", "motocross-helmet", "off-road-helmet", "motocross-helmets"],
  "open-face-helmets": ["open-face-helmets", "half-face-helmets", "open-face", "open-face-helmet", "half-face-helmet"],
  "helmet-accessories": ["helmet-accessories", "helmet-accessories-helmet-visors", "helmet-visors", "visors", "visor"],
  "balaclava": ["balaclava", "face-mask", "head-mask"],
  "bluetooth-intercoms": ["bluetooth-intercoms", "communicators", "communicator", "intercom", "bluetooth"],
  "helmet-cleaners": ["helmet-cleaners", "helmet-cleaner", "motorcycle-care", "cleaner"],

  // Riding Gear
  "riding-gear": ["riding-gear"],
  "riding-gloves": ["riding-gloves", "riding-gloves-biker-gloves", "motorcycle-riding-gloves", "gloves", "biker-gloves"],
  "full-gauntlet-gloves": ["full-gauntlet-gloves", "premium-full-gauntlet-riding-gloves"],
  "semi-gauntlet-gloves": ["semi-gauntlet-gloves", "semi-gauntlet-bike-riding-gloves", "semi-gauntlet"],
  "short-motorbike-gloves": ["short-motorbike-gloves", "short-cuff-biker-gloves", "short-cuff-biker-glove"],
  "riding-jackets": ["riding-jackets", "riding-jacket", "riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets", "motorcycle-jackets"],
  "protectors-armour": ["protectors-armour", "protectors", "armour", "armor"],
  "riding-pants": ["riding-pants", "touring-pants", "touring-pant"],
  "motorcycle-riding-jeans": ["motorcycle-riding-jeans", "riding-jeans", "riding-jean"],
  "touring-pants": ["touring-pants", "touring-pant"],
  "knee-guards-bikers": ["knee-guards-bikers", "knee-guards-for-bikers", "knee-guard", "knee-guards"],
  "motorcycle-riding-boots": ["motorcycle-riding-boots", "riding-boots"],
  "short-biking-boots": ["short-biking-boots", "short-city-riding-biking-boots", "short-biking-boot"],
  "sports-riding-shoes": ["sports-riding-shoes", "sport-riding-shoes", "sport-riding-shoe"],
  "off-road-riding-boots": ["off-road-riding-boots", "off-road-boots", "off-road-riding-boots-motocross-boots", "motocross-boots"],
  "touring-gear": ["touring-gear", "touring-gears"],
  "monsoon-gear-for-riders": ["monsoon-gear-for-riders", "monsoon-gear", "monsoon-gear-for-rider"],
  "riding-gear-for-women": ["riding-gear-for-women", "women-riding-gear"],
  "off-road-motocross-riding-gear": ["off-road-motocross-riding-gear", "off-road-motocross"],

  // Luggage
  "motorcycle-bags-bike-luggage": ["motorcycle-bags-bike-luggage", "motorcycle-bags", "bike-luggage", "luggage"],
  "tank-bags-bikes": ["tank-bags-bikes", "tank-bags", "tank-bags-for-bike"],
  "saddle-bags-bikes": ["saddle-bags-bikes", "saddle-bags", "saddle-bags-for-bikes-panniers"],
  "motorcycle-tail-bags": ["motorcycle-tail-bags", "tail-bags"],
  "bike-top-box": ["bike-top-box", "top-box", "top-boxes", "top-case"],
  "crash-bar-bags": ["crash-bar-bags", "crash-bar-bag", "frame-bags"],
  "thigh-bags": ["thigh-bags", "thigh-bag", "thigh-pouch"],
  "helmet-bags": ["helmet-bags", "helmet-bag"],
  "hydration-bag": ["hydration-bag", "hydration-bags"],
  "motorcycle-other-luggage": ["motorcycle-other-luggage", "other-luggage", "other-luggages"],

  // Accessories
  "motorcycle-accessories-online": ["motorcycle-accessories-online", "motorcycle-accessories", "accessories", "bike-accessories"],
  "bike-auxiliary-lights-filters-flashers": ["bike-auxiliary-lights-filters-flashers", "auxiliary-lights-filters-flashers"],
  "bike-auxiliary-lights": ["bike-auxiliary-lights", "auxiliary-lights", "auxiliary-light"],
  "auxiliary-light-filters": ["auxiliary-light-filters", "auxiliary-light-filter"],
  "bike-auxiliary-light-clamps-mounts": ["bike-auxiliary-light-clamps-mounts", "clamps-and-mounts-for-lights"],
  "auxiliary-light-wiring-harness-switch": ["auxiliary-light-wiring-harness-switch", "auxiliary-light-wiring-harness-and-switch"],
  "off-beat-motorcycle-accessories": ["off-beat-motorcycle-accessories", "off-beat-accessories"],
  "performance-parts": ["performance-parts"],
  "rally-tower": ["rally-tower", "rally-towers-navigation-tower"],
  "bike-covers": ["bike-covers", "bike-cover"],
  "chain-care": ["chain-care"],

  // Spares
  "spares": ["spares", "bike-spares"],
  "chain-sprocket-kits": ["chain-sprocket-kits", "chain-sprockets", "sprockets"],
  "iridium-spark-plug": ["iridium-spark-plug", "spark-plugs", "spark-plug"],
  "performance-air-filter-bike": ["performance-air-filter-bike", "performance-air-filters", "air-filter"],
  "brake-pads": ["brake-pads", "brake-pad"],

  // Exhausts
  "exhausts": ["exhausts", "exhaust"],

  // Gadgets
  "gadgets": ["gadgets"],
  "bike-phone-holders": ["bike-phone-holders", "phone-holders", "mobile-holder"],
  "communicators": ["communicators", "communicator", "bluetooth-intercoms", "intercom"],
  "action-cameras": ["action-cameras", "action-camera"],

  // Merchandise
  "biker-t-shirts-motorcycle-t-shirts": ["biker-t-shirts-motorcycle-t-shirts", "biker-t-shirts", "motorcycle-t-shirts"],
  "keychains-for-bike": ["keychains-for-bike", "biker-key-chain", "keychains"],
};

/**
 * Set of legacy Magento categories that are NOT part of the storefront menu / taxonomy.
 */
export const LEGACY_NON_MENU_SLUGS = new Set<string>([
  "helmets",
  "saddle-bags-for-bikes-panniers",
  "tank-bags-for-bike",
  "other-luggage",
  "hydration-bags",
  "saddle-stay-crash-guard-leg-guard",
  "riding-jackets-bike-jackets",
  "riding-jackets-motorcycle-jackets",
  "knee-guards-for-bikers",
  "riding-jeans",
  "racing-suits",
  "sport-riding-shoes",
  "premium-riding-boots",
  "off-road-riding-boots-motocross-boots",
  "short-city-riding-biking-boots",
  "riding-gloves-biker-gloves",
  "short-cuff-biker-gloves",
  "premium-full-gauntlet-riding-gloves",
  "semi-gauntlet-bike-riding-gloves",
  "rynox-riding-jacket",
  "rynox-saddle-bags",
  "tank-bags",
  "rynox-tail-bags",
  "rynox-tank-bags",
  "helmet-accessories-helmet-visors",
  "full-face-helmet",
  "off-road-helmets-motocross-helmet",
  "smk-glide-modular-helmet",
  "smk-twister-helmet",
  "smk-stellar-helmet",
  "sale",
  "women-riding-gear",
  "merchandise",
  "biker-t-shirts-motorcycle-t-shirts",
  "protectors",
  "radiator-guard",
  "bike-auxiliary-light-clamps-and-mounts",
  "auxiliary-light-wiring-harness-and-switch",
  "off-beat-bike-accessories-online",
  "bike-phone-holders-mobile-holder-for-bike",
  "smk-hybrid-evo-helmet",
  "royal-enfield-himalayan-accessories",
  "smk-titan-carbon-fibre-helmets",
  "axor-apex-helmet-sport-touring-performance",
  "certified-safety",
  "axor-stealth-motorcycle-helmet",
  "axor-retro-helmets",
  "oils-lubes",
  "motorcycle-care",
  "axor-street-helmets",
  "performance-air-filters-for-bikes",
  "smk-gullwing-helmets",
  "smk-typhoon-helmets",
]);

export function isLegacyNonMenuCategory(slug?: string): boolean {
  if (!slug) return false;
  return LEGACY_NON_MENU_SLUGS.has(slug.toLowerCase().trim());
}

export function isCanonicalMenuAlias(slug?: string): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(CATEGORY_SLUG_ALIASES)) {
    if (canonical.toLowerCase() !== s && aliases.map((a) => a.toLowerCase()).includes(s)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the authoritative Store Category Tree strictly based on the
 * official Storefront Navigation taxonomy (Helmets, Riding Gear, Luggage, etc.)
 * with their organized subcategories and groups.
 * 
 * Merges matching database category documents to populate real ObjectIds, images,
 * SEO metadata, FAQs, and blueprints.
 * 
 * Also dynamically attaches custom categories created by the admin in the database.
 * 
 * @param dbCategories Raw category records from database.
 */
export function getStoreNavbarCategoryTree(dbCategories: any[] = []): IStoreCategoryNode[] {
  // 1. Flatten all DB categories for quick O(1) lookup
  const flatDbList: any[] = [];
  const traverseDb = (nodes: any[]) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      flatDbList.push(node);
      if (Array.isArray(node.children) && node.children.length > 0) {
        traverseDb(node.children);
      }
    }
  };
  traverseDb(dbCategories);

  const dbById = new Map<string, any>();
  const dbBySlug = new Map<string, any>();
  const dbByName = new Map<string, any>();

  flatDbList.forEach((cat) => {
    if (cat._id) dbById.set(String(cat._id), cat);
    if (cat.id) dbById.set(String(cat.id), cat);
    if (cat.slug) dbBySlug.set(String(cat.slug).toLowerCase().trim(), cat);
    if (cat.name) dbByName.set(String(cat.name).toLowerCase().trim(), cat);
  });

  const matchedDbIds = new Set<string>();

  const resolveDbCategory = (slug: string, name: string): any | null => {
    const cleanSlug = slug.toLowerCase().trim();
    const cleanName = name.toLowerCase().trim();
    const leafSlug = cleanSlug.split("/").filter(Boolean).pop() || cleanSlug;

    // 1. Direct slug match
    if (dbBySlug.has(cleanSlug)) return dbBySlug.get(cleanSlug);
    if (dbBySlug.has(leafSlug)) return dbBySlug.get(leafSlug);

    // 2. Alias match
    const aliases = CATEGORY_SLUG_ALIASES[leafSlug] || CATEGORY_SLUG_ALIASES[cleanSlug] || [];
    for (const alias of aliases) {
      const aliasClean = alias.toLowerCase().trim();
      if (dbBySlug.has(aliasClean)) return dbBySlug.get(aliasClean);
    }

    // 3. Exact name match
    if (dbByName.has(cleanName)) return dbByName.get(cleanName);

    return null;
  };

  const mergeDbProps = (node: Partial<IStoreCategoryNode>, dbDoc: any | null): IStoreCategoryNode => {
    if (dbDoc && dbDoc._id) {
      matchedDbIds.add(String(dbDoc._id));
    }
    return {
      _id: dbDoc?._id ? String(dbDoc._id) : node.slug || node.id || "",
      id: node.id || node.slug || "",
      name: node.name || dbDoc?.name || "",
      slug: node.slug || dbDoc?.slug || "",
      linkUrl: node.linkUrl || `/${node.slug}`,
      parentId: node.parentId || (dbDoc?.parentId ? String(dbDoc.parentId) : undefined),
      image: dbDoc?.image || node.image || "",
      bannerImage: dbDoc?.bannerImage || "",
      description: dbDoc?.description || "",
      metaTitle: dbDoc?.metaTitle || "",
      metaDescription: dbDoc?.metaDescription || "",
      metaKeywords: dbDoc?.metaKeywords || "",
      videoUrl: dbDoc?.videoUrl || "",
      groupName: node.groupName || dbDoc?.menuGroup || "",
      badge: dbDoc?.badge || "",
      badgeColor: dbDoc?.badgeColor || "",
      attributeSetCode: dbDoc?.attributeSetCode || "",
      hsnCode: dbDoc?.hsnCode || "",
      taxClassName: dbDoc?.taxClassName || "",
      weightUnit: dbDoc?.weightUnit || "kg",
      sizeChart: dbDoc?.sizeChart || "",
      specDefinitions: dbDoc?.specDefinitions || [],
      faqs: dbDoc?.faqs || [],
      heroCategoryIds: dbDoc?.heroCategoryIds || [],
      includeInMenu: dbDoc?.includeInMenu !== false,
      menuGroup: dbDoc?.menuGroup || node.groupName || "",
      menuLabel: dbDoc?.menuLabel || "",
      menuNavSection: dbDoc?.menuNavSection || "",
      children: node.children || [],
      hasDbRecord: Boolean(dbDoc && dbDoc._id),
      isCustom: Boolean(node.isCustom),
    };
  };

  const seenSlugs = new Set<string>();

  // 2. Build authoritative tree from Storefront Navbar Product Categories
  const tree: IStoreCategoryNode[] = DEFAULT_NAV_ITEMS
    .filter((nav) => Boolean(CORE_PRODUCT_PARENTS[nav.id]))
    .map((nav) => {
      const config = CORE_PRODUCT_PARENTS[nav.id];
      const parentSlug = config.slug;
      seenSlugs.add(parentSlug);
      seenSlugs.add(nav.id);

      const parentDbDoc = resolveDbCategory(parentSlug, config.name);

      const subcategoryNodes: IStoreCategoryNode[] = [];

      if (nav.megaMenuItems) {
        nav.megaMenuItems.forEach((section) => {
          // If section has groupHref, it forms a clickable group category (e.g. Riding Gloves, Riding Jackets, etc.)
          if (section.groupHref) {
            const groupSlug = section.groupHref.replace(/^\//, "").split("?")[0].split("/").filter(Boolean).pop() || section.groupHref;
            const groupDbDoc = resolveDbCategory(groupSlug, section.group);

            const groupChildNodes: IStoreCategoryNode[] = [];

            section.items.forEach((item) => {
              const pathParts = item.href.replace(/^\//, "").split("?")[0].split("/").filter(Boolean);
              const leafSlug = pathParts[pathParts.length - 1] || item.href;
              const fullSlug = pathParts.join("/");

              if (!seenSlugs.has(leafSlug) && !seenSlugs.has(fullSlug)) {
                seenSlugs.add(leafSlug);
                seenSlugs.add(fullSlug);
                const itemDbDoc = resolveDbCategory(leafSlug, item.label);
                groupChildNodes.push(
                  mergeDbProps(
                    {
                      id: leafSlug,
                      name: item.label,
                      slug: leafSlug,
                      linkUrl: item.href,
                      parentId: groupDbDoc?._id ? String(groupDbDoc._id) : groupSlug,
                      image: item.logoUrl,
                      groupName: section.group || undefined,
                      children: [],
                    },
                    itemDbDoc
                  )
                );
              }
            });

            if (!seenSlugs.has(groupSlug)) {
              seenSlugs.add(groupSlug);
              subcategoryNodes.push(
                mergeDbProps(
                  {
                    id: groupSlug,
                    name: section.group,
                    slug: groupSlug,
                    linkUrl: section.groupHref,
                    parentId: parentDbDoc?._id ? String(parentDbDoc._id) : nav.id,
                    children: groupChildNodes,
                  },
                  groupDbDoc
                )
              );
            }
          } else {
            // Flat group (e.g. Types, Accessories & Care, Touring Bags, etc.)
            section.items.forEach((item) => {
              const pathParts = item.href.replace(/^\//, "").split("?")[0].split("/").filter(Boolean);
              const leafSlug = pathParts[pathParts.length - 1] || item.href;
              const fullSlug = pathParts.join("/");

              if (!seenSlugs.has(leafSlug) && !seenSlugs.has(fullSlug)) {
                seenSlugs.add(leafSlug);
                seenSlugs.add(fullSlug);
                const itemDbDoc = resolveDbCategory(leafSlug, item.label);
                subcategoryNodes.push(
                  mergeDbProps(
                    {
                      id: leafSlug,
                      name: item.label,
                      slug: leafSlug,
                      linkUrl: item.href,
                      parentId: parentDbDoc?._id ? String(parentDbDoc._id) : nav.id,
                      image: item.logoUrl,
                      groupName: section.group || undefined,
                      children: [],
                    },
                    itemDbDoc
                  )
                );
              }
            });
          }
        });
      }

      return mergeDbProps(
        {
          id: nav.id,
          name: config.name,
          slug: parentSlug,
          linkUrl: config.linkUrl,
          children: subcategoryNodes,
        },
        parentDbDoc
      );
    });

  // 3. Dynamically merge custom categories created by admin in MongoDB
  if (flatDbList.length > 0) {
    flatDbList.forEach((dbCat) => {
      const dbId = String(dbCat._id || "");
      if (!dbId || matchedDbIds.has(dbId)) return;

      const dbSlug = dbCat.slug || dbId;
      // Skip duplicate aliases of existing menu items (e.g. "full-face-helmet", "helmets", "riding-jacket")
      if (seenSlugs.has(dbSlug) || isCanonicalMenuAlias(dbSlug)) return;

      // Case A: Custom Subcategory created under an existing parent or group
      if (dbCat.parentId) {
        const pId = String(dbCat.parentId).toLowerCase();

        const attachToParent = (nodes: IStoreCategoryNode[]): boolean => {
          for (const node of nodes) {
            if (
              String(node._id).toLowerCase() === pId ||
              String(node.id).toLowerCase() === pId ||
              String(node.slug).toLowerCase() === pId
            ) {
              node.children = node.children || [];
              node.children.push(
                mergeDbProps(
                  {
                    id: dbSlug,
                    name: dbCat.name,
                    slug: dbSlug,
                    linkUrl: `/${node.slug}/${dbSlug}`,
                    parentId: node._id || node.id,
                    children: [],
                    isCustom: true,
                  },
                  dbCat
                )
              );
              matchedDbIds.add(dbId);
              seenSlugs.add(dbSlug);
              return true;
            }
            if (node.children && node.children.length > 0) {
              if (attachToParent(node.children)) return true;
            }
          }
          return false;
        };

        attachToParent(tree);
      } else if (dbCat.menuGroup === "admin-custom") {
        // Case B: Explicit custom Root Parent category created by Admin
        tree.push(
          mergeDbProps(
            {
              id: dbSlug,
              name: dbCat.name,
              slug: dbSlug,
              linkUrl: `/${dbSlug}`,
              children: [],
              isCustom: true,
            },
            dbCat
          )
        );
        matchedDbIds.add(dbId);
        seenSlugs.add(dbSlug);
      }
    });
  }

  return tree;
}

/**
 * Returns any database categories that are NOT mapped to the authoritative Storefront Menu.
 * Used for the secondary "Unmapped Legacy Categories" tab in AdminCategories.
 */
export function getUnmappedLegacyCategories(
  dbCategories: any[] = [],
  menuTree: IStoreCategoryNode[] = []
): any[] {
  const menuSlugs = new Set<string>();
  const menuIds = new Set<string>();

  const collectMenuKeys = (nodes: IStoreCategoryNode[]) => {
    for (const n of nodes) {
      if (n.slug) menuSlugs.add(n.slug.toLowerCase().trim());
      if (n._id) menuIds.add(String(n._id));
      if (n.id) menuIds.add(String(n.id).toLowerCase().trim());
      if (n.children && n.children.length > 0) {
        collectMenuKeys(n.children);
      }
    }
  };

  collectMenuKeys(menuTree);

  const flatList: any[] = [];
  const traverseDb = (nodes: any[], depth = 0) => {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      flatList.push({ ...n, depth });
      if (Array.isArray(n.children) && n.children.length > 0) {
        traverseDb(n.children, depth + 1);
      }
    }
  };
  traverseDb(dbCategories);

  return flatList.filter((cat) => {
    const slug = (cat.slug || "").toLowerCase().trim();
    const id = String(cat._id || "");
    return !menuSlugs.has(slug) && !menuIds.has(id);
  });
}
