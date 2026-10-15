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
  gadgets: {
    name: "Gadgets",
    slug: "gadgets",
    linkUrl: "/gadgets",
  },
};

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
