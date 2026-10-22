import { ISpecDefinition } from "./product-form.types";

export const CATEGORY_SPEC_DEFINITIONS: Record<
  string,
  { title: string; subtitle: string; icon: "shield" | "package" | "wrench" | "sliders"; fields: ISpecDefinition[] }
> = {
  Helmets: {
    title: "Helmets & Visors Technical Specifications",
    subtitle: "Shell construction, safety certifications, pinlock anti-fog & Bluetooth readiness",
    icon: "shield",
    fields: [
      {
        key: "material",
        label: "Shell Material",
        placeholder: "e.g. Advanced Polycarbonate / Carbon Fiber",
        presets: [
          "Advanced Polycarbonate",
          "High-Impact ABS",
          "Tri-Composite Fiberglass",
          "100% Carbon Fiber",
          "Kevlar & Carbon Composite",
        ],
      },
      {
        key: "certification",
        label: "Safety Certification",
        placeholder: "e.g. ECE 22.06 & DOT & ISI",
        presets: [
          "ECE 22.06 & DOT & ISI",
          "ECE 22.06 & ISI",
          "ECE 22.05 & DOT",
          "DOT & ISI",
          "ISI (IS 4151:2015)",
          "Snell M2020",
        ],
      },
      {
        key: "pinlock_ready",
        label: "Pinlock Anti-Fog Ready",
        placeholder: "e.g. Pinlock 70 MaxVision Ready",
        presets: [
          "Pinlock 70 MaxVision Ready",
          "Pinlock 30 Ready",
          "Pinlock Lens Included in Box",
          "Not Pinlock Ready",
        ],
      },
      {
        key: "sun_visor",
        label: "Internal Sun Visor",
        placeholder: "e.g. Internal Retractable Sun Visor",
        presets: [
          "Internal Retractable UV400 Sun Visor",
          "No Sun Visor (Track/Race Spec)",
        ],
      },
      {
        key: "bluetooth_ready",
        label: "Bluetooth / Intercom Ready",
        placeholder: "e.g. Integrated Speaker Pockets",
        presets: [
          "Integrated Speaker Pockets & Mic Cavities",
          "Dedicated Intercom Slot",
          "No Speaker Pockets",
        ],
      },
      {
        key: "closure_type",
        label: "Chin Strap Fastening",
        placeholder: "e.g. Double D-Ring",
        presets: [
          "Double D-Ring (Track Approved)",
          "Micrometric Quick-Release Ratchet Buckle",
        ],
      },
    ],
  },
  Jackets: {
    title: "Riding Gear & Apparel Technical Specifications",
    subtitle: "Outer textile/leather, CE armours, thermal liners & weatherproofing",
    icon: "shield",
    fields: [
      {
        key: "material",
        label: "Outer Shell Material",
        placeholder: "e.g. 600D Cordura Polyester",
        presets: [
          "600D Cordura Polyester Fabric",
          "Heavy Duty 3D Air Mesh & 600D Poly",
          "Full Grain 1.2-1.4mm Cowhide Leather",
          "500D High Tenacity Nylon",
          "Waxed Cotton & Kevlar Lining",
        ],
      },
      {
        key: "certification",
        label: "Armor Protection Level",
        placeholder: "e.g. CE Level 2",
        presets: [
          "CE Level 2 (Back, Shoulders & Elbows)",
          "CE Level 1 (Back, Shoulders & Elbows)",
          "Sas-Tec Level 2 Viscoelastic Protectors",
          "Knox Micro-Lock CE Level 2",
          "Ready for Armours (Pockets Only)",
        ],
      },
      {
        key: "waterproof",
        label: "Waterproofing & Rain Protection",
        placeholder: "e.g. 100% Waterproof (Reissa)",
        presets: [
          "100% Waterproof (Reissa Membrane)",
          "External Standalone Rain Liner Included",
          "Water-Resistant Coating",
          "Non-Waterproof (Summer Airflow Mesh)",
        ],
      },
      {
        key: "thermal_liner",
        label: "Thermal / Warm Liner",
        placeholder: "e.g. Detachable Winter Liner",
        presets: [
          "Detachable Thermal Winter Liner Included",
          "Standalone Thermal Vest Included",
          "Non-Thermal",
        ],
      },
      {
        key: "ventilation",
        label: "Ventilation System",
        placeholder: "e.g. High-Flow Air Mesh Panels",
        presets: [
          "High-Flow Perforated 3D Air Mesh Panels",
          "Chest, Arm & Back Zippered Air Vents",
          "Laser Perforated Leather Panels",
        ],
      },
    ],
  },
  Gloves: {
    title: "Riding Gloves Technical Specifications",
    subtitle: "Glove cut, knuckle armor, abrasion palm & touchscreen tech",
    icon: "shield",
    fields: [
      {
        key: "glove_type",
        label: "Glove Style / Cut",
        placeholder: "e.g. Full Gauntlet Racing",
        presets: [
          "Full Gauntlet Track & Racing Glove",
          "Short Cuff Street / Urban Glove",
          "Adventure Touring Glove",
          "Off-Road / MX Lightweight Glove",
        ],
      },
      {
        key: "knuckle_protection",
        label: "Knuckle & Finger Armor",
        placeholder: "e.g. Carbon Fiber Molded Knuckles",
        presets: [
          "Carbon Fiber Molded Knuckles",
          "TPU Hard Molded Knuckle Protector",
          "Knox SPS Scaphoid Palm Sliders",
          "Soft Viscoelastic TPR Protectors",
          "High-Density Foam Padded",
        ],
      },
      {
        key: "material",
        label: "Construction Material",
        placeholder: "e.g. Premium Goatskin Leather",
        presets: [
          "Premium Goatskin Leather & Clarino",
          "Full Grain Cowhide Leather",
          "3D Air Mesh & Synthetic Microfiber",
          "Kangaroo Leather Palm & Cowhide",
        ],
      },
      {
        key: "touchscreen_friendly",
        label: "Touchscreen Compatibility",
        placeholder: "e.g. Yes",
        presets: [
          "Yes - Conductive Index Finger & Thumb",
          "No",
        ],
      },
    ],
  },
  Boots: {
    title: "Riding Boots Technical Specifications",
    subtitle: "Boot classification, leather upper, armor plates & closure systems",
    icon: "package",
    fields: [
      {
        key: "boot_type",
        label: "Boot Classification",
        placeholder: "e.g. Adventure Touring High Boots",
        presets: [
          "Sport / Track Racing Riding Boots",
          "Adventure Touring High Boots",
          "City / Short Urban Riding Boots",
          "Off-Road / Enduro MX Boots",
        ],
      },
      {
        key: "material",
        label: "Upper Material",
        placeholder: "e.g. Full Grain Leather & Microfiber",
        presets: [
          "Full Grain Leather & Microfiber",
          "High-Tenacity Microfiber Synthetic Leather",
          "Suede Leather & Cordura Inserts",
        ],
      },
      {
        key: "waterproof",
        label: "Waterproofing",
        placeholder: "e.g. 100% Waterproof Membrane",
        presets: [
          "100% Waterproof Breathable Membrane",
          "Water-Resistant Treatment",
          "Perforated / Breathable (Non-Waterproof)",
        ],
      },
      {
        key: "ankle_protection",
        label: "Ankle & Shin Protection",
        placeholder: "e.g. TPU Ankle Cups & Shin Guard",
        presets: [
          "TPU Ankle Cups, Shin Guard & Heel Counter",
          "Ankle Brace Torsion System",
          "Reinforced Toe Box & Internal Ankle Disc",
        ],
      },
      {
        key: "closure_type",
        label: "Fastening System",
        placeholder: "e.g. BOA Quick Dial / Ratchet Buckles",
        presets: [
          "BOA Quick Dial Lacing System",
          "Micro-Metric Adjustable Ratchet Buckles",
          "YKK Zipper with Velcro Storm Flap",
          "Dual Cam-Lock Straps",
        ],
      },
    ],
  },
  "Saddle Bag": {
    title: "Motorcycle Bags & Luggage Technical Specifications",
    subtitle: "Storage volume, tank/saddle mounting, rain covers & convertible modes",
    icon: "package",
    fields: [
      {
        key: "capacity",
        label: "Luggage Volume / Capacity",
        placeholder: "e.g. 21 Litres / 60 Litres",
        presets: [
          "21 Litres",
          "30 Litres",
          "40 Litres",
          "60 Litres",
          "14L - 21L Expandable",
          "2 Litres (Hydration Bladder)",
        ],
      },
      {
        key: "magnetic_non_magnetic",
        label: "Mounting System",
        placeholder: "e.g. Magnetic / Strap-on",
        presets: [
          "Magnetic (Neodymium Tank Magnets)",
          "Non-Magnetic (Universal Straps)",
          "Hybrid (Magnetic Flaps + Straps)",
          "Quick-Release Universal Tail Straps",
        ],
      },
      {
        key: "rain_cover",
        label: "Rain Cover",
        placeholder: "e.g. Included (100% Waterproof)",
        presets: [
          "Included (100% Waterproof Hi-Viz with Seam Sealing)",
          "100% Waterproof Roll-Top Inner Bag Included",
          "Water-Resistant Fabric",
          "Not Included",
        ],
      },
      {
        key: "convertible_in_backpack",
        label: "Backpack / Shoulder Conversion",
        placeholder: "e.g. Yes - Converts to Backpack",
        presets: [
          "Yes - Converts to Backpack with Concealable Straps",
          "Yes - Detachable Shoulder Sling Included",
          "No",
        ],
      },
      {
        key: "material",
        label: "Fabric & Outer Construction",
        placeholder: "e.g. 1680D Ballistic Nylon",
        presets: [
          "1680D Ballistic Nylon with PVC Coating",
          "1000D Cordura with PU Coating",
          "500D PVC Tarpaulin (Seamless Welded)",
        ],
      },
    ],
  },
  "Chain Lubes / Liquids": {
    title: "Chain Lubes, Oils & Bike Care Technical Specifications",
    subtitle: "Net volume in ml, lubricant chemistry, chain ring safety & dispenser",
    icon: "wrench",
    fields: [
      {
        key: "weight_in_ml",
        label: "Net Volume / Quantity",
        placeholder: "e.g. 150 ml / 400 ml",
        presets: [
          "150 ml (Pocket / Touring Can)",
          "400 ml (Standard Aerosol Can)",
          "500 ml (Workshop Can)",
          "1000 ml / 1 Litre",
        ],
      },
      {
        key: "formulation",
        label: "Chemical Formulation",
        placeholder: "e.g. Synthetic White Chain Lube",
        presets: [
          "Synthetic White Chain Lube (O/X/Z Ring Safe)",
          "Clear / Dry Chain Lube (High Anti-Fling)",
          "Heavy Duty Foaming Chain Cleaner",
          "Waterless Bike Wash & Detailer",
        ],
      },
      {
        key: "application_type",
        label: "Application Method",
        placeholder: "e.g. Aerosol Spray with Nozzle Tube",
        presets: [
          "Aerosol Spray with Precision Nozzle Straw",
          "High-Pressure Aerosol Spray",
          "Trigger Spray Bottle",
          "Pour Bottle with Measuring Cap",
        ],
      },
    ],
  },
  "Spares, Accessories, Exhausts": {
    title: "Bike Spares, Exhausts & Guards Technical Specifications",
    subtitle: "Motorcycle model compatibility, bolt-on fitment, placement & materials",
    icon: "wrench",
    fields: [
      {
        key: "motorcycle_model",
        label: "Compatible Motorcycle Model(s)",
        placeholder: "e.g. Royal Enfield Himalayan 450 / KTM Duke 390",
        presets: [
          "Royal Enfield Himalayan 450",
          "Royal Enfield Hunter / Classic 350",
          "KTM Duke 250 / 390",
          "KTM Adventure 390",
          "Honda CBR 250R",
          "Universal Fit",
        ],
      },
      {
        key: "bike_compatibility",
        label: "Fitment Type",
        placeholder: "e.g. Direct Bolt-on",
        presets: [
          "Direct Bolt-on (No Modifications Required)",
          "Universal Fitment (Fits Most Motorcycles)",
          "Specific Clamp / Bracket Required",
        ],
      },
      {
        key: "placement",
        label: "Mounting Location / Position",
        placeholder: "e.g. Radiator Guard / Exhaust",
        presets: [
          "Radiator (Radiator Guard)",
          "Exhaust / Slip-on Mid-Pipe",
          "Handlebar / Risers",
          "Engine Frame (Crash Guard / Slider)",
          "Wheel / Axle Slider",
        ],
      },
      {
        key: "material",
        label: "Construction Material & Finish",
        placeholder: "e.g. T304 Stainless Steel / CNC Aluminum",
        presets: [
          "T304 Stainless Steel",
          "CNC Machined 6061-T6 Billet Aluminum",
          "Carbon Fiber Shell",
          "Powder Coated Mild Steel",
        ],
      },
    ],
  },
  Communicator: {
    title: "Communicators & Electronics Technical Specifications",
    subtitle: "Bluetooth specification, intercom range, rider mesh & battery endurance",
    icon: "sliders",
    fields: [
      {
        key: "bluetooth_ready",
        label: "Bluetooth Specification",
        placeholder: "e.g. Bluetooth 5.2",
        presets: [
          "Bluetooth 5.2",
          "Bluetooth 5.1",
          "Bluetooth 5.0",
          "Bluetooth 4.1",
        ],
      },
      {
        key: "intercom_range",
        label: "Intercom Mesh & Range",
        placeholder: "e.g. Up to 1.2 km (4 Riders)",
        presets: [
          "Up to 1.2 km (4 Riders Conference)",
          "Up to 1.6 km (Mesh Intercom 24+ Riders)",
          "Up to 800m (2 Riders Rider-to-Pillion)",
          "Universal Intercom Pairing",
        ],
      },
      {
        key: "battery_runtime",
        label: "Battery Life / Talk Time",
        placeholder: "e.g. Up to 15 Hours Talk Time",
        presets: [
          "Up to 15 Hours Talk Time (1000mAh)",
          "Up to 20 Hours Talk Time",
          "Up to 10 Hours Talk Time",
        ],
      },
      {
        key: "waterproof",
        label: "Weather Resistance",
        placeholder: "e.g. IP67 Waterproof",
        presets: [
          "IP67 Waterproof & Dustproof",
          "IP65 Water Resistant",
          "Weatherproof Sealed",
        ],
      },
    ],
  },
  Default: {
    title: "General Product Specifications",
    subtitle: "Standard material, waterproofing, warranty and country of origin",
    icon: "sliders",
    fields: [
      {
        key: "material",
        label: "Material / Construction",
        placeholder: "e.g. High-Grade Polymer / Aluminum",
        presets: [
          "High-Grade Polymer",
          "CNC Aluminum Alloy",
          "Textile & Mesh",
          "Genuine Leather",
        ],
      },
      {
        key: "waterproof",
        label: "Water Resistance",
        placeholder: "e.g. Water-Resistant",
        presets: [
          "100% Waterproof",
          "Water-Resistant",
          "Not Waterproof",
        ],
      },
      {
        key: "country_of_origin",
        label: "Country of Origin",
        placeholder: "e.g. India",
        presets: [
          "India",
          "Italy",
          "Spain",
          "Japan",
          "Vietnam",
        ],
      },
      {
        key: "warranty",
        label: "Warranty Period",
        placeholder: "e.g. 1 Year Manufacturer Warranty",
        presets: [
          "1 Year Manufacturer Warranty",
          "2 Years Manufacturer Warranty",
          "6 Months Warranty",
          "No Warranty",
        ],
      },
    ],
  },
};

