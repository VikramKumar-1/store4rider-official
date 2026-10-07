import { ICategoryTree } from "@/core/hooks/useCategories";
import { IBrand } from "@store4riders/shared-types";
import { NavItem } from "../types/homepage.types";

export const generateNavItems = (categories: ICategoryTree[], brands: IBrand[]): NavItem[] => {
  const navItems: NavItem[] = [];

  // Map all root categories from the database directly
  const sortedCategories = [...(categories || [])];

  sortedCategories.forEach((category) => {
    // Only top level categories
    const navItem: NavItem = {
      id: category.slug,
      label: category.name,
      href: `/${category.slug}`,
      hasDropdown: category.children && category.children.length > 0,
    };

    if (category.children && category.children.length > 0) {
      // Check if any child has grandchildren (3-level hierarchy)
      const hasGrandchildren = category.children.some(c => c.children && c.children.length > 0);

      if (hasGrandchildren) {
        // 3-level hierarchy: map children to groups, grandchildren to items
        navItem.megaMenuItems = category.children.map((child) => ({
          group: child.name,
          groupHref: `/${category.slug}/${child.slug}`,
          items: [
            { label: `All`, href: `/${category.slug}/${child.slug}` },
            ...(child.children 
              ? child.children.map((grandchild) => ({
                  label: grandchild.name,
                  href: `/${category.slug}/${child.slug}/${grandchild.slug}`,
                }))
              : [])
          ],
        }));
      } else {
        // 2-level hierarchy: chunk children into columns (e.g., 6 per column)
        const CHUNK_SIZE = 6;
        const columns = [];
        for (let i = 0; i < category.children.length; i += CHUNK_SIZE) {
          columns.push(category.children.slice(i, i + CHUNK_SIZE));
        }

        navItem.megaMenuItems = columns.map((col, idx) => ({
          group: idx === 0 ? "Categories" : "More Categories",
          items: [
            ...(idx === 0 ? [{ label: `All`, href: `/${category.slug}` }] : []),
            ...col.map((child) => ({
              label: child.name,
              href: `/${category.slug}/${child.slug}`,
            }))
          ],
        }));
      }
    }

    navItems.push(navItem);
  });

  // Inject Custom Hardcoded Categories like "Spares"
  navItems.push({
    id: "spares",
    label: "Spares",
    href: "/spares",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Spares & Parts",
        groupHref: "/spares",
        items: [
          { label: "All", href: "/spares" },
          { label: "Chain Sprocket Kits", href: "/spares/chain-sprocket-kits" },
          { label: "Iridium Spark Plugs", href: "/spares/iridium-spark-plugs" },
          { label: "Performance Air Filters", href: "/spares/performance-air-filters" },
          { label: "Brake Pads", href: "/spares/brake-pads" },
        ],
      },
    ],
  });

  // Shop By Brand
  if (brands && brands.length > 0) {
    // Basic chunking logic for brands (e.g. 9 per group)
    const brandGroups = [];
    for (let i = 0; i < brands.length; i += 9) {
      brandGroups.push(brands.slice(i, i + 9));
    }
    
    navItems.push({
      id: "shop-by-brand",
      label: "Shop By Brand",
      href: "/products",
      hasDropdown: true,
      megaMenuItems: brandGroups.map((group, index) => ({
        group: `Brands Part ${index + 1}`,
        items: group.map((b) => ({
          label: b.name,
          href: `/products?brand=${b.slug}`,
          logoUrl: (b as any).logoUrl || undefined,
        })),
      })),
    });
  }

  // Deals / Sale
  navItems.push({
    id: "deals",
    label: "Deals",
    href: "/sale",
    hasDropdown: false,
  });

  return navItems;
};
