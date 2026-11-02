/**
 * @file coupon-categories.ts
 * @description Official Store4Riders category menus and submenus for promo coupon targeting.
 * Strictly mirrors the store navigation categories (Helmets, Riding Gear, Luggage, Accessories, Spares, Exhausts, Gadgets).
 */

export interface CategorySubmenuItem {
  slug: string;
  label: string;
}

export interface CategoryMenuGroup {
  id: string;
  name: string;
  mainSlug: string;
  iconName?: string;
  submenus: CategorySubmenuItem[];
}

export const STORE_CATEGORY_GROUPS: CategoryMenuGroup[] = [
  {
    id: "helmets",
    name: "Helmets",
    mainSlug: "motorcycle-helmets",
    submenus: [
      { slug: "motorcycle-helmets", label: "All Helmets (Whole Category)" },
      { slug: "full-face-helmets", label: "Full Face Helmets" },
      { slug: "modular-helmets", label: "Modular / Flip Up Helmets" },
      { slug: "off-road-helmets", label: "Off Road Helmets" },
      { slug: "open-face-helmets", label: "Open Face Helmets" },
      { slug: "helmet-accessories", label: "Helmet Visors & Accessories" },
      { slug: "balaclava", label: "Balaclava" },
      { slug: "bluetooth-intercoms", label: "Bluetooth Intercoms" },
      { slug: "helmet-cleaners", label: "Helmet Cleaners" },
    ],
  },
  {
    id: "riding-gear",
    name: "Riding Gear",
    mainSlug: "riding-gear",
    submenus: [
      { slug: "riding-gear", label: "All Riding Gear (Whole Category)" },
      { slug: "riding-jackets", label: "Riding Jackets" },
      { slug: "protectors-armour", label: "Protectors / Armour" },
      { slug: "riding-gloves", label: "Riding Gloves" },
      { slug: "full-gauntlet-gloves", label: "Full Gauntlet Gloves" },
      { slug: "semi-gauntlet-gloves", label: "Semi Gauntlet Gloves" },
      { slug: "short-motorbike-gloves", label: "Short Motorbike Gloves" },
      { slug: "riding-pants", label: "Riding Pants" },
      { slug: "motorcycle-riding-jeans", label: "Riding Jeans" },
      { slug: "touring-pants", label: "Touring Pants" },
      { slug: "knee-guards-bikers", label: "Knee Guards for Bikers" },
      { slug: "motorcycle-riding-boots", label: "Riding Boots" },
      { slug: "short-biking-boots", label: "Short Biking Boots" },
      { slug: "sports-riding-shoes", label: "Sports Riding Shoes" },
      { slug: "off-road-riding-boots", label: "Off-Road Boots" },
      { slug: "touring-gear", label: "Touring Gear" },
      { slug: "monsoon-gear-for-riders", label: "Monsoon Gear" },
      { slug: "riding-gear-for-women", label: "Riding Gear For Women" },
      { slug: "off-road-motocross-riding-gear", label: "Off-Road / Motocross Gear" },
    ],
  },
  {
    id: "luggage",
    name: "Luggage & Bags",
    mainSlug: "motorcycle-bags-bike-luggage",
    submenus: [
      { slug: "motorcycle-bags-bike-luggage", label: "All Luggage (Whole Category)" },
      { slug: "tank-bags-bikes", label: "Tank Bags" },
      { slug: "saddle-bags-bikes", label: "Saddle Bags" },
      { slug: "motorcycle-tail-bags", label: "Motorcycle Tail Bags" },
      { slug: "bike-top-box", label: "Bike Top Box" },
      { slug: "hydration-bag", label: "Hydration Bags" },
      { slug: "motorcycle-other-luggage", label: "Other Luggage" },
    ],
  },
  {
    id: "accessories",
    name: "Bike Accessories",
    mainSlug: "motorcycle-accessories-online",
    submenus: [
      { slug: "motorcycle-accessories-online", label: "All Bike Accessories (Whole Category)" },
      { slug: "bike-auxiliary-lights-filters-flashers", label: "Auxiliary Lights & Flashers" },
      { slug: "bike-auxiliary-lights", label: "Auxiliary Lights" },
      { slug: "auxiliary-light-filters", label: "Auxiliary Light Filters" },
      { slug: "bike-auxiliary-light-clamps-mounts", label: "Clamps & Mounts for Lights" },
      { slug: "auxiliary-light-wiring-harness-switch", label: "Wiring Harness & Switch" },
      { slug: "off-beat-motorcycle-accessories", label: "Off-Beat Accessories" },
      { slug: "performance-parts", label: "Performance Parts" },
      { slug: "rally-tower", label: "Rally / Navigation Towers" },
      { slug: "bike-covers", label: "Bike Covers" },
      { slug: "chain-care", label: "Chain Care" },
    ],
  },
  {
    id: "spares",
    name: "Bike Spares",
    mainSlug: "bike-spares",
    submenus: [
      { slug: "bike-spares", label: "All Bike Spares (Whole Category)" },
      { slug: "chain-sprocket-kits", label: "Chain Sprocket Kits" },
      { slug: "iridium-spark-plug", label: "Iridium Spark Plugs" },
      { slug: "performance-air-filter-bike", label: "Performance Air Filters" },
      { slug: "brake-pads", label: "Brake Pads" },
    ],
  },
  {
    id: "exhausts",
    name: "Exhausts",
    mainSlug: "exhausts",
    submenus: [
      { slug: "exhausts", label: "Exhausts" },
    ],
  },
  {
    id: "gadgets",
    name: "Gadgets",
    mainSlug: "gadgets",
    submenus: [
      { slug: "gadgets", label: "All Gadgets (Whole Category)" },
      { slug: "bike-phone-holders", label: "Bike Phone Holders" },
      { slug: "communicators", label: "Communicators" },
    ],
  },
];

// Helper to look up pretty label for any slug
export const CATEGORY_SLUG_TO_LABEL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const group of STORE_CATEGORY_GROUPS) {
    for (const sub of group.submenus) {
      map[sub.slug] = sub.label;
    }
  }
  return map;
})();
