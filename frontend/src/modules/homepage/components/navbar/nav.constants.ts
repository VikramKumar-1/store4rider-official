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
          { label: "Open Face Helmets", href: "/motorcycle-helmets/open-face-helmets" },
        ],
      },
      {
        group: "Accessories & Care",
        items: [
          { label: "Helmet Visors/Helmet Accessories", href: "/motorcycle-helmets/helmet-accessories" },
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
        group: "Riding Gloves",
        groupHref: "/riding-gear/riding-gloves",
        items: [
          { label: "Riding Gloves", href: "/riding-gear/riding-gloves" },
          { label: "Full Gauntlet Gloves", href: "/riding-gear/riding-gloves/full-gauntlet-gloves" },
          { label: "Semi Gauntlet Gloves", href: "/riding-gear/riding-gloves/semi-gauntlet-gloves" },
          { label: "Short Motorbike Gloves", href: "/riding-gear/riding-gloves/short-motorbike-gloves" },
        ],
      },
      {
        group: "Riding Jackets",
        groupHref: "/riding-gear/riding-jackets",
        items: [
          { label: "Riding Jackets", href: "/riding-gear/riding-jackets" },
          { label: "Protectors / Armour", href: "/riding-gear/riding-jackets/protectors-armour" },
        ],
      },
      {
        group: "Riding Pants",
        groupHref: "/riding-gear/riding-pants",
        items: [
          { label: "Riding Pants", href: "/riding-gear/riding-pants" },
          { label: "Riding Jeans", href: "/riding-gear/riding-pants/motorcycle-riding-jeans" },
          { label: "Touring Pants", href: "/riding-gear/riding-pants/touring-pants" },
          { label: "Knee Guards for bikers", href: "/riding-gear/riding-pants/knee-guards-bikers" },
        ],
      },
      {
        group: "Riding Boots",
        groupHref: "/riding-gear/motorcycle-riding-boots",
        items: [
          { label: "Riding Boots", href: "/riding-gear/motorcycle-riding-boots" },
          { label: "Short biking boots", href: "/riding-gear/motorcycle-riding-boots/short-biking-boots" },
          { label: "Sports riding shoes", href: "/riding-gear/motorcycle-riding-boots/sports-riding-shoes" },
          { label: "Off-road boots", href: "/riding-gear/motorcycle-riding-boots/off-road-riding-boots" },
        ],
      },
      {
        group: "Specialized Gear",
        items: [
          { label: "Touring Gear", href: "/riding-gear/touring-gear" },
          { label: "Monsoon Gear", href: "/riding-gear/monsoon-gear-for-riders" },
          { label: "Riding Gear For Women", href: "/riding-gear-for-women" },
          { label: "Off-Road / Motocross Gear", href: "/riding-gear/off-road-motocross-riding-gear" },
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
          { label: "Tank Bags", href: "/motorcycle-bags-bike-luggage/tank-bags-bikes" },
          { label: "Saddle Bags for bikes", href: "/motorcycle-bags-bike-luggage/saddle-bags-bikes" },
          { label: "Motorcycle Tail Bags", href: "/motorcycle-bags-bike-luggage/motorcycle-tail-bags" },
          { label: "Bike Top Box", href: "/motorcycle-bags-bike-luggage/bike-top-box" },
        ],
      },
      {
        group: "Other Bags",
        items: [
          { label: "Hydration Bags", href: "/motorcycle-bags-bike-luggage/hydration-bag" },
          { label: "Other Luggage", href: "/motorcycle-bags-bike-luggage/motorcycle-other-luggage" },
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
          { label: "Auxiliary Lights & Flashers", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers" },
          { label: "Auxiliary lights", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/bike-auxiliary-lights" },
          { label: "Auxiliary light filter", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/auxiliary-light-filters" },
          { label: "Clamps and Mounts for lights", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/bike-auxiliary-light-clamps-mounts" },
          { label: "Auxiliary light wiring harness and Switch", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/auxiliary-light-wiring-harness-switch" },
        ],
      },
      {
        group: "More Accessories",
        items: [
          { label: "Off-Beat Accessories", href: "/motorcycle-accessories-online/off-beat-motorcycle-accessories" },
          { label: "Performance Parts", href: "/motorcycle-accessories-online/performance-parts" },
          { label: "Rally Towers / Navigation Tower", href: "/motorcycle-accessories-online/rally-tower" },
          { label: "Bike Covers", href: "/motorcycle-accessories-online/bike-covers" },
          { label: "Chain Care", href: "/motorcycle-accessories-online/chain-care" },
        ],
      }
    ],
  },
  { 
    id: "spares", 
    label: "Spares", 
    href: "/bike-spares", 
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Spares & Parts",
        groupHref: "/bike-spares",
        items: [
          { label: "Chain Sprocket Kits", href: "/bike-spares/chain-sprocket-kits" },
          { label: "Iridium Spark Plugs", href: "/bike-spares/iridium-spark-plug" },
          { label: "Performance Air Filters", href: "/bike-spares/performance-air-filter-bike" },
          { label: "Brake Pads", href: "/bike-spares/brake-pads" },
        ],
      },
    ],
  },
  { 
    id: "exhausts", 
    label: "Exhausts", 
    href: "/exhausts", 
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
  {
    id: "shop-by-brand",
    label: "Shop By Brand",
    href: "/brands",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Helmet Brands",
        items: [
          { label: "Axor Helmets", href: "/brands/axor-helmets", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/axor-logo_bw_100x51.png" },
          { label: "SMK Helmets", href: "/brands/smk-helmets", logoUrl: "/brands/smk.svg" },
          { label: "Rynox Gear", href: "/brands/rynox-gear", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/new-rynox-logo-black.png" },
          { label: "Raida Gears", href: "/brands/raida-gears", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Raida.png" },
          { label: "Furygan", href: "/brands/furygan", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/furygan_logo.jpg" },
          { label: "Biking Brotherhood", href: "/brands/biking-brotherhood" },
          { label: "Mototech Gear", href: "/brands/mototech-gear" },
          { label: "Scala Gears", href: "/brands/scala-gears" },
        ],
      },
      {
        group: "Boots & Protection",
        items: [
          { label: "Forma Boots", href: "/brands/forma-boots" },
          { label: "Falco", href: "/brands/falco" },
          { label: "Fly Racing", href: "/brands/fly-racing" },
          { label: "Invictus", href: "/brands/invictus" },
          { label: "Lone Ranger", href: "/brands/lone-ranger" },
          { label: "Safe-tech Protectors", href: "/brands/safe-tech-protectors" },
          { label: "Sas-tec", href: "/brands/sas-tec" },
        ],
      },
      {
        group: "Luggage & Accessories",
        items: [
          { label: "Maddog", href: "/brands/maddog", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/maddog-logo-2.png" },
          { label: "Parani", href: "/brands/parani", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/PARANI-LOGO.png" },
          { label: "Moto Fusion", href: "/brands/moto-fusion" },
          { label: "Motospunk", href: "/brands/motospunk" },
          { label: "Quipco", href: "/brands/quipco" },
          { label: "Shoerella", href: "/brands/shoerella" },
        ],
      },
      {
        group: "Parts & Performance",
        items: [
          { label: "Motul", href: "/brands/motul", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Motul-logo.png" },
          { label: "K&N Air Filter", href: "/brands/k-n-bike-air-filter", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/K_N-Logo.png" },
          { label: "BMC Air Filter", href: "/brands/bmc-air-filter", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BMC_Air_filter_logo.png" },
          { label: "NGK Spark Plugs", href: "/brands/ngk-spark-plugs", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/NGK.png" },
          { label: "Rolon Chains", href: "/brands/rolon" },
          { label: "Barrel Exhaust", href: "/brands/barrel-exhaust" },
          { label: "Moto Torque", href: "/brands/moto-torque" },
          { label: "Pro-spec Parts", href: "/brands/pro-spec-performance-parts" },
          { label: "Race Dynamics", href: "/brands/race-dynamics" },
          { label: "Carberry", href: "/brands/carberry" },
        ],
      }
    ],
  },
  {
    id: "guides",
    label: "Guides",
    href: "/guides",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "",
        items: [
          { label: "Choosing correct Riding Gear", href: "/guides/category/choosing-correct-riding-gear" },
          { label: "Riding Gear care", href: "/guides/category/riding-gear-care" },
          { label: "Expert Tips", href: "/guides/category/expert-tips" },
          { label: "Bike Maintenance & Technical Resources", href: "/guides/category/bike-maintenance-technical-resources" },
          { label: "Touring & Trip Prep", href: "/guides/category/motorcycle-touring-trip-prep" },
          { label: "Motorcycle Buying & Ownership Advice", href: "/guides/category/motorcycle-buying-ownership-advice" },
        ],
      },
    ],
  },
];
