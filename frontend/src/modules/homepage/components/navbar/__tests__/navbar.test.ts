import { describe, it, expect } from "vitest";
import { DEFAULT_NAV_ITEMS } from "../nav.constants";

describe("Navbar & Submenu Navigation Integrity Suite", () => {
  it("should have all primary navigation items defined with valid labels and hrefs", () => {
    expect(DEFAULT_NAV_ITEMS.length).toBeGreaterThanOrEqual(5);

    DEFAULT_NAV_ITEMS.forEach((item) => {
      // 1. Basic properties
      expect(item.id).toBeTruthy();
      expect(item.label.trim()).toBeTruthy();
      expect(item.href).toBeTruthy();
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.href).not.toContain(" ");
      expect(item.href).not.toBe("#");
    });
  });

  it("should have valid megaMenu structure with valid subcategories and links", () => {
    const itemsWithDropdown = DEFAULT_NAV_ITEMS.filter((item) => item.hasDropdown);
    expect(itemsWithDropdown.length).toBeGreaterThan(0);

    itemsWithDropdown.forEach((item) => {
      expect(item.megaMenuItems).toBeDefined();
      expect(Array.isArray(item.megaMenuItems)).toBe(true);
      expect(item.megaMenuItems!.length).toBeGreaterThan(0);

      item.megaMenuItems!.forEach((group) => {
        // Group items validation
        expect(Array.isArray(group.items)).toBe(true);
        expect(group.items.length).toBeGreaterThan(0);

        group.items.forEach((subItem) => {
          expect(subItem.label.trim()).toBeTruthy();
          expect(subItem.href.trim()).toBeTruthy();
          expect(subItem.href.startsWith("/")).toBe(true);
          expect(subItem.href).not.toContain(" ");
          expect(subItem.href).not.toBe("#");
        });
      });
    });
  });

  it("should have valid brand links in 'Shop By Brand' section", () => {
    const brandNav = DEFAULT_NAV_ITEMS.find((item) => item.id === "shop-by-brand");
    expect(brandNav).toBeDefined();
    expect(brandNav?.megaMenuItems).toBeDefined();

    const brandGroups = brandNav!.megaMenuItems!;
    expect(brandGroups.length).toBeGreaterThanOrEqual(3);

    const allBrands = brandGroups.flatMap((g) => g.items);
    expect(allBrands.length).toBeGreaterThanOrEqual(15);

    allBrands.forEach((brand) => {
      expect(brand.label).toBeTruthy();
      expect(brand.href).toMatch(/^\/products\?brand=|^(\/brands\/)/);
    });
  });

  it("should contain critical top categories (Helmets, Riding Gear, Luggage, Accessories)", () => {
    const itemIds = DEFAULT_NAV_ITEMS.map((item) => item.id);
    expect(itemIds).toContain("helmets");
    expect(itemIds).toContain("riding-gear");
    expect(itemIds).toContain("luggage");
    expect(itemIds).toContain("accessories");
  });
});
