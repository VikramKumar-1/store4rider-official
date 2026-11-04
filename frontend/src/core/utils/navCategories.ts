import { DEFAULT_NAV_ITEMS } from "@/modules/homepage/components/navbar/nav.constants";

export interface IStoreCategoryNode {
  _id: string;
  id: string;
  name: string;
  slug: string;
  linkUrl: string;
  parentId?: string;
  image?: string;
  groupName?: string;
  children?: IStoreCategoryNode[];
}

/**
 * Authoritative mapping of Core Product Catalog Parents
 * Filters out non-catalog sections like "Shop By Brand" and "Guides".
 */
const CORE_PRODUCT_PARENTS: Record<string, { name: string; slug: string; linkUrl: string }> = {
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
    linkUrl: "/spares",
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
 * Set of legacy Magento categories that are NOT part of the storefront menu / taxonomy.
 * These were imported from legacy CSVs (standalone model names, duplicate slugs, legacy sale/merchandise buckets).
 * Excluded from the default Admin Category and Filter views so the admin panel strictly mirrors
 * the official store menu and submenus (+ newly created categories).
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
  "premium-full-face-helmets",
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

/**
 * Returns the authoritative Store Category Tree strictly based on the
 * official Storefront Navigation taxonomy (Helmets, Riding Gear, Luggage, etc.)
 * with their organized subcategories.
 * 
 * Prevents legacy Magento database categories from polluting the top-level parent list.
 * 
 * @param dbCategories Raw category records from database (only admin-created categories are merged).
 */
export function getStoreNavbarCategoryTree(dbCategories: any[] = []): IStoreCategoryNode[] {
  const seenSlugs = new Set<string>();

  // 1. Build authoritative tree from Storefront Navbar Product Categories
  const tree: IStoreCategoryNode[] = DEFAULT_NAV_ITEMS
    .filter((nav) => Boolean(CORE_PRODUCT_PARENTS[nav.id]))
    .map((nav) => {
      const config = CORE_PRODUCT_PARENTS[nav.id];
      const parentSlug = config.slug;
      seenSlugs.add(parentSlug);
      seenSlugs.add(nav.id);

      const subcategoryNodes: IStoreCategoryNode[] = [];

      if (nav.megaMenuItems) {
        nav.megaMenuItems.forEach((section) => {
          section.items.forEach((item) => {
            const pathParts = item.href.replace(/^\//, "").split("?")[0].split("/").filter(Boolean);
            const leafSlug = pathParts[pathParts.length - 1] || item.href;
            const fullSlug = pathParts.join("/");

            if (!seenSlugs.has(fullSlug) && !seenSlugs.has(leafSlug)) {
              seenSlugs.add(fullSlug);
              seenSlugs.add(leafSlug);
              subcategoryNodes.push({
                _id: leafSlug,
                id: leafSlug,
                name: item.label,
                slug: fullSlug,
                linkUrl: item.href,
                parentId: nav.id,
                image: item.logoUrl,
                groupName: section.group || undefined,
              });
            }
          });
        });
      }

      return {
        _id: nav.id,
        id: nav.id,
        name: config.name,
        slug: parentSlug,
        linkUrl: config.linkUrl,
        children: subcategoryNodes,
      };
    });

  // 2. Dynamically merge ONLY newly created custom categories from admin
  if (Array.isArray(dbCategories) && dbCategories.length > 0) {
    dbCategories.forEach((dbCat) => {
      const dbSlug = dbCat.slug || String(dbCat._id || "");
      if (!dbSlug || seenSlugs.has(dbSlug)) return;

      // Case A: Custom Subcategory created under an existing parent
      if (dbCat.parentId) {
        const pId = String(dbCat.parentId).toLowerCase();
        for (const parent of tree) {
          if (
            parent.id.toLowerCase() === pId ||
            parent._id.toLowerCase() === pId ||
            parent.slug.toLowerCase() === pId
          ) {
            parent.children = parent.children || [];
            parent.children.push({
              _id: String(dbCat._id || dbSlug),
              id: String(dbCat._id || dbSlug),
              name: dbCat.name,
              slug: dbSlug,
              linkUrl: `/${parent.slug}/${dbSlug}`,
              parentId: parent.id,
              image: dbCat.image,
            });
            seenSlugs.add(dbSlug);
            break;
          }
        }
      }

      // Case B: Explicit custom Root Parent category created by Admin
      if (!dbCat.parentId && dbCat.menuGroup === "admin-custom") {
        tree.push({
          _id: String(dbCat._id || dbSlug),
          id: String(dbCat._id || dbSlug),
          name: dbCat.name,
          slug: dbSlug,
          linkUrl: `/${dbSlug}`,
          children: [],
        });
        seenSlugs.add(dbSlug);
      }
    });
  }

  return tree;
}