export function detectAttributeSetFromCategory(catIdOrSlug: string, categories: any[]): string {
  if (!catIdOrSlug) return "Default";

  const findInTree = (nodes: any[]): string => {
    for (const node of nodes) {
      if (node._id === catIdOrSlug || node.slug === catIdOrSlug) {
        return node.name || node.slug;
      }
      if (node.children?.length) {
        const found = findInTree(node.children);
        if (found) return found;
      }
    }
    return "";
  };

  const categoryName = findInTree(categories) || catIdOrSlug;
  const target = (categoryName + " " + catIdOrSlug).toLowerCase();

  if (target.includes("helmet") || target.includes("visor")) return "Helmets";
  if (
    target.includes("jacket") ||
    target.includes("suit") ||
    target.includes("pant") ||
    target.includes("jeans") ||
    target.includes("armour") ||
    target.includes("protector") ||
    target.includes("knee")
  ) {
    return "Jackets";
  }
  if (target.includes("glove")) return "Gloves";
  if (target.includes("boot") || target.includes("shoe")) return "Boots";
  if (
    target.includes("bag") ||
    target.includes("luggage") ||
    target.includes("saddle") ||
    target.includes("tank") ||
    target.includes("tail") ||
    target.includes("pannier") ||
    target.includes("hydration")
  ) {
    return "Saddle Bag";
  }
  if (
    target.includes("oil") ||
    target.includes("lube") ||
    target.includes("clean") ||
    target.includes("care") ||
    target.includes("liquid")
  ) {
    return "Chain Lubes / Liquids";
  }
  if (
    target.includes("part") ||
    target.includes("spare") ||
    target.includes("exhaust") ||
    target.includes("radiator") ||
    target.includes("guard") ||
    target.includes("light") ||
    target.includes("mount")
  ) {
    return "Spares, Accessories, Exhausts";
  }
  if (
    target.includes("communicator") ||
    target.includes("gadget") ||
    target.includes("bluetooth") ||
    target.includes("phone holder")
  ) {
    return "Communicator";
  }

  return "Default";
}

