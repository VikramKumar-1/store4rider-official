import { ICategoryTree } from "@/core/hooks/useCategories";
import { IBrand } from "@store4riders/shared-types";
import { NavItem } from "../types/homepage.types";

export const generateNavItems = (categories: ICategoryTree[], brands: IBrand[]): NavItem[] => {
  const navItems: NavItem[] = [];

  // Map all root categories from the database directly (respecting includeInMenu)
  const sortedCategories = (categories || []).filter((c: any) => c.includeInMenu !== false);

  sortedCategories.forEach((category) => {
    // Only visible child categories
    const visibleChildren = (category.children || []).filter((c: any) => c.includeInMenu !== false);

    const navItem: NavItem = {
      id: category.slug,
      label: category.name,
      href: `/${category.slug}`,
      hasDropdown: visibleChildren.length > 0,
    };

    if (visibleChildren.length > 0) {
      // Check if any child has grandchildren (3-level hierarchy)
      const hasGrandchildren = visibleChildren.some((c: any) => c.children && c.children.some((gc: any) => gc.includeInMenu !== false));

      if (hasGrandchildren) {
        // 3-level hierarchy: map children to groups, grandchildren to items
        navItem.megaMenuItems = visibleChildren.map((child: any) => {
          const visibleGrandchildren = (child.children || []).filter((gc: any) => gc.includeInMenu !== false);
          return {
            group: child.name,
            groupHref: `/${category.slug}/${child.slug}`,
            items: [
              { label: `All ${child.name}`, href: `/${category.slug}/${child.slug}` },
              ...visibleGrandchildren.map((grandchild: any) => ({
                label: grandchild.name,
                href: `/${category.slug}/${child.slug}/${grandchild.slug}`,
              })),
            ],
          };
        });
      } else {
        // Group by menuGroup if configured by admin, otherwise by columns
        const groupedMap: Record<string, any[]> = {};
        visibleChildren.forEach((child: any) => {
          const grp = child.menuGroup?.trim() || "Categories";
          if (!groupedMap[grp]) groupedMap[grp] = [];
          groupedMap[grp].push(child);
        });

        navItem.megaMenuItems = Object.entries(groupedMap).map(([groupName, items]) => ({
          group: groupName,
          items: items.map((child: any) => ({
            label: child.name,
            href: `/${category.slug}/${child.slug}`,
          })),
        }));
      }
    }

    navItems.push(navItem);
  });

  // Shop By Brand
  const menuBrands = (brands || []).filter((b) => b.isActive !== false && b.showInMenu !== false);
  if (menuBrands.length > 0) {
    const groupedBrands: Record<string, IBrand[]> = {};
    menuBrands.forEach((b) => {
      const groupName = b.menuGroup?.trim() || "Featured Brands";
      if (!groupedBrands[groupName]) {
        groupedBrands[groupName] = [];
      }
      groupedBrands[groupName].push(b);
    });

    const megaMenuItems = Object.entries(groupedBrands).map(([group, items]) => ({
      group,
      items: items.map((b) => ({
        label: b.name,
        href: `/products?brand=${b.slug}`,
        logoUrl: b.logo || (b as any).logoUrl || undefined,
      })),
    }));

    navItems.push({
      id: "shop-by-brand",
      label: "Shop By Brand",
      href: "/products",
      hasDropdown: true,
      megaMenuItems,
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
