import { NavItem } from "../../types/homepage.types";

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "helmets",
    label: "Helmets",
    href: "/motorcycle-helmets",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Types",
        items: [
          { label: "Full Face Helmets", href: "/motorcycle-helmets/full-face-helmets" },
          { label: "Modular / Flip Up Helmets", href: "/motorcycle-helmets/modular-helmets" },
          { label: "Off Road Helmets", href: "/motorcycle-helmets/off-road-helmets" },
          { label: "Open Face Helmets", href: "/motorcycle-helmets/half-face-helmets" },
        ],
      },
      {
        group: "Accessories & Care",
        items: [
          { label: "Helmet Visors", href: "/motorcycle-helmets/helmet-visors" },
          { label: "Balaclava", href: "/motorcycle-helmets/balaclava" },
          { label: "Bluetooth Intercoms", href: "/motorcycle-helmets/bluetooth-intercoms" },
          { label: "Helmet Cleaners", href: "/motorcycle-helmets/helmet-cleaners" },
        ],
      },
    ],
  },
  {
    id: "riding-gear",
    label: "Riding Gear",
    href: "/riding-gear",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Riding Jackets",
        groupHref: "/riding-gear/riding-jacket",
        items: [
          { label: "All Riding Jackets", href: "/riding-gear/riding-jacket" },
          { label: "Protectors / Armour", href: "/riding-gear/protectors-armour" },
        ],
      },
      {
        group: "Riding Pants",
        groupHref: "/riding-gear/riding-pants",
        items: [
          { label: "All Riding Pants", href: "/riding-gear/riding-pants" },
          { label: "Riding Jeans", href: "/riding-gear/riding-jeans" },
          { label: "Touring Pants", href: "/riding-gear/touring-pants" },
          { label: "Knee Guards for bikers", href: "/riding-gear/knee-guards" },
        ],
      },
      {
        group: "Riding Gloves",
        groupHref: "/riding-gear/motorcycle-riding-gloves",
        items: [
          { label: "All Riding Gloves", href: "/riding-gear/motorcycle-riding-gloves" },
          { label: "Full Gauntlet Gloves", href: "/riding-gear/full-gauntlet-gloves" },
          { label: "Semi Gauntlet Gloves", href: "/riding-gear/semi-gauntlet-gloves" },
          { label: "Short Motorbike Gloves", href: "/riding-gear/short-motorbike-gloves" },
        ],
      },
      {
        group: "Riding Boots",
        groupHref: "/riding-gear/motorcycle-riding-boots",
        items: [
          { label: "All Riding Boots", href: "/riding-gear/motorcycle-riding-boots" },
          { label: "Short biking boots", href: "/riding-gear/short-biking-boots" },
          { label: "Sports riding shoes", href: "/riding-gear/sports-riding-shoes" },
          { label: "Off-road boots", href: "/riding-gear/motorcycle-riding-boots/off-road-riding-boots" },
        ],
      },
      {
        group: "Specialized Gear",
        items: [
          { label: "Riding Gear For Women", href: "/riding-gear/women-riding-gear" },
          { label: "Off-Road / Motocross Gear", href: "/riding-gear/off-road-motocross" },
        ],
      }
    ],
  },
  {
    id: "luggage",
    label: "Luggage",
    href: "/motorcycle-bags-bike-luggage",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Mountable Luggage",
        items: [
          { label: "Tank Bags", href: "/motorcycle-bags-bike-luggage/tank-bags" },
          { label: "Saddle Bags for bikes", href: "/motorcycle-bags-bike-luggage/saddle-bags-bikes" },
          { label: "Motorcycle Tail Bags", href: "/motorcycle-bags-bike-luggage/motorcycle-tail-bags" },
          { label: "Bike Top Box", href: "/motorcycle-bags-bike-luggage/top-box" },
        ],
      },
      {
        group: "Other Bags",
        items: [
          { label: "Hydration Bags", href: "/motorcycle-bags-bike-luggage/hydration-bags" },
          { label: "Other Luggage", href: "/motorcycle-bags-bike-luggage/other-luggage" },
        ],
      }
    ]
  },
  {
    id: "accessories",
    label: "Bike Accessories",
    href: "/motorcycle-accessories-online",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Auxiliary Lights / Filters / Accessories",
        items: [
          { label: "View All Auxiliary Lights", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers" },
          { label: "Auxiliary lights", href: "/motorcycle-accessories-online/auxiliary-lights" },
          { label: "Auxiliary light filter", href: "/motorcycle-accessories-online/auxiliary-light-filter" },
          { label: "Clamps and Mounts for lights", href: "/motorcycle-accessories-online/clamps-and-mounts-for-lights" },
          { label: "Auxiliary light wiring harness and Switch", href: "/motorcycle-accessories-online/auxiliary-light-wiring-harness-and-switch" },
        ],
      },
      {
        group: "More Accessories",
        items: [
          { label: "Off-Beat Accessories", href: "/motorcycle-accessories-online/off-beat-accessories" },
          { label: "Performance Parts", href: "/motorcycle-accessories-online/performance-parts" },
          { label: "Rally Towers / Navigation Tower", href: "/motorcycle-accessories-online/rally-towers-navigation-tower" },
          { label: "Bike Covers", href: "/motorcycle-accessories-online/bike-covers" },
          { label: "Chain Care", href: "/motorcycle-accessories-online/chain-care" },
        ],
      }
    ],
  },
  {
    id: "shop-by-brand",
    label: "Shop By Brand",
    href: "/products",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Helmet Brands",
        items: [
          { label: "AGV", href: "/products?brand=agv", logoUrl: "/brands/agv.svg" },
          { label: "HJC", href: "/products?brand=hjc", logoUrl: "/brands/hjc.svg" },
          { label: "LS2", href: "/products?brand=ls2", logoUrl: "/brands/ls2.svg" },
          { label: "MT Helmets", href: "/products?brand=mt", logoUrl: "/brands/mt.svg" },
          { label: "Axor", href: "/products?brand=axor", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/axor-logo_bw_100x51.png" },
          { label: "Axxis", href: "/products?brand=axxis", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Axxis-Logo-2.png" },
          { label: "SMK", href: "/products?brand=smk", logoUrl: "/brands/smk.svg" },
          { label: "Vemar", href: "/products?brand=vemar", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/vemar-100x51.png" },
          { label: "Vega", href: "/products?brand=vega", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/vega100x75.png" }
        ],
      },
      {
        group: "Riding Gear",
        items: [
          { label: "Alpinestars", href: "/products?brand=alpinestars", logoUrl: "/brands/alpinestars.svg" },
          { label: "Rynox", href: "/products?brand=rynox", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/new-rynox-logo-black.png" },
          { label: "Shima", href: "/products?brand=shima", logoUrl: "/brands/shima.svg" },
          { label: "Viaterra", href: "/products?brand=viaterra", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/VIATERRA_LOGO_PNG.png" },
          { label: "DSG", href: "/products?brand=dsg", logoUrl: "/brands/dsg.svg" },
          { label: "Macna", href: "/products?brand=macna", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/macna-100x51.png" },
          { label: "Furygan", href: "/products?brand=furygan", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/furygan_logo.jpg" },
          { label: "Raida", href: "/products?brand=raida", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Raida.png" },
          { label: "Knox", href: "/products?brand=knox", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/knox.png" },
          { label: "Forma Boots", href: "/products?brand=forma" }
        ],
      },
      {
        group: "Luggage & Accessories",
        items: [
          { label: "Sena", href: "/products?brand=sena", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/SENA-LOGO.png" },
          { label: "Parani", href: "/products?brand=parani", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/PARANI-LOGO.png" },
          { label: "Bobo", href: "/products?brand=bobo", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BOBO-Logo-Blue-Black.png" },
          { label: "BluArmor", href: "/products?brand=bluarmor", logoUrl: "/brands/bluarmor.svg" },
          { label: "Dirtsack", href: "/products?brand=dirtsack", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Dirtsack.png" },
          { label: "Shad", href: "/products?brand=shad", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/SHAD-LOGO-PNG.png" },
          { label: "Maddog", href: "/products?brand=maddog", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/maddog-logo-2.png" }
        ],
      },
      {
        group: "Parts & Tyres",
        items: [
          { label: "Apollo", href: "/products?brand=apollo", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/APOLLO.png" },
          { label: "Michelin", href: "/products?brand=michelin", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MICHELIN.jpg" },
          { label: "Pirelli", href: "/products?brand=pirelli", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/PIRELLI.jpg" },
          { label: "Motul", href: "/products?brand=motul", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Motul-logo.png" },
          { label: "K&N", href: "/products?brand=k&n", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/K_N-Logo.png" },
          { label: "NGK", href: "/products?brand=ngk", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/NGK.png" },
          { label: "BMC Air Filter", href: "/products?brand=bmc", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BMC_Air_filter_logo.png" },
          { label: "Moto Torque", href: "/products?brand=moto-torque" },
          { label: "Barrel Exhaust", href: "/products?brand=barrel-exhaust" }
        ],
      }
    ],
  },
  { 
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
  },
  { 
    id: "gadgets", 
    label: "Gadgets", 
    href: "/gadgets", 
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Gadgets",
        items: [
          { label: "Bike Phone Holders", href: "/gadgets/bike-phone-holders" },
          { label: "Communicators", href: "/gadgets/communicators" },
        ],
      }
    ]
  },
  { id: "guides", label: "Guides", href: "/guides", hasDropdown: false },
];
