import { NavItem } from "../../types/homepage.types";

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "helmets",
    label: "Helmets",
    href: "/products?category=helmets",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "By Style",
        items: [
          { label: "Full Face Helmets", href: "/products?category=full-face-helmets" },
          { label: "Modular Helmets", href: "/products?category=modular-helmets" },
          { label: "Half Face Helmets", href: "/products?category=half-face-helmets" },
          { label: "Off Road Helmets", href: "/products?category=off-road-helmets" },
        ],
      },
      {
        group: "By Brand",
        items: [
          { label: "Axor Helmets", href: "/products?brand=axor" },
          { label: "MT Helmets", href: "/products?brand=mt" },
        ],
      },
    ],
  },
  {
    id: "riding-gear",
    label: "Riding Gear",
    href: "/products?category=riding-gear",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Apparel",
        items: [
          { label: "Riding Jackets", href: "/products?category=riding-jackets" },
          { label: "Riding Pants", href: "/products?category=riding-pants" },
        ],
      },
    ],
  },
  { id: "luggage", label: "Luggage", href: "/products?category=motorcycle-luggage", hasDropdown: false },
  { id: "merchandise", label: "Merchandise", href: "/products?category=merchandise" },
  { id: "accessories", label: "Accessories", href: "/products?category=bike-accessories", hasDropdown: false },
  { id: "spares", label: "Spares", href: "/products?category=spares" },
  { id: "exhausts", label: "Exhausts", href: "/products?category=exhausts" },
  { id: "gadgets", label: "Gadgets", href: "/products?category=gadgets" },
  { id: "tyres", label: "Tyres", href: "/products?category=tyres" },
];
