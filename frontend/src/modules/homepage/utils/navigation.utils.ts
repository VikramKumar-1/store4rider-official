import { ICategoryTree } from "@/core/hooks/useCategories";
import { IBrand } from "@store4riders/shared-types";
import { NavItem } from "../../types/homepage.types";

export const generateNavItems = (categories: ICategoryTree[], brands: IBrand[]): NavItem[] => {
  const navItems: NavItem[] = [];

  // Sort categories just in case
  const sortedCategories = [...(categories || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  sortedCategories.forEach((category) => {
    // Only top level categories
    const navItem: NavItem = {
      id: category.slug,
      label: category.name,
      href: `/${category.slug}`,
      hasDropdown: category.children && category.children.length > 0,
    };

    if (category.children && category.children.length > 0) {
      navItem.megaMenuItems = category.children.map((child) => ({
        group: child.name,
        items: child.children 
          ? child.children.map((grandchild) => ({
              label: grandchild.name,
              href: `/${category.slug}/${child.slug}/${grandchild.slug}`, // Full hierarchical path
            }))
          : [],
      }));
    }

    navItems.push(navItem);
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
          logoUrl: b.logoUrl || undefined, // Or use actual property
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
