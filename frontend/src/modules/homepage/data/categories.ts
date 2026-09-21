export interface CategoryItem {
  name: string;
  slug: string;
  image: string;
  subcategories?: { name: string; slug: string }[];
}

export const STORE_CATEGORIES: CategoryItem[] = [
  {
    name: "Motorcycle Helmets",
    slug: "helmets",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Full Face Helmets", slug: "full-face-helmets" },
      { name: "Open Face Helmets", slug: "open-face-helmets" },
      { name: "Modular / Flip-up", slug: "modular-helmets" },
      { name: "Off-Road / Motocross", slug: "offroad-helmets" },
    ],
  },
  {
    name: "Riding Jackets",
    slug: "riding-jackets",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Textile Jackets", slug: "textile-jackets" },
      { name: "Leather Jackets", slug: "leather-jackets" },
      { name: "Mesh / Summer", slug: "mesh-jackets" },
      { name: "Rain Jackets", slug: "rain-jackets" },
    ],
  },
  {
    name: "Riding Boots",
    slug: "riding-boots",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "City Riding Boots", slug: "city-boots" },
      { name: "Sport Riding Shoes", slug: "sport-shoes" },
      { name: "Touring Boots", slug: "touring-boots" },
      { name: "Off-Road Boots", slug: "offroad-boots" },
    ],
  },
  {
    name: "Riding Gloves",
    slug: "riding-gloves",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Full Gauntlet", slug: "full-gauntlet-gloves" },
      { name: "Short Gloves", slug: "short-gloves" },
      { name: "Waterproof Gloves", slug: "winter-gloves" },
      { name: "Off-Road Gloves", slug: "offroad-gloves" },
    ],
  },
  {
    name: "Motorcycle Luggage",
    slug: "motorcycle-luggage",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Tank Bags", slug: "tank-bags" },
      { name: "Saddle Bags", slug: "saddle-bags" },
      { name: "Tail Bags", slug: "tail-bags" },
      { name: "Top Boxes", slug: "top-boxes" },
    ],
  },
  {
    name: "Bike Accessories",
    slug: "bike-accessories",
    image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=1200&auto=format&fit=crop",
    subcategories: [
      { name: "Auxiliary Lights", slug: "auxiliary-lights" },
      { name: "Phone Mounts", slug: "phone-mounts" },
      { name: "Bike Covers", slug: "bike-covers" },
      { name: "Performance Parts", slug: "performance-parts" },
    ],
  },
];