export const COLOR_OPTIONS = [
  { label: "Black", value: "Black" },
  { label: "White", value: "White" },
  { label: "Red", value: "Red" },
  { label: "Blue", value: "Blue" },
  { label: "Fluorescent Yellow", value: "Fluorescent Yellow" },
  { label: "Grey", value: "Grey" },
  { label: "Silver", value: "Silver" },
  { label: "Matte Black", value: "Matte Black" },
  { label: "Gloss Black", value: "Gloss Black" },
  { label: "Clear", value: "Clear" },
  { label: "Smoke", value: "Smoke" }
];

export const SIZE_OPTIONS = [
  { label: "Apparel: XS", value: "XS" },
  { label: "Apparel: S", value: "S" },
  { label: "Apparel: M", value: "M" },
  { label: "Apparel: L", value: "L" },
  { label: "Apparel: XL", value: "XL" },
  { label: "Apparel: 2XL", value: "2XL" },
  { label: "Apparel: 3XL", value: "3XL" },
  { label: "Shoes: UK 6 / EU 40", value: "40" },
  { label: "Shoes: UK 7 / EU 41", value: "41" },
  { label: "Shoes: UK 8 / EU 42", value: "42" },
  { label: "Shoes: UK 9 / EU 43", value: "43" },
  { label: "Shoes: UK 10 / EU 44", value: "44" },
  { label: "Shoes: UK 11 / EU 45", value: "45" },
  { label: "Volume: 50ml", value: "50ml" },
  { label: "Volume: 150ml", value: "150ml" },
  { label: "Volume: 250ml", value: "250ml" },
  { label: "Volume: 400ml", value: "400ml" },
  { label: "Volume: 500ml", value: "500ml" },
  { label: "Volume: 1L", value: "1L" },
  { label: "Volume: 2L", value: "2L" }
];
