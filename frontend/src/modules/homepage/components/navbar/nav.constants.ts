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
          { label: "Full Gauntlet Gloves", href: "/riding-gear/riding-gloves/full-gauntlet-gloves" },
          { label: "Semi Gauntlet Gloves", href: "/riding-gear/riding-gloves/semi-gauntlet-gloves" },
          { label: "Short Motorbike Gloves", href: "/riding-gear/riding-gloves/short-motorbike-gloves" },
        ],
      },
      {
        group: "Riding Jackets",
        groupHref: "/riding-gear/riding-jackets",
        items: [
          { label: "Protectors / Armour", href: "/riding-gear/riding-jackets/protectors-armour" },
        ],
      },
      {
        group: "Riding Pants",
        groupHref: "/riding-gear/riding-pants",
        items: [
          { label: "Riding Jeans", href: "/riding-gear/riding-pants/motorcycle-riding-jeans" },
          { label: "Touring Pants", href: "/riding-gear/riding-pants/touring-pants" },
          { label: "Knee Guards for bikers", href: "/riding-gear/riding-pants/knee-guards-bikers" },
        ],
      },
      {
        group: "Riding Boots",
        groupHref: "/riding-gear/motorcycle-riding-boots",
        items: [
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
        group: "Touring Bags & Boxes",
        items: [
          { label: "Tank Bags", href: "/motorcycle-bags-bike-luggage/tank-bags-bikes" },
          { label: "Saddle Bags for bikes", href: "/motorcycle-bags-bike-luggage/saddle-bags-bikes" },
          { label: "Motorcycle Tail Bags", href: "/motorcycle-bags-bike-luggage/motorcycle-tail-bags" },
          { label: "Bike Top Box", href: "/motorcycle-bags-bike-luggage/bike-top-box" },
        ],
      },
      {
        group: "Hydration & Other Luggage",
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
        group: "Auxiliary Lights & Mounts",
        items: [
          { label: "Auxiliary Lights & Flashers", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers" },
          { label: "Auxiliary lights", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/bike-auxiliary-lights" },
          { label: "Auxiliary light filter", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/auxiliary-light-filters" },
          { label: "Clamps and Mounts for lights", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/bike-auxiliary-light-clamps-mounts" },
          { label: "Auxiliary light wiring harness and Switch", href: "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/auxiliary-light-wiring-harness-switch" },
        ],
      },
      {
        group: "Protection, Performance & Care",
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
        group: "",
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
        ],
      },
      {
        group: "Riding Gear",
        items: [
          { label: "Rynox Gear", href: "/brands/rynox-gear", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/new-rynox-logo-black.png" },
          { label: "Raida Gears", href: "/brands/raida-gears", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Raida.png" },
          { label: "Furygan", href: "/brands/furygan", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Furygan.png" },
          { label: "Biking Brotherhood", href: "/brands/biking-brotherhood", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/9biking.png" },
          { label: "Mototech Gear", href: "/brands/mototech-gear", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MotoTech.png" },
          { label: "Scala Gears", href: "/brands/scala-gears", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/scala.png" },
          { label: "Invictus", href: "/brands/invictus", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Invictus.png" },
          { label: "Lone Ranger", href: "/brands/lone-ranger", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Lone-Ranger.png" },
          { label: "Fly Racing", href: "/brands/fly-racing", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Flyracing-logo_1_.png" },
        ],
      },
      {
        group: "Boots & Protection",
        items: [
          { label: "Forma Boots", href: "/brands/forma-boots", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Forma.png" },
          { label: "Falco", href: "/brands/falco", logoUrl: "https://www.store4riders.com/media/codazon_cache/brand/120x120/Background.png" },
          { label: "Safe-tech Protectors", href: "/brands/safe-tech-protectors", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Safe-tech.jpg" },
          { label: "Sas-tec", href: "/brands/sas-tec", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/SAS-TEC-Logo-.jpg" },
        ],
      },
      {
        group: "Luggage & Accessories",
        items: [
          { label: "Maddog", href: "/brands/maddog", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/maddog-logo-2.png" },
          { label: "Parani", href: "/brands/parani", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/PARANI-LOGO.png" },
          { label: "Moto Fusion", href: "/brands/moto-fusion", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/mf.png" },
          { label: "Motospunk", href: "/brands/motospunk", logoUrl: "/brands/motospunk.svg" },
          { label: "Quipco", href: "/brands/quipco", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Quipco.jpg" },
          { label: "Shoerella", href: "/brands/shoerella", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Shoerella-logo.jpg" },
        ],
      },
      {
        group: "Parts & Performance",
        items: [
          { label: "Motul", href: "/brands/motul", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Motul-logo.png" },
          { label: "K&N Air Filter", href: "/brands/k-n-bike-air-filter", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/K_N-Logo.png" },
          { label: "BMC Air Filter", href: "/brands/bmc-air-filter", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BMC_Air_filter_logo.png" },
          { label: "NGK Spark Plugs", href: "/brands/ngk-spark-plugs", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/NGK.png" },
          { label: "Rolon Chains", href: "/brands/rolon", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/rolon.jpg" },
          { label: "Barrel Exhaust", href: "/brands/barrel-exhaust", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Barrel-Exhaust.png" },
          { label: "Moto Torque", href: "/brands/moto-torque", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MOTO-TORQUE-LOGO.jpg" },
          { label: "Pro-spec Parts", href: "/brands/pro-spec-performance-parts", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Pro-Spec-logo.png" },
          { label: "Race Dynamics", href: "/brands/race-dynamics", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/RaceDynamics_Logohi-res_Primary.png" },
          { label: "Carberry", href: "/brands/carberry", logoUrl: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Carberry.png" },
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
