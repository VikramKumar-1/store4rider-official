export interface CategoryItem {
  name: string;
  slug: string;
  image: string;
  subcategories?: { name: string; slug: string }[];
}

export const STORE_CATEGORIES: CategoryItem[] = [
  {
    name: "Motorcycle Helmets",
    slug: "motorcycle-helmets",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Full Face Helmets", slug: "full-face-helmets" },
      { name: "Open Face Helmets", slug: "half-face-helmets" },
      { name: "Modular / Flip-up", slug: "modular-helmets" },
      { name: "Off-Road / Motocross", slug: "off-road-helmets" },
    ],
  },
  {
    name: "Riding Gear",
    slug: "riding-gear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Riding Jackets", slug: "riding-jacket" },
      { name: "Riding Pants", slug: "touring-pants" },
      { name: "Riding Gloves", slug: "full-gauntlet-gloves" },
      { name: "Riding Boots", slug: "short-biking-boots" },
    ],
  },
  {
    name: "Bike Accessories",
    slug: "motorcycle-accessories-online",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Auxiliary Lights", slug: "auxiliary-lights" },
      { name: "Bike Covers", slug: "bike-covers" },
      { name: "Chain Care", slug: "chain-care" },
      { name: "Performance Parts", slug: "performance-parts" },
    ],
  },

  {
    name: "Motorcycle Luggage",
    slug: "motorcycle-bags-bike-luggage",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Tank Bags", slug: "tank-bags" },
      { name: "Saddle Bags", slug: "saddle-bags-bikes" },
      { name: "Tail Bags", slug: "motorcycle-tail-bags" },
      { name: "Top Boxes", slug: "top-boxes" },
    ],
  },

];
