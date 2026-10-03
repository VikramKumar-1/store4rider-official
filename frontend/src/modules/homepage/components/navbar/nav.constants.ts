import { NavItem } from "../../types/homepage.types";

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "helmets",
    label: "Helmets",
    href: "/products?category=helmets",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Types",
        items: [
          { label: "Full Face Helmets", href: "/products?category=full-face-helmets" },
          { label: "Modular / Flip Up Helmets", href: "/products?category=modular-helmets" },
          { label: "Off Road Helmets", href: "/products?category=off-road-helmets" },
          { label: "Open Face Helmets", href: "/products?category=half-face-helmets" },
        ],
      },
      {
        group: "Accessories & Care",
        items: [
          { label: "Helmet Visors", href: "/products?category=helmet-visors" },
          { label: "Balaclava", href: "/products?category=balaclava" },
          { label: "Bluetooth Intercoms", href: "/products?category=bluetooth-intercoms" },
          { label: "Helmet Cleaners", href: "/products?category=helmet-cleaners" },
        ],
      },
    ],
    megaMenuFeatured: {
      title: "Trending",
      items: [
        {
          name: "HJC RPHA 12 VENOM 3",
          priceFormatted: "₹ 69,000",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYTFhMWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SGVsbWV0PC90ZXh0Pjwvc3ZnPg==",
          href: "/products/hjc-rpha-12-venom-3",
        },
        {
          name: "LS2 FF901 ADVANT X",
          priceFormatted: "₹ 41,000",
          imageUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYTFhMWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SGVsbWV0PC90ZXh0Pjwvc3ZnPg==",
          href: "/products/ls2-ff901-advant-x",
        },
      ],
    },
  },
  {
    id: "riding-gear",
    label: "Riding Gear",
    href: "/products?category=riding-gear",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Riding Jackets",
        items: [
          { label: "Riding Jacket", href: "/products?category=riding-jacket" },
          { label: "Protectors / Armour", href: "/products?category=protectors-armour" },
        ],
      },
      {
        group: "Riding Pants",
        items: [
          { label: "Riding Jeans", href: "/products?category=riding-jeans" },
          { label: "Touring Pants", href: "/products?category=touring-pants" },
          { label: "Knee Guards for bikers", href: "/products?category=knee-guards" },
        ],
      },
      {
        group: "Riding Gloves",
        items: [
          { label: "Full Gauntlet Gloves", href: "/products?category=full-gauntlet-gloves" },
          { label: "Semi Gauntlet Gloves", href: "/products?category=semi-gauntlet-gloves" },
          { label: "Short Motorbike Gloves", href: "/products?category=short-motorbike-gloves" },
        ],
      },
      {
        group: "Riding Boots",
        items: [
          { label: "Short biking boots", href: "/products?category=short-biking-boots" },
          { label: "Sports riding shoes", href: "/products?category=sports-riding-shoes" },
          { label: "Off-road boots", href: "/products?category=off-road-boots" },
        ],
      },
      {
        group: "Specialized Gear",
        items: [
          { label: "Riding Gear For Women", href: "/products?category=women-riding-gear" },
          { label: "Off-Road / Motocross Gear", href: "/products?category=off-road-motocross" },
        ],
      }
    ],
    megaMenuFeatured: {
      bannerImage: {
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYTFhMWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmlkaW5nIEdlYXIgQmFubmVyPC90ZXh0Pjwvc3ZnPg==",
        href: "/products?category=riding-gear",
        altText: "Riding Gear Collection"
      }
    }
  },
  {
    id: "luggage",
    label: "Luggage",
    href: "/products?category=motorcycle-luggage",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Mountable Luggage",
        items: [
          { label: "Tank Bags", href: "/products?category=tank-bags" },
          { label: "Saddle Bags for bikes", href: "/products?category=saddle-bags" },
          { label: "Motorcycle Tail Bags", href: "/products?category=tail-bags" },
          { label: "Bike Top Box", href: "/products?category=top-box" },
        ],
      },
      {
        group: "Other Bags",
        items: [
          { label: "Hydration Bags", href: "/products?category=hydration-bags" },
          { label: "Other Luggage", href: "/products?category=other-luggage" },
        ],
      }
    ]
  },
  {
    id: "accessories",
    label: "Bike Accessories",
    href: "/products?category=bike-accessories",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Lights & Mounts",
        items: [
          { label: "Auxiliary lights", href: "/products?category=auxiliary-lights" },
          { label: "Auxiliary light filter", href: "/products?category=auxiliary-light-filter" },
          { label: "Clamps and Mounts for lights", href: "/products?category=clamps-mounts" },
          { label: "Wiring harness and Switch", href: "/products?category=wiring-harness-switch" },
        ],
      },
      {
        group: "Other Accessories",
        items: [
          { label: "Off-Beat Accessories", href: "/products?category=off-beat-accessories" },
          { label: "Performance Parts", href: "/products?category=performance-parts" },
          { label: "Rally / Navigation Towers", href: "/products?category=rally-towers" },
          { label: "Bike Covers", href: "/products?category=bike-covers" },
          { label: "Chain Care", href: "/products?category=chain-care" },
        ],
      }
    ],
    megaMenuFeatured: {
      bannerImage: {
        imageUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2Y2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYTFhMWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QWNjZXNzb3JpZXMgQmFubmVyPC90ZXh0Pjwvc3ZnPg==",
        href: "/products?category=bike-accessories",
        altText: "Bike Accessories Workshop"
      }
    }
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
          { label: "Knox", href: "/products?brand=knox", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/knox.png" }
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
          { label: "BMC Air Filter", href: "/products?brand=bmc", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BMC_Air_filter_logo.png" }
        ],
      }
    ],
  },
  { id: "gadgets", label: "Gadgets", href: "/products?category=gadgets", hasDropdown: false },
  { id: "spares", label: "Spares", href: "/products?category=spares", hasDropdown: false },
  { id: "guides", label: "Guides", href: "/guides", hasDropdown: false },
];
