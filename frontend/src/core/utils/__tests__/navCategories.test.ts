import { describe, it, expect } from "vitest";
import {
  getStoreNavbarCategoryTree,
  getUnmappedLegacyCategories,
  isLegacyNonMenuCategory,
  CORE_PRODUCT_PARENTS,
} from "../navCategories";

describe("navCategories Suite — Storefront Navbar & Admin Categories Tree", () => {
  it("strictly includes only the core catalog parent categories in the main tree", () => {
    const tree = getStoreNavbarCategoryTree([]);
    const parentSlugs = tree.map((p) => p.slug);

    // Main catalog categories
    expect(parentSlugs).toContain("motorcycle-helmets");
    expect(parentSlugs).toContain("riding-gear");
    expect(parentSlugs).toContain("motorcycle-bags-bike-luggage");
    expect(parentSlugs).toContain("motorcycle-accessories-online");
    expect(parentSlugs).toContain("spares");
    expect(parentSlugs).toContain("exhausts");
    expect(parentSlugs).toContain("gadgets");

    // Non-catalog categories (brands, guides) must NOT be in the catalog tree
    expect(parentSlugs).not.toContain("brands");
    expect(parentSlugs).not.toContain("guides");
  });

  it("builds the correct subcategory and group hierarchy matching the Storefront Navbar", () => {
    const tree = getStoreNavbarCategoryTree([]);

    // 1. Helmets
    const helmetsNode = tree.find((n) => n.slug === "motorcycle-helmets");
    expect(helmetsNode).toBeDefined();
    const helmetSubSlugs = helmetsNode?.children?.map((c) => c.slug);
    expect(helmetSubSlugs).toContain("full-face-helmets");
    expect(helmetSubSlugs).toContain("modular-helmets");
    expect(helmetSubSlugs).toContain("off-road-helmets");
    expect(helmetSubSlugs).toContain("open-face-helmets");
    expect(helmetSubSlugs).toContain("helmet-accessories");
    expect(helmetSubSlugs).toContain("bluetooth-intercoms");

    // 2. Riding Gear has groups and subcategories
    const ridingGearNode = tree.find((n) => n.slug === "riding-gear");
    expect(ridingGearNode).toBeDefined();
    const gearGroupSlugs = ridingGearNode?.children?.map((c) => c.slug);
    expect(gearGroupSlugs).toContain("riding-gloves");
    expect(gearGroupSlugs).toContain("riding-jackets");
    expect(gearGroupSlugs).toContain("riding-pants");
    expect(gearGroupSlugs).toContain("motorcycle-riding-boots");

    // Check nested glove items
    const glovesGroup = ridingGearNode?.children?.find((c) => c.slug === "riding-gloves");
    expect(glovesGroup).toBeDefined();
    const gloveChildSlugs = glovesGroup?.children?.map((c) => c.slug);
    expect(gloveChildSlugs).toContain("full-gauntlet-gloves");
    expect(gloveChildSlugs).toContain("semi-gauntlet-gloves");
    expect(gloveChildSlugs).toContain("short-motorbike-gloves");
  });

  it("merges database category properties (real _id, image, SEO metadata, FAQs) into matching nodes", () => {
    const mockDbCategories = [
      {
        _id: "672cb0a123456789abcdef01",
        name: "Motorcycle Helmets",
        slug: "helmets", // alias
        image: "https://s3.amazonaws.com/store4riders/helmets-cat.webp",
        metaTitle: "Buy Motorcycle Helmets Online",
        faqs: [{ question: "How to choose a helmet?", answer: "Measure your head." }],
      },
      {
        _id: "672cb0a123456789abcdef02",
        name: "Full Face Helmets",
        slug: "full-face-helmets",
        image: "https://s3.amazonaws.com/store4riders/full-face.webp",
        hsnCode: "6506",
        taxClassName: "Taxable Goods (GST 18%)",
      },
    ];

    const tree = getStoreNavbarCategoryTree(mockDbCategories);

    // Check parent merge
    const helmetsNode = tree.find((n) => n.slug === "motorcycle-helmets");
    expect(helmetsNode?._id).toBe("672cb0a123456789abcdef01");
    expect(helmetsNode?.image).toBe("https://s3.amazonaws.com/store4riders/helmets-cat.webp");
    expect(helmetsNode?.metaTitle).toBe("Buy Motorcycle Helmets Online");
    expect(helmetsNode?.faqs?.length).toBe(1);
    expect(helmetsNode?.hasDbRecord).toBe(true);

    // Check child merge
    const fullFaceNode = helmetsNode?.children?.find((c) => c.slug === "full-face-helmets");
    expect(fullFaceNode?._id).toBe("672cb0a123456789abcdef02");
    expect(fullFaceNode?.image).toBe("https://s3.amazonaws.com/store4riders/full-face.webp");
    expect(fullFaceNode?.hsnCode).toBe("6506");
    expect(fullFaceNode?.hasDbRecord).toBe(true);
  });

  it("attaches newly created custom subcategories under their parent", () => {
    const mockDbCategories = [
      {
        _id: "672cb0a123456789abcdef99",
        name: "Action Cameras & Accessories",
        slug: "action-cameras",
        parentId: "gadgets",
      },
    ];

    const tree = getStoreNavbarCategoryTree(mockDbCategories);
    const gadgetsNode = tree.find((n) => n.slug === "gadgets");
    expect(gadgetsNode).toBeDefined();

    const customChild = gadgetsNode?.children?.find((c) => c.slug === "action-cameras");
    expect(customChild).toBeDefined();
    expect(customChild?.name).toBe("Action Cameras & Accessories");
    expect(customChild?.isCustom).toBe(true);
  });

  it("correctly identifies unmapped legacy categories so they do not pollute the main menu tree", () => {
    const mockDbCategories = [
      {
        _id: "672cb0a123456789abcdef10",
        name: "SMK Stellar Helmet",
        slug: "smk-stellar-helmet",
      },
      {
        _id: "672cb0a123456789abcdef11",
        name: "Clearance Sale 2024",
        slug: "sale",
      },
      {
        _id: "672cb0a123456789abcdef12",
        name: "Full Face Helmets",
        slug: "full-face-helmets",
      },
    ];

    const tree = getStoreNavbarCategoryTree(mockDbCategories);
    const unmapped = getUnmappedLegacyCategories(mockDbCategories, tree);

    const unmappedSlugs = unmapped.map((c) => c.slug);
    expect(unmappedSlugs).toContain("smk-stellar-helmet");
    expect(unmappedSlugs).toContain("sale");
    // Full face helmet is in the main tree, so it must NOT be in unmapped
    expect(unmappedSlugs).not.toContain("full-face-helmets");
  });

  it("correctly nests SEO subcategories under Full Face Helmets without polluting unmapped list", () => {
    const fullFaceId = "6ac9de6835b1b42fa90ac6d3";
    const mockDbCategories = [
      {
        _id: fullFaceId,
        name: "Full Face Helmets",
        slug: "full-face-helmets",
      },
      {
        _id: "6aedbb838479a115cba9da95",
        name: "Full Face Helmets Under Rs.4000",
        slug: "helmets-below-rs-4000",
        parentId: fullFaceId,
        includeInMenu: false,
        menuGroup: "SEO / Price",
      },
      {
        _id: "6aedbb838479a115cba9da87",
        name: "Axor Apex Dual Visor Full Face Helmets",
        slug: "axor-apex-dual-visor-full-face-helmets",
        parentId: fullFaceId,
        includeInMenu: false,
        menuGroup: "SEO / Model",
      },
      {
        _id: "6ac49c25ed338a8e53f2e833",
        name: "Premium Full Face Helmets",
        slug: "premium-full-face-helmets",
        parentId: fullFaceId,
        includeInMenu: false,
        menuGroup: "SEO / Feature",
      },
    ];

    const tree = getStoreNavbarCategoryTree(mockDbCategories);
    const helmetsNode = tree.find((n) => n.slug === "motorcycle-helmets");
    expect(helmetsNode).toBeDefined();

    const fullFaceNode = helmetsNode?.children?.find((c) => c.slug === "full-face-helmets");
    expect(fullFaceNode).toBeDefined();
    expect(fullFaceNode?.children?.length).toBe(3);

    const childSlugs = fullFaceNode?.children?.map((c) => c.slug);
    expect(childSlugs).toContain("helmets-below-rs-4000");
    expect(childSlugs).toContain("axor-apex-dual-visor-full-face-helmets");
    expect(childSlugs).toContain("premium-full-face-helmets");

    // Must NOT be in unmapped
    const unmapped = getUnmappedLegacyCategories(mockDbCategories, tree);
    const unmappedSlugs = unmapped.map((c) => c.slug);
    expect(unmappedSlugs).not.toContain("helmets-below-rs-4000");
    expect(unmappedSlugs).not.toContain("axor-apex-dual-visor-full-face-helmets");
    expect(unmappedSlugs).not.toContain("premium-full-face-helmets");
  });

  it("correctly identifies legacy non-menu slugs via isLegacyNonMenuCategory", () => {
    expect(isLegacyNonMenuCategory("smk-stellar-helmet")).toBe(true);
    expect(isLegacyNonMenuCategory("sale")).toBe(true);
    expect(isLegacyNonMenuCategory("merchandise")).toBe(true);
    expect(isLegacyNonMenuCategory("full-face-helmets")).toBe(false);
    expect(isLegacyNonMenuCategory("premium-full-face-helmets")).toBe(false);
  });
});
