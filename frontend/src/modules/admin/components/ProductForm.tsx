"use client";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { MultiSkuAutocomplete } from "@/components/ui/MultiSkuAutocomplete";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, Save, Plus, Trash2, Star, Upload, Link as LinkIcon, 
  HelpCircle, Eye, AlertCircle, CheckCircle2, Sparkles, Layers,
  DollarSign, Image as ImageIcon, Sliders, GitBranch, Share2, Search,
  ChevronDown, ChevronLeft, ChevronRight, Check, X, Camera, Shield, Package, Wrench
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { useBrands, useCreateBrand } from "@/core/hooks/useBrands";
import { useCategoryTree } from "@/core/hooks/useCategories";
import { useCreateProduct, useUpdateProduct, useProductBySlug } from "@/core/hooks/useProducts";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ModernCategorySelect } from "@/components/ui/ModernCategorySelect";
import Modal from "@/components/ui/Modal";
import { StorefrontCardPreview } from "./StorefrontCardPreview";

export interface ISpecDefinition {
  key: string;
  label: string;
  placeholder: string;
  presets: string[];
}

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

interface ProductFormProps {
  mode: "create" | "edit";
  initialSlugOrId?: string;
}


const COLOR_OPTIONS = [
  { label: "Black", value: "Black" }, { label: "White", value: "White" }, { label: "Red", value: "Red" }, { label: "Blue", value: "Blue" },
  { label: "Fluorescent Yellow", value: "Fluorescent Yellow" }, { label: "Grey", value: "Grey" }, { label: "Silver", value: "Silver" },
  { label: "Matte Black", value: "Matte Black" }, { label: "Gloss Black", value: "Gloss Black" }, { label: "Clear", value: "Clear" },
  { label: "Smoke", value: "Smoke" }
];
const SIZE_OPTIONS = [
  { label: "Apparel: XS", value: "XS" }, { label: "Apparel: S", value: "S" }, { label: "Apparel: M", value: "M" }, { label: "Apparel: L", value: "L" },
  { label: "Apparel: XL", value: "XL" }, { label: "Apparel: 2XL", value: "2XL" }, { label: "Apparel: 3XL", value: "3XL" },
  { label: "Shoes: UK 6 / EU 40", value: "40" }, { label: "Shoes: UK 7 / EU 41", value: "41" }, { label: "Shoes: UK 8 / EU 42", value: "42" },
  { label: "Shoes: UK 9 / EU 43", value: "43" }, { label: "Shoes: UK 10 / EU 44", value: "44" }, { label: "Shoes: UK 11 / EU 45", value: "45" },
  { label: "Volume: 50ml", value: "50ml" }, { label: "Volume: 150ml", value: "150ml" }, { label: "Volume: 250ml", value: "250ml" },
  { label: "Volume: 400ml", value: "400ml" }, { label: "Volume: 500ml", value: "500ml" }, { label: "Volume: 1L", value: "1L" }, { label: "Volume: 2L", value: "2L" }
];

export function ProductForm({ mode, initialSlugOrId }: ProductFormProps) {
  const router = useRouter();
  const { data: brands = [] } = useBrands();
  const createBrand = useCreateBrand();
  const { data: categoryTree = [] } = useCategoryTree();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // If edit mode, load product data
  const { data: existingProduct, isLoading: isLoadingProduct } = useProductBySlug(
    mode === "edit" ? (initialSlugOrId || "") : ""
  );

  const [activeTab, setActiveTab] = useState<
    "basic" | "pricing" | "media" | "specs" | "variants" | "relations" | "seo"
  >("basic");

  // Final Review & Submit Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  // Quick Brand Modal State
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandSlug, setNewBrandSlug] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const [newBrandShowInMenu, setNewBrandShowInMenu] = useState(true);
  const [newBrandMenuGroup, setNewBrandMenuGroup] = useState("Featured Brands");
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);
  const brandLogoInputRef = React.useRef<HTMLInputElement>(null);

  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState<"simple" | "configurable">("simple");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [visibility, setVisibility] = useState("Catalog, Search");
  const [countryOfManufacture, setCountryOfManufacture] = useState("");
  const [taxClassName, setTaxClassName] = useState("Taxable Goods (GST 18%)");
  const [isCustomTaxRate, setIsCustomTaxRate] = useState(false);
  const [customTaxRateInput, setCustomTaxRateInput] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "g" | "ml" | "L">("kg");
  const [isFeatured, setIsFeatured] = useState(false);
  const [showFeaturedBadge, setShowFeaturedBadge] = useState(false);
  const [isFreeShipping, setIsFreeShipping] = useState(false);

  // Pricing & Inventory
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [specialPrice, setSpecialPrice] = useState<number | "">("");
  const [specialPriceFromDate, setSpecialPriceFromDate] = useState("");
  const [specialPriceToDate, setSpecialPriceToDate] = useState("");
  const [mapPrice, setMapPrice] = useState<number | "">("");
  const [msrpPrice, setMsrpPrice] = useState<number | "">("");
  const [stockStatus, setStockStatus] = useState<number>(1);
  const [qty, setQty] = useState<number | "">(10);
  const [outOfStockQty, setOutOfStockQty] = useState<number | "">(0);
  const [minCartQty, setMinCartQty] = useState<number | "">(1);
  const [maxCartQty, setMaxCartQty] = useState<number | "">(10);
  const [notifyOnStockBelow, setNotifyOnStockBelow] = useState<number | "">(2);
  const [allowBackorders, setAllowBackorders] = useState(false);

  // Images & Media
  const [images, setImages] = useState<Array<{ id: string; url: string; altText: string; isBase?: boolean }>>([]);
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [manualImageAlt, setManualImageAlt] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionBadge, setCompressionBadge] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const [attributeSetCode, setAttributeSetCode] = useState<string>("");
  const [gender, setGender] = useState("");
  const [shippingFee, setShippingFee] = useState<number | "">("");
  const [customAttributes, setCustomAttributes] = useState<Array<{ key: string; value: string }>>([]);

  const applySizePreset = (type: "volume" | "apparel" | "footwear" | "waist") => {
    let sizes: string[] = [];
    if (type === "volume") sizes = ["50ml", "100ml", "150ml", "250ml", "500ml", "1L"];
    if (type === "apparel") sizes = ["XS", "S", "M", "L", "XL", "2XL"];
    if (type === "footwear") sizes = ["EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"];
    if (type === "waist") sizes = ["30", "32", "34", "36", "38", "40"];

    const currentColor = variants[0]?.color || "Standard";
    const newVariants = sizes.map((s) => ({
      id: crypto.randomUUID(),
      sku: `${sku || "SKU"}-${s.replace(/\s+/g, "")}`,
      color: currentColor,
      size: s,
      price: basePrice || 0,
      stock: 10,
    }));
    setVariants((prev) => [...prev, ...newVariants]);
  };

  // Helper to read an attribute value from customAttributes
  const getAttr = (key: string): string => {
    const found = customAttributes.find((a) => a.key.toLowerCase() === key.toLowerCase());
    return found ? found.value : "";
  };

  // Helper to update an attribute value in customAttributes
  const setAttr = (key: string, value: string) => {
    setCustomAttributes((prev) => {
      const idx = prev.findIndex((a) => a.key.toLowerCase() === key.toLowerCase());
      if (idx !== -1) {
        if (!value.trim()) {
          return prev.filter((_, i) => i !== idx);
        }
        return prev.map((item, i) => (i === idx ? { ...item, value: value.trim() } : item));
      } else {
        if (!value.trim()) return prev;
        return [...prev, { key, value: value.trim() }];
      }
    });
  };

  // Active template derived from attributeSetCode or detected from category
  const activeTemplate = useMemo(() => {
    if (attributeSetCode && attributeSetCode !== "Default") {
      const lower = attributeSetCode.toLowerCase();
      if (lower.includes("helmet")) return "Helmets";
      if (lower.includes("jacket") || lower.includes("pant") || lower.includes("suit") || lower.includes("racing")) return "Jackets";
      if (lower.includes("glove")) return "Gloves";
      if (lower.includes("boot")) return "Boots";
      if (lower.includes("saddle") || lower.includes("tank") || lower.includes("hydration") || lower.includes("bag")) return "Saddle Bag";
      if (lower.includes("lube") || lower.includes("liquid") || lower.includes("care") || lower.includes("oil")) return "Chain Lubes / Liquids";
      if (lower.includes("spare") || lower.includes("exhaust") || lower.includes("cover")) return "Spares, Accessories, Exhausts";
      if (lower.includes("communicator") || lower.includes("gadget")) return "Communicator";
      return attributeSetCode;
    }
    return detectAttributeSetFromCategory(categoryId, categoryTree);
  }, [attributeSetCode, categoryId, categoryTree]);

  const currentSpecDefinition = CATEGORY_SPEC_DEFINITIONS[activeTemplate] || CATEGORY_SPEC_DEFINITIONS.Default;

  const activeCategoryFieldKeys = useMemo(() => {
    if (!currentSpecDefinition) return [];
    return currentSpecDefinition.fields.map((f) => f.key.toLowerCase());
  }, [currentSpecDefinition]);

  const additionalCustomAttributes = useMemo(() => {
    return customAttributes.filter(
      (a) => !activeCategoryFieldKeys.includes(a.key.trim().toLowerCase())
    );
  }, [customAttributes, activeCategoryFieldKeys]);

  // Variants (Configurable)
  const [variants, setVariants] = useState<Array<{
    id?: string;
    sku: string;
    color: string;
    size: string;
    price: number | "";
    specialPrice?: number | "";
    stock: number | "";
    imageUrl?: string;
    weight?: number | "";
    status?: "enabled" | "disabled";
    visibility?: string;
    images?: Array<{ id: string; url: string; altText?: string }>;
  }>>([]);

  // Variant Image Picker Modal State
  const [variantImageModalIndex, setVariantImageModalIndex] = useState<number | null>(null);
  const [isUploadingVariantImage, setIsUploadingVariantImage] = useState(false);
  const [applyToAllSameColor, setApplyToAllSameColor] = useState(true);

  // Relationships
  const [relatedSkusInput, setRelatedSkusInput] = useState("");
  const [upsellSkusInput, setUpsellSkusInput] = useState("");
  const [crosssellSkusInput, setCrosssellSkusInput] = useState("");

  // Content, SEO & FAQs
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [sizeChart, setSizeChart] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);

  // Populate data on edit mode
  useEffect(() => {
    if (mode === "edit" && existingProduct) {
      setName(existingProduct.name || "");
      setSku(existingProduct.sku || "");
      setSlug(existingProduct.slug || "");
      setBrand(existingProduct.brand || "");
      setCategoryId(existingProduct.categoryId || "");
      setProductType((existingProduct.productType as any) || "simple");
      setStatus(existingProduct.status || "published");
      setVisibility(existingProduct.visibility || "Catalog, Search");
      setCountryOfManufacture(existingProduct.countryOfManufacture || "");
      const loadedTax = existingProduct.taxClassName || "Taxable Goods (GST 18%)";
      setTaxClassName(loadedTax);
      const taxMatch = loadedTax.match(/(\d+(?:\.\d+)?)/);
      if (taxMatch) {
        const rate = parseFloat(taxMatch[1]);
        const standardRates = [0, 5, 12, 18, 28];
        if (!standardRates.includes(rate)) {
          setIsCustomTaxRate(true);
          setCustomTaxRateInput(rate);
        } else {
          setIsCustomTaxRate(false);
        }
      }
      setWeight(existingProduct.weight ?? "");
      setIsFeatured(Boolean(existingProduct.isFeatured));
      setShowFeaturedBadge(
        Boolean(
          (existingProduct as any).showFeaturedBadge ||
          existingProduct.attributes?.show_featured_badge === "true" ||
          existingProduct.attributes?.showFeaturedBadge === "true"
        )
      );
      setIsFreeShipping(Boolean(existingProduct.isFreeShipping));

      setBasePrice(existingProduct.basePrice ?? "");
      setSpecialPrice(existingProduct.specialPrice ?? "");
      setSpecialPriceFromDate(existingProduct.specialPriceFromDate ? String(existingProduct.specialPriceFromDate).slice(0, 10) : "");
      setSpecialPriceToDate(existingProduct.specialPriceToDate ? String(existingProduct.specialPriceToDate).slice(0, 10) : "");
      setMapPrice(existingProduct.mapPrice ?? "");
      setMsrpPrice(existingProduct.msrpPrice ?? "");
      setStockStatus(existingProduct.stockStatus ?? 1);
      setQty(existingProduct.qty ?? 10);
      setOutOfStockQty(existingProduct.outOfStockQty ?? 0);
      setMinCartQty(existingProduct.minCartQty ?? 1);
      setMaxCartQty(existingProduct.maxCartQty ?? 10);
      setNotifyOnStockBelow(existingProduct.notifyOnStockBelow ?? 2);
      setAllowBackorders(Boolean(existingProduct.allowBackorders));

      // Images
      if (existingProduct.images && Array.isArray(existingProduct.images)) {
        setImages(existingProduct.images.map((img, idx) => ({
          id: img.id || String(idx),
          url: img.url,
          altText: img.altText || "",
          isBase: idx === 0
        })));
      }
      setVideoUrl(existingProduct.videoUrl || "");

      // Attributes & Technical Specifications (100% database & CSV driven)
      const attrs = existingProduct.attributes || {};
      const detectedSet = existingProduct.attributeSetCode || attrs.attribute_set_code || "";
      setAttributeSetCode(detectedSet);

      if (existingProduct.gender || attrs.gender) {
        setGender(existingProduct.gender || attrs.gender || "");
      }

      if (attrs.ship_cost) {
        setShippingFee(Number(attrs.ship_cost));
      }

      // Load all real attributes from DB/CSV directly as Key-Value pairs
      const internalKeys = ["attribute_set_code", "brand", "gender", "ship_cost", "weight_unit"];
      const customList: Array<{ key: string; value: string }> = [];
      Object.entries(attrs).forEach(([k, v]) => {
        if (!internalKeys.includes(k) && v !== null && v !== undefined && v !== "") {
          customList.push({ key: k, value: String(v) });
        }
      });
      setCustomAttributes(customList);

      // Variants
      if (existingProduct.variants && Array.isArray(existingProduct.variants)) {
        setVariants(existingProduct.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          color: v.attributes?.color || v.attributes?.colour || "",
          size: v.attributes?.size || "",
          price: v.price,
          specialPrice: v.specialPrice,
          stock: v.stock,
          imageUrl: v.imageUrl,
          weight: (v as any).weight ?? "",
          status: (v as any).status || "enabled",
          visibility: (v as any).visibility || "Catalog, Search",
          images: (v as any).images || [],
        })));
      }

      // Relations
      setRelatedSkusInput(existingProduct.relatedSkus?.join(", ") || "");
      setUpsellSkusInput(existingProduct.upsellSkus?.join(", ") || "");
      setCrosssellSkusInput(existingProduct.crosssellSkus?.join(", ") || "");

      // Content & SEO
      setShortDescription(existingProduct.shortDescription || "");
      setDescription(existingProduct.description || "");
      setSizeChart(existingProduct.sizeChart || existingProduct.size_chart || "");
      setMetaTitle(existingProduct.metaTitle || "");
      setMetaDescription(existingProduct.metaDescription || "");
      setMetaKeywords(existingProduct.metaKeywords || "");
      setFaqs(existingProduct.faqs || []);
    }
  }, [mode, existingProduct]);

  // Handle Client-Side WebP Compression & Upload for Gallery
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setCompressionBadge("Compressing to WebP (0.85 quality)...");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { file: webpFile, originalSize, compressedSize } = await compressImageToWebP(file, 1600, 0.85);

        const origKb = Math.round(originalSize / 1024);
        const compKb = Math.round(compressedSize / 1024);
        setCompressionBadge(`Compressed: ${origKb} KB ➔ ${compKb} KB (WebP). Uploading...`);

        let finalUrl = "";
        try {
          finalUrl = await uploadImageToS3(webpFile);
        } catch (uploadErr) {
          console.warn("S3 upload failed, using object URL fallback", uploadErr);
          finalUrl = URL.createObjectURL(webpFile);
          toast.warning("S3 credentials inactive. Image saved with temporary URL.");
        }

        setImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            url: finalUrl,
            altText: name || file.name.replace(/\.[^/.]+$/, ""),
            isBase: prev.length === 0
          }
        ]);
      }
      toast.success("Images compressed and attached successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process images");
    } finally {
      setIsCompressing(false);
      setCompressionBadge(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: manualImageUrl.trim(),
        altText: manualImageAlt.trim() || name,
        isBase: prev.length === 0
      }
    ]);
    setManualImageUrl("");
    setManualImageAlt("");
    toast.success("Image URL added to gallery");
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isBase: i === index
      }))
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isBase)) {
        updated[0].isBase = true;
      }
      return updated;
    });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const item = next.splice(fromIndex, 1)[0];
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  // Upload/attach image to specific child variant
  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (variantImageModalIndex === null) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVariantImage(true);
    try {
      const { file: webpFile } = await compressImageToWebP(file, 1200, 0.85);
      let finalUrl = "";
      try {
        finalUrl = await uploadImageToS3(webpFile);
      } catch (uploadErr) {
        finalUrl = URL.createObjectURL(webpFile);
      }

      const targetColor = variants[variantImageModalIndex]?.color;
      setVariants((prev) =>
        prev.map((v, i) => {
          if (i === variantImageModalIndex) return { ...v, imageUrl: finalUrl };
          if (applyToAllSameColor && targetColor && v.color.toLowerCase() === targetColor.toLowerCase()) {
            return { ...v, imageUrl: finalUrl };
          }
          return v;
        })
      );
      toast.success(
        applyToAllSameColor && targetColor
          ? `Variant image updated for all "${targetColor}" variants!`
          : "Variant image updated!"
      );
      setVariantImageModalIndex(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload variant image");
    } finally {
      setIsUploadingVariantImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Submit Handler: Validates and opens Final Review Modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      setActiveTab("basic");
      return;
    }

    if (!sku.trim()) {
      toast.error("Product SKU is required");
      setActiveTab("basic");
      return;
    }

    if (basePrice === "" || Number(basePrice) < 0) {
      toast.error("Valid base price is required");
      setActiveTab("pricing");
      return;
    }

    setIsReviewModalOpen(true);
  };

  // Final Execution: Called when Admin clicks "Confirm & Save Product" in Review Modal
  const executeSave = async () => {
    if (!name.trim() || !sku.trim() || basePrice === "" || Number(basePrice) < 0) {
      toast.error("Please fill in all required fields (Name, SKU, Base Price)");
      setIsReviewModalOpen(false);
      return;
    }

    // Build Attributes Map
    const attributesMap: Record<string, string> = {};
    if (attributeSetCode) attributesMap.attribute_set_code = attributeSetCode;
    if (brand) attributesMap.brand = brand;
    if (gender) attributesMap.gender = gender;
    if (weightUnit) attributesMap.weight_unit = weightUnit;

    if (shippingFee !== "" && Number(shippingFee) > 0) {
      attributesMap.ship_cost = String(shippingFee);
    }

    customAttributes.forEach((attr) => {
      const k = attr.key.trim();
      const v = attr.value.trim();
      if (k && v) {
        attributesMap[k] = v;
      }
    });

    if (isFeatured && showFeaturedBadge) {
      attributesMap.show_featured_badge = "true";
    }

    const sortedImages = [...images].sort((a, b) => (b.isBase ? 1 : 0) - (a.isBase ? 1 : 0));

    const payload: any = {
      name: name.trim(),
      sku: sku.trim(),
      slug: slug.trim() || undefined,
      brand: brand.trim() || undefined,
      categoryId: categoryId || undefined,
      attributeSetCode,
      productType,
      status,
      visibility,
      countryOfManufacture: countryOfManufacture.trim() || undefined,
      taxClassName: taxClassName.trim() || undefined,
      weight: weight !== "" ? Number(weight) : undefined,
      isFeatured,
      showFeaturedBadge: Boolean(isFeatured && showFeaturedBadge),
      isFreeShipping: (shippingFee !== "" && Number(shippingFee) > 0) ? false : isFreeShipping,

      basePrice: Number(basePrice),
      specialPrice: specialPrice !== "" ? Number(specialPrice) : undefined,
      specialPriceFromDate: specialPriceFromDate ? new Date(specialPriceFromDate) : undefined,
      specialPriceToDate: specialPriceToDate ? new Date(specialPriceToDate) : undefined,
      mapPrice: mapPrice !== "" ? Number(mapPrice) : undefined,
      msrpPrice: msrpPrice !== "" ? Number(msrpPrice) : undefined,
      stockStatus: Number(stockStatus),
      qty: qty !== "" ? Number(qty) : 0,
      outOfStockQty: outOfStockQty !== "" ? Number(outOfStockQty) : undefined,
      minCartQty: minCartQty !== "" ? Number(minCartQty) : undefined,
      maxCartQty: maxCartQty !== "" ? Number(maxCartQty) : undefined,
      notifyOnStockBelow: notifyOnStockBelow !== "" ? Number(notifyOnStockBelow) : undefined,
      allowBackorders,

      images: sortedImages.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || name
      })),
      videoUrl: videoUrl.trim() || undefined,

      attributes: attributesMap,
      gender: gender.trim() || undefined,

      variants: variants.map((v) => ({
        id: v.id || crypto.randomUUID(),
        sku: v.sku.trim(),
        price: v.price !== "" ? Number(v.price) : Number(basePrice),
        specialPrice: v.specialPrice !== "" && v.specialPrice !== undefined ? Number(v.specialPrice) : undefined,
        stock: v.stock !== "" ? Number(v.stock) : 0,
        imageUrl: v.imageUrl,
        weight: v.weight !== "" && v.weight !== undefined ? Number(v.weight) : undefined,
        status: v.status || "enabled",
        visibility: v.visibility || "Catalog, Search",
        images: v.images || [],
        attributes: {
          ...(v.color ? { color: v.color } : {}),
          ...(v.size ? { size: v.size } : {})
        }
      })),

      relatedSkus: relatedSkusInput.split(",").map((s) => s.trim()).filter(Boolean),
      upsellSkus: upsellSkusInput.split(",").map((s) => s.trim()).filter(Boolean),
      crosssellSkus: crosssellSkusInput.split(",").map((s) => s.trim()).filter(Boolean),

      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || "",
      sizeChart: sizeChart.trim() || undefined,

      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaKeywords: metaKeywords.trim() || undefined,
      faqs: faqs.filter((f) => f.question.trim() && f.answer.trim())
    };

    try {
      if (mode === "create") {
        await createProduct.mutateAsync(payload);
        toast.success("Product created successfully!");
        setIsReviewModalOpen(false);
        router.push("/admin/products");
      } else {
        const id = existingProduct?._id || initialSlugOrId;
        if (!id) throw new Error("Product ID not found for update");
        await updateProduct.mutateAsync({ id, data: payload });
        toast.success("Product updated successfully!");
        setIsReviewModalOpen(false);
        router.push("/admin/products");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to save product");
    }
  };

  if (mode === "edit" && isLoadingProduct) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium">Loading product details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "create" ? "Add New Product" : `Edit Product: ${existingProduct?.name || ""}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise Catalog Manager — Complete product specifications & multi-category gear attributes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!name.trim()) {
                toast.error("Please enter a product name first");
                setActiveTab("basic");
                return;
              }
              setIsReviewModalOpen(true);
            }}
            className="text-xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border-slate-300 cursor-pointer shadow-2xs"
          >
            <Eye size={15} />
            <span>Preview Customer Card</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            className="text-slate-700 bg-white hover:bg-slate-50 border-slate-300 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createProduct.isPending || updateProduct.isPending}
            className="flex items-center space-x-2 bg-brand hover:bg-brand/90 text-white font-semibold shadow-md px-5 text-xs"
          >
            <Save size={16} />
            <span>{createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto scrollbar-none pb-px">
        {[
          { id: "basic", label: "Basic & Identity", icon: Layers },
          { id: "pricing", label: "Pricing & Stock", icon: DollarSign },
          { id: "media", label: "Media & Images", icon: ImageIcon, badge: images.length },
          { id: "specs", label: "Specifications & Attributes", icon: Sliders },
          { id: "variants", label: "Variants (Sizes/Volume/Colors)", icon: GitBranch, badge: variants.length },
          { id: "relations", label: "Related & Upsell", icon: Share2 },
          { id: "seo", label: "Content, Rich Editor & SEO", icon: Search, badge: faqs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-brand text-brand font-semibold bg-brand/5 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BASIC & IDENTITY */}
      {activeTab === "basic" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="text-brand" size={18} />
            Product Identity & Categorization
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Motul C2 Chain Lube 400ml / Axor Apex Helmet"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SKU (Stock Keeping Unit) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. MOT-C2-400ML / AX-APEX-01"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL Key / Slug (SEO Route)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="Leave blank to auto-generate from name"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Brand
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewBrandName("");
                    setNewBrandSlug("");
                    setNewBrandLogo("");
                    setNewBrandShowInMenu(true);
                    setNewBrandMenuGroup("Featured Brands");
                    setIsAddBrandOpen(true);
                  }}
                  className="text-xs text-brand font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  + Add New Brand
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                  {brand && !brands.some((b) => b.name.toLowerCase() === brand.toLowerCase()) && (
                    <option value={brand}>{brand} (Custom)</option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setNewBrandName("");
                    setNewBrandSlug("");
                    setNewBrandLogo("");
                    setNewBrandShowInMenu(true);
                    setNewBrandMenuGroup("Featured Brands");
                    setIsAddBrandOpen(true);
                  }}
                  className="px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  title="Create new brand with logo & submenu settings"
                >
                  <Plus size={14} />
                  New Brand
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Choose an existing brand or create a custom one with logo & navigation submenu settings.
              </p>
            </div>

            {/* Modern Searchable Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Store Category <span className="text-red-500">*</span>
              </label>
              <ModernCategorySelect
                value={categoryId}
                onChange={(catVal) => {
                  setCategoryId(catVal);
                  if (!attributeSetCode || attributeSetCode === "Default") {
                    const detected = detectAttributeSetFromCategory(catVal, categoryTree);
                    if (detected && detected !== "Default") {
                      setAttributeSetCode(detected);
                    }
                  }
                }}
                dbCategories={categoryTree}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Searchable megamenu & database categories (Helmets, Riding Gear, Luggage, Bike Accessories, Care).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Type
              </label>
              <SearchableSelect
                  options={[
                    { label: "Simple Product (Fixed size / Single unit)", value: "simple" },
                    { label: "Configurable Product (Multiple sizes / colors)", value: "configurable" }
                  ]}
                  value={productType}
                  onChange={(val: string) => setProductType(val as any)}
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Catalog Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="published">Published (Visible to customers)</option>
                <option value="draft">Draft (Hidden in store)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="Catalog, Search">Catalog, Search (Default)</option>
                <option value="Catalog">Catalog Only</option>
                <option value="Search">Search Only</option>
                <option value="Not Visible Individually">Not Visible Individually (Child variant)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weight / Volume Unit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 1.6 or 400"
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as any)}
                  className="w-24 px-2 py-2.5 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                >
                  <option value="kg">kg</option>
                  <option value="g">grams</option>
                  <option value="ml">ml (Liquid)</option>
                  <option value="L">Litres</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Helmets in kg, lubes/sprays in ml, gear in grams.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Country of Manufacture
              </label>
              <input
                type="text"
                value={countryOfManufacture}
                onChange={(e) => setCountryOfManufacture(e.target.value)}
                placeholder="e.g. India, Italy, France"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-colors">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => {
                      setIsFeatured(e.target.checked);
                      if (!e.target.checked) setShowFeaturedBadge(false);
                    }}
                    className="rounded text-brand focus:ring-brand h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      ⭐ Mark as Featured Product
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      <strong>What this does:</strong> Pushes this product to the top (first row) of category and search listings, and includes it in homepage showcase collections.
                    </p>
                  </div>
                </label>

                {isFeatured && (
                  <div className="ml-6 pl-3 border-l-2 border-slate-200 mt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFeaturedBadge}
                        onChange={(e) => setShowFeaturedBadge(e.target.checked)}
                        className="rounded text-brand focus:ring-brand h-3.5 w-3.5 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-700">
                          Show &quot;★ FEATURED&quot; badge text on card (Optional)
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Off by default so product cards stay clean with no overlay text. Check this only if you want an extra badge tag displayed over the product photo.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isFreeShipping}
                  onChange={(e) => setIsFreeShipping(e.target.checked)}
                  className="rounded text-brand focus:ring-brand h-4 w-4 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    🚚 Free Shipping Eligible
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Waives standard delivery charges for this product at checkout across all serviceable pincodes.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICING & INVENTORY */}
      {activeTab === "pricing" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="text-brand" size={18} />
            Pricing Rules & Warehouse Inventory
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Base Price / MRP (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 5499"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Special / Sale Price (₹)
              </label>
              <input
                type="number"
                value={specialPrice}
                onChange={(e) => setSpecialPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 4899 (Optional promotional price)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Special Price From Date
              </label>
              <input
                type="date"
                value={specialPriceFromDate}
                onChange={(e) => setSpecialPriceFromDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Special Price To Date
              </label>
              <input
                type="date"
                value={specialPriceToDate}
                onChange={(e) => setSpecialPriceToDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                MAP Price (Minimum Advertised Price)
              </label>
              <input
                type="number"
                value={mapPrice}
                onChange={(e) => setMapPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                MSRP Price (Manufacturer Suggested Retail Price)
              </label>
              <input
                type="number"
                value={msrpPrice}
                onChange={(e) => setMsrpPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="md:col-span-2 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-4">Stock & Warehouse Rules</h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stock Status
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value={1}>In Stock (1)</option>
                <option value={0}>Out of Stock (0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity Available (Qty)
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 10"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                value={notifyOnStockBelow}
                onChange={(e) => setNotifyOnStockBelow(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 2"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBackorders}
                  onChange={(e) => setAllowBackorders(e.target.checked)}
                  className="rounded text-brand focus:ring-brand h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">Allow Backorders when Out of Stock</span>
              </label>
            </div>

            {/* GST Tax Classification & Flexible Future Rate Slabs */}
            <div className="md:col-span-2 border-t border-slate-100 pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    GST Tax Classification & Rate
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Defines the GST rate applied to this product for customer invoices, cart calculation, and HSN filing.
                  </p>
                </div>
                {/* Active Rate Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 self-start sm:self-auto">
                  <span className="text-slate-500 font-medium">Applied Rate:</span>
                  <span className="text-brand font-black">
                    {taxClassName.match(/(\d+(?:\.\d+)?)/)?.[1] || "18"}% GST
                  </span>
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "18% Standard", desc: "Helmets, Jackets, Gloves, Boots, Luggage", value: "Taxable Goods (GST 18%)", rate: 18 },
                  { label: "12% Apparel", desc: "Textiles, Innerwear, Thermals", value: "Apparel & Textiles (GST 12%)", rate: 12 },
                  { label: "28% High-Rate", desc: "Performance Spares, Exhausts, Electronics", value: "Auto Spares & Parts (GST 28%)", rate: 28 },
                  { label: "5% Consumables", desc: "Oils, Lubricants, Cleaners", value: "Consumables & Lubricants (GST 5%)", rate: 5 },
                  { label: "0% Exempt", desc: "Manuals, Literature, Catalogs", value: "Exempt Goods (GST 0%)", rate: 0 },
                ].map((preset) => {
                  const isCurrent = !isCustomTaxRate && taxClassName === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setIsCustomTaxRate(false);
                        setTaxClassName(preset.value);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                      title={preset.desc}
                    >
                      <span>{preset.label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomTaxRate(true);
                    if (customTaxRateInput === "") {
                      setCustomTaxRateInput(20);
                      setTaxClassName("GST 20% (Custom Slab)");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCustomTaxRate
                      ? "bg-brand text-white border-brand shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span>+ Custom / Future Tax Slab</span>
                </button>
              </div>

              {/* Custom Tax Rate Configuration (For future tax revisions or special slabs) */}
              {isCustomTaxRate ? (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span>⚡</span> Custom / Future GST Rate Configuration
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Supports any future tax rate changes or cess
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tax Rate Percentage (%) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={customTaxRateInput}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setCustomTaxRateInput(val);
                            setTaxClassName(`GST ${val}% (Custom Slab)`);
                          }}
                          placeholder="e.g. 20 (if increased) or 15"
                          className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Custom Tax Class Label / Description
                      </label>
                      <input
                        type="text"
                        value={taxClassName}
                        onChange={(e) => setTaxClassName(e.target.value)}
                        placeholder="e.g. GST 20% (Revised 2027 Slab)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Select a standard GST tier above, or click <strong>+ Custom / Future Tax Slab</strong> to enter any updated government tax rate.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional Heavy Item Shipping Surcharge (₹)
              </label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Leave blank or 0 for regular store shipping rules"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Optional surcharge applied for heavy or oversized freight (e.g. hard panniers, exhaust systems, paddock stands). Overrides free shipping.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDIA & IMAGES */}
      {activeTab === "media" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <ImageIcon className="text-brand" size={18} />
                Gallery & Auto-WebP Compression
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Drop multiple product photos — automatically compressed to lossless WebP in browser and uploaded to S3.
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-brand/50 rounded-xl p-8 text-center transition-colors bg-slate-50/50">
            <Upload className="mx-auto text-slate-400 mb-3" size={36} />
            <p className="text-sm font-medium text-slate-700">
              Drag & Drop product images or <label className="text-brand hover:underline cursor-pointer">browse<input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isCompressing} /></label>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP up to 25MB (Auto-compressed to ~250KB WebP)
            </p>

            {isCompressing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-brand text-xs font-semibold">
                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                <span>{compressionBadge || "Processing..."}</span>
              </div>
            )}
          </div>

          {/* Manual URL input */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                placeholder="Or paste external Image URL (e.g. S3 or CDN link)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="w-48">
              <input
                type="text"
                value={manualImageAlt}
                onChange={(e) => setManualImageAlt(e.target.value)}
                placeholder="Alt label (optional)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <Button type="button" variant="outline" onClick={handleAddManualImage} className="text-xs">
              Add URL
            </Button>
          </div>

          {/* Images Grid */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-semibold text-slate-700">Product Gallery ({images.length} images)</h4>
              <p className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                💡 <strong>SEO & Swatch Tip:</strong> Set Alt text with the color name (e.g. <em>&quot;{name || "Product"} - Matte Black&quot;</em>) to auto-link with customer color swatches!
              </p>
            </div>
            {images.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No images attached yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`relative group bg-white border rounded-xl overflow-hidden shadow-2xs transition-all ${
                      img.isBase ? "ring-2 ring-brand border-transparent" : "border-slate-200"
                    }`}
                  >
                    <div className="relative aspect-square w-full bg-slate-100">
                      <Image
                        src={img.url}
                        alt={img.altText || "Product preview"}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                      {img.isBase ? (
                        <div className="absolute top-2 left-2 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Star size={10} fill="currentColor" />
                          <span>Parent Cover (Card Thumbnail)</span>
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                          <span>Photo #{idx + 1}</span>
                        </div>
                      )}

                      {/* Show if linked to a variant color */}
                      {variants.some((v) => v.imageUrl === img.url) && (
                        <div className="absolute bottom-2 left-2 bg-emerald-600/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span>Linked: {variants.find((v) => v.imageUrl === img.url)?.color}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 space-y-1.5 bg-white">
                      <input
                        type="text"
                        value={img.altText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImages((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, altText: val } : item))
                          );
                        }}
                        placeholder="Required: Image Alt text (e.g. Red, Black)" required
                        className="w-full text-[11px] px-1.5 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand"
                      />

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveImage(idx, idx - 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-slate-100 cursor-pointer"
                            title="Move Left"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => moveImage(idx, idx + 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-25 disabled:cursor-not-allowed rounded hover:bg-slate-100 cursor-pointer"
                            title="Move Right"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>

                        {!img.isBase ? (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="text-[11px] text-slate-600 hover:text-brand font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Star size={12} />
                            <span>Set Main</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Primary</span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                          title="Remove Image"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              YouTube / Video Embed URL
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Live Customer Storefront Card & Swatches Preview inside Media Tab */}
          <div className="border-t border-slate-200 pt-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Eye className="text-brand" size={16} />
                Live Customer Card & Thumbnail Preview
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify how your primary cover photo, brand, price, and color swatches appear to customers on catalog pages.
              </p>
            </div>

            <StorefrontCardPreview
              name={name}
              brand={brand}
              basePrice={basePrice}
              specialPrice={specialPrice}
              images={images}
              variants={variants}
              onSetPrimaryImage={(idx) => setPrimaryImage(idx)}
              onSelectColorPhoto={(targetColor) => {
                const idx = variants.findIndex(
                  (v) => (v.color || "Standard").toLowerCase() === targetColor.toLowerCase()
                );
                if (idx !== -1) {
                  setVariantImageModalIndex(idx);
                } else {
                  toast.info(`Please add a variant with color "${targetColor}" in Tab 5 first.`);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 4: SPECIFICATIONS & ATTRIBUTES (100% ACCURATE CATEGORY & DATABASE DRIVEN) */}
      {activeTab === "specs" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Sliders className="text-brand" size={18} />
                  Product Specifications & Attributes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Accurate, category-specific motorcycle attributes stored in MongoDB. Choose presets or enter custom values. All data syncs directly with the product catalog.
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                {customAttributes.length} Specifications Configured
              </span>
            </div>
          </div>

          {/* 1. Core Attributes Card */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Core Attributes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Brand Selector (100% synchronized with Tab 1) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBrandName("");
                      setNewBrandSlug("");
                      setNewBrandLogo("");
                      setNewBrandShowInMenu(true);
                      setNewBrandMenuGroup("Featured Brands");
                      setIsAddBrandOpen(true);
                    }}
                    className="text-[11px] text-brand font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={11} />
                    + New Brand
                  </button>
                </div>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                  {brand && !brands.some((b) => b.name.toLowerCase() === brand.toLowerCase()) && (
                    <option value={brand}>{brand} (Custom)</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Synced with Tab 1. Select from 32 database brands.
                </p>
              </div>

              {/* Rider Gender / Fit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender / Rider Fit
                </label>
                <SearchableSelect
                  options={[
                    { label: "-- Not Specified / General --", value: "" },
                    { label: "Men", value: "Men" },
                    { label: "Women", value: "Women" },
                    { label: "Unisex", value: "Unisex" },
                    { label: "Kids", value: "Kids" }
                  ]}
                  value={gender}
                  onChange={(val: string) => setGender(val)}
                  allowCustom
                  placeholder="Select Gender/Fit"
                />
                <p className="text-[10px] text-slate-400 mt-1">Rider fit classification</p>
              </div>

              {/* Custom Shipping Fee Override */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shipping Fee Override (₹)
                </label>
                <input
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Optional (e.g. 150)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave blank for default shipping rules</p>
              </div>

              {/* Specification Category Template Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Template
                </label>
                <select
                  value={attributeSetCode || activeTemplate}
                  onChange={(e) => setAttributeSetCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="Helmets">Helmets (Full Face, Modular, Visors)</option>
                  <option value="Jackets">Riding Jackets, Pants, Suits & Armor</option>
                  <option value="Gloves">Riding Gloves (Full Gauntlet, Short Cuff)</option>
                  <option value="Boots">Riding Boots & Footwear</option>
                  <option value="Saddle Bag">Bags & Luggage (Saddle, Tank, Tail Bags)</option>
                  <option value="Chain Lubes / Liquids">Chain Lubes, Oils & Bike Care</option>
                  <option value="Spares, Accessories, Exhausts">Bike Spares, Exhausts, Mounts & Guards</option>
                  <option value="Communicator">Bluetooth Communicators & Gadgets</option>
                  <option value="Default">General / Other Specifications</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Auto-detected from store category</p>
              </div>
            </div>
          </div>

          {/* 2. Category-Specific Accurate Technical Specifications */}
          {currentSpecDefinition && (
            <div className="p-5 bg-gradient-to-b from-slate-50/70 to-white rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand/10 text-brand rounded-lg">
                    {currentSpecDefinition.icon === "shield" && <Shield size={18} />}
                    {currentSpecDefinition.icon === "package" && <Package size={18} />}
                    {currentSpecDefinition.icon === "wrench" && <Wrench size={18} />}
                    {currentSpecDefinition.icon === "sliders" && <Sliders size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {currentSpecDefinition.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {currentSpecDefinition.subtitle}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Click any chip to set value or type custom
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentSpecDefinition.fields.map((field) => {
                  const currentValue = getAttr(field.key);
                  return (
                    <div
                      key={field.key}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          {field.label}
                        </label>
                        {currentValue && (
                          <button
                            type="button"
                            onClick={() => setAttr(field.key, "")}
                            className="text-[10px] text-slate-400 hover:text-red-500 cursor-pointer font-medium"
                            title="Clear this field"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => setAttr(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>

                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {field.presets.map((preset) => {
                          const isSelected = currentValue === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAttr(field.key, preset)}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-brand text-white border-brand font-semibold shadow-xs"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              {isSelected ? `✓ ${preset}` : preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Additional & Custom Specifications Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Additional & Custom Specifications
                </h4>
                <p className="text-xs text-slate-500">
                  Extra technical specifications, legacy database values, or custom fields.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomAttributes((prev) => [...prev, { key: "", value: "" }])}
                className="text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Custom Specification</span>
              </Button>
            </div>

            {additionalCustomAttributes.length === 0 ? (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-medium text-slate-500">
                  No extra custom specifications needed. All primary category specifications are configured above.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click <strong>+ Add Custom Specification</strong> if you wish to add a custom attribute (e.g. Warranty, Color, Care Instructions).
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="col-span-4 sm:col-span-4">Specification Name</span>
                  <span className="col-span-7 sm:col-span-7">Value</span>
                  <span className="col-span-1 sm:col-span-1 text-right">Action</span>
                </div>
                {additionalCustomAttributes.map((attr, idx) => (
                  <div key={idx} className="p-3 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/50 transition-colors">
                    <div className="col-span-4 sm:col-span-4">
                      <input
                        type="text"
                        value={attr.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomAttributes((prev) =>
                            prev.map((item) => (item === attr ? { ...item, key: val } : item))
                          );
                        }}
                        placeholder="e.g. Warranty / Material"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-7">
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomAttributes((prev) =>
                            prev.map((item) => (item === attr ? { ...item, value: val } : item))
                          );
                        }}
                        placeholder="e.g. 2 Years Manufacturer Warranty"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => setCustomAttributes((prev) => prev.filter((item) => item !== attr))}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete specification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: VARIANTS (SIZES, VOLUMES ML/L, COLORS & CHILD IMAGES) */}
      {activeTab === "variants" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <GitBranch className="text-brand" size={18} />
                Child Variants (Sizes, Volumes in ml/L, Colors & Child Images)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage variants for this configurable product. Real database variants only.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setVariants((prev) => [
                  ...prev,
                  {
                    sku: `${sku ? sku + "-" + (prev.length + 1) : "VAR-" + (prev.length + 1)}`,
                    color: "",
                    size: "",
                    price: basePrice || 0,
                    stock: 0,
                  }
                ]);
              }}
              className="text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Add Child Variant</span>
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-semibold text-slate-700">Simple Product (No Child Variants)</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                This item is sold as a standalone single product. If this product has multiple sizes, colors, or volumes, click <strong>+ Add Child Variant</strong> above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Color Groups Photo Status Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Color Groups & Photos:
                </span>
                {Array.from(new Set(variants.map((v) => (v.color || "Standard").trim()))).map((c) => {
                  const vars = variants.filter((v) => (v.color || "Standard").trim().toLowerCase() === c.toLowerCase());
                  const hasPhoto = vars.some((v) => Boolean(v.imageUrl));
                  const firstIdx = variants.findIndex((v) => (v.color || "Standard").trim().toLowerCase() === c.toLowerCase());

                  return (
                    <div key={c} className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs">
                      <span className="font-bold text-slate-800">{c}</span>
                      <span className="text-[10px] text-slate-400">({vars.length} sizes)</span>
                      {hasPhoto ? (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check size={11} /> Photo Set
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setVariantImageModalIndex(firstIdx)}
                          className="text-[10px] text-amber-700 font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                          title="Assign image to all variants of this color"
                        >
                          <Camera size={11} /> Set Photo
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              
                

                

                <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                    <th className="p-3 w-16">Photo</th>
                    <th className="p-3">Variant SKU</th>
                    <th className="p-3">Color</th>
                    <th className="p-3">Size / Volume (ml/L)</th>
                    <th className="p-3">Price (₹)</th>
                    <th className="p-3">Special Price (₹)</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {/* Child Variant Image Selector */}
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => setVariantImageModalIndex(idx)}
                          className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-brand bg-slate-100 flex items-center justify-center group cursor-pointer"
                          title="Click to change variant image"
                        >
                          {v.imageUrl ? (
                            <Image src={v.imageUrl} alt="Variant" fill sizes="40px" className="object-cover" />
                          ) : (
                            <Camera size={16} className="text-slate-400 group-hover:text-brand" />
                          )}
                        </button>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((item, i) => i === idx ? { ...item, sku: val } : item));
                          }}
                          className="w-32 px-2 py-1.5 border border-slate-200 rounded font-mono font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((item, i) => i === idx ? { ...item, color: val } : item));
                          }}
                          list="color-presets"
                            placeholder="Select/Type Color"
                            className="w-32 px-2 py-1.5 border border-slate-200 rounded focus:ring-2 focus:ring-brand"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariants((prev) => prev.map((item, i) => i === idx ? { ...item, size: val } : item));
                          }}
                          list="size-presets"
                            placeholder="Select Size/Vol"
                            className="w-32 px-2 py-1.5 border border-slate-200 rounded font-bold text-slate-800 focus:ring-2 focus:ring-brand"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setVariants((prev) => prev.map((item, i) => i === idx ? { ...item, price: val } : item));
                          }}
                          className="w-20 px-2 py-1.5 border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.specialPrice ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setVariants((prev) => prev.map((item, i) => i === idx ? { ...item, specialPrice: val } : item));
                          }}
                          placeholder="Offer ₹"
                          className="w-20 px-2 py-1.5 border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setVariants((prev) => prev.map((item, i) => i === idx ? { ...item, stock: val } : item));
                          }}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded font-bold"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setVariantImageModalIndex(idx)}
                            className="text-slate-400 hover:text-brand p-1.5 rounded hover:bg-brand/10 cursor-pointer"
                            title="Advanced Variant Settings (Weight, Images, Status)"
                          >
                            <Sliders size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 cursor-pointer"
                            title="Delete Variant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

                    {/* Advanced Variant Configuration Modal */}
          {variantImageModalIndex !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sliders className="text-brand" size={18} />
                    Variant Details: {variants[variantImageModalIndex]?.sku}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setVariantImageModalIndex(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Variant Info Banner */}
                {variantImageModalIndex !== null && variants[variantImageModalIndex] && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Variant SKU</span>
                      <strong className="text-slate-800 font-mono">{variants[variantImageModalIndex].sku}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Color</span>
                      <strong className="text-brand">{variants[variantImageModalIndex].color}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Size</span>
                      <strong className="text-slate-800">{variants[variantImageModalIndex].size}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Price</span>
                      <strong className="text-slate-800">?{variants[variantImageModalIndex].price || 0}</strong>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Variant Status (Enable/Disable)
                    </label>
                    <select
                      value={variants[variantImageModalIndex!]?.status || "enabled"}
                      onChange={(e) => {
                        const val = e.target.value as "enabled" | "disabled";
                        setVariants((prev) => prev.map((v, i) => i === variantImageModalIndex ? { ...v, status: val } : v));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
                    >
                      <option value="enabled">Enabled (Active)</option>
                      <option value="disabled">Disabled (Hidden)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Temporarily hide this specific variant without deleting it.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Child Weight ({weightUnit})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={variants[variantImageModalIndex!]?.weight ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setVariants((prev) => prev.map((v, i) => i === variantImageModalIndex ? { ...v, weight: val } : v));
                      }}
                      placeholder="e.g. 1.2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Override parent weight for shipping calculations.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Visibility Options
                    </label>
                    <select
                      value={variants[variantImageModalIndex!]?.visibility || "Catalog, Search"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVariants((prev) => prev.map((v, i) => i === variantImageModalIndex ? { ...v, visibility: val } : v));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand"
                    >
                      <option value="Catalog, Search">Catalog, Search (Searchable)</option>
                      <option value="Not Visible Individually">Not Visible Individually (Child of Parent Only)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <ImageIcon className="text-brand" size={16} />
                    Child Image Gallery (Optional)
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Select images from the parent gallery to assign directly to this specific variant (or color).
                  </p>

                  {/* Color-Batch Checkbox */}
                  {variantImageModalIndex !== null && variants[variantImageModalIndex]?.color && (
                    <label className="flex items-start gap-2.5 p-2.5 mb-3 bg-brand/5 border border-brand/20 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyToAllSameColor}
                        onChange={(e) => setApplyToAllSameColor(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Apply images to ALL variants with color &quot;{variants[variantImageModalIndex].color}&quot;
                        </span>
                      </div>
                    </label>
                  )}

                  {images.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">No images in parent gallery yet. Add images in the Media tab first.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {images.map((img) => {
                        const isSelected = variants[variantImageModalIndex!]?.imageUrl === img.url || variants[variantImageModalIndex!]?.images?.some(i => i.url === img.url);
                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => {
                              const targetColor = variants[variantImageModalIndex!]?.color;
                              setVariants((prev) =>
                                prev.map((v, i) => {
                                  // For simplicity, we just set imageUrl to the first selected image, and append to child images array
                                  if (i === variantImageModalIndex || (applyToAllSameColor && targetColor && v.color.toLowerCase() === targetColor.toLowerCase())) {
                                    const currentImages = v.images || [];
                                    const alreadyHas = currentImages.some(ci => ci.url === img.url);
                                    let newImages = alreadyHas ? currentImages.filter(ci => ci.url !== img.url) : [...currentImages, { id: img.id, url: img.url, altText: img.altText }];
                                    return { ...v, imageUrl: newImages.length > 0 ? newImages[0].url : undefined, images: newImages };
                                  }
                                  return v;
                                })
                              );
                            }}
                           className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${isSelected ? 'border-brand ring-2 ring-brand/30' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <Image src={img.url} alt={img.altText || "Gallery"} fill sizes="80px" className="object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                                <div className="bg-brand text-white rounded-full p-1"><Check size={14} /></div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => {
                    const targetColor = variants[variantImageModalIndex!]?.color;
                    setVariants((prev) => prev.map((v, i) => {
                      if (i === variantImageModalIndex || (applyToAllSameColor && targetColor && v.color.toLowerCase() === targetColor.toLowerCase())) {
                        return { ...v, imageUrl: undefined, images: [] };
                      }
                      return v;
                    }));
                  }} className="text-xs text-red-600 border-red-200 hover:bg-red-50">
                    Clear Images
                  </Button>
                  <Button type="button" onClick={() => setVariantImageModalIndex(null)} className="text-xs bg-brand text-white px-6">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


        {/* TAB 6: RELATED & CROSS-SELL */}
      {activeTab === "relations" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Share2 className="text-brand" size={18} />
              Cross-Sell & Upsell Relationships
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter target SKUs separated by commas to power &quot;Complete Your Kit&quot; and product recommendations.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Related SKUs (&quot;Complete Your Kit&quot;)
              </label>
              <input
                type="text"
                value={relatedSkusInput}
                onChange={(e) => setRelatedSkusInput(e.target.value)}
                placeholder="e.g. AX-VISOR-01, BL-BALAC-02, MT-PINLOCK-70"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">SKUs shown as complementary riding gear on PDP.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Upsell SKUs (Alternative / Premium upgrades)
              </label>
              <input
                type="text"
                value={upsellSkusInput}
                onChange={(e) => setUpsellSkusInput(e.target.value)}
                placeholder="e.g. AX-CARBON-PRO, MT-THUNDER-4"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cross-Sell SKUs (Cart page recommendations)
              </label>
              <input
                type="text"
                value={crosssellSkusInput}
                onChange={(e) => setCrosssellSkusInput(e.target.value)}
                placeholder="e.g. RAIN-COVER-01, CHAIN-CLEAN-500"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CONTENT, RICH TEXT EDITOR, MANUAL SEO & FAQS */}
      {activeTab === "seo" && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Search className="text-brand" size={18} />
              Rich Text Description, Purely Manual SEO & Product FAQs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Full WYSIWYG editor with image upload, YouTube embeds, tables, and live Google search preview.
            </p>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Short Description (Summary beside Buy button)
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief 2-3 line overview of key selling points..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          {/* INDUSTRY STANDARD RICH TEXT EDITOR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-800">
                Full Product Description (Rich Text WYSIWYG &amp; HTML)
              </label>
              <span className="text-xs text-slate-400">
                Embed images, YouTube videos, bullet points, and tables
              </span>
            </div>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Write detailed specifications, helmet shell features, lining, ventilation, certification details..."
              minHeight="320px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Size Chart (Image URL or Link)
            </label>
            <input
              type="text"
              value={sizeChart}
              onChange={(e) => setSizeChart(e.target.value)}
              placeholder="e.g. https://.../axor-size-chart.webp"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          {/* SEO SECTION (100% MANUAL) */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-800">
              Manual SEO Metadata (Search Engine Optimization)
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Meta Title</label>
                <span className={`text-xs ${metaTitle.length > 60 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                  {metaTitle.length}/60 recommended
                </span>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Custom Google title tag (e.g. Buy Axor Apex Helmet Online in India | Store4Riders)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Meta Description</label>
                <span className={`text-xs ${metaDescription.length > 160 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                  {metaDescription.length}/160 recommended
                </span>
              </div>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Custom snippet shown beneath the link in Google search results..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meta Keywords
              </label>
              <input
                type="text"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="e.g. chain lube, motul c2, 400ml, motorcycle maintenance"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            {/* Live Google Preview Box */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Google Search Result Live Preview
              </span>
              <p className="text-xs text-slate-500 font-mono">
                https://store4riders.com/{slug || "sample-product"}
              </p>
              <h5 className="text-base text-blue-700 font-medium hover:underline cursor-pointer line-clamp-1">
                {metaTitle || name || "Product Name | Store4Riders"}
              </h5>
              <p className="text-xs text-slate-600 line-clamp-2">
                {metaDescription || shortDescription || "No meta description set yet. Search engines will generate a snippet from your description."}
              </p>
            </div>
          </div>

          {/* FAQS SECTION */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Product FAQs ({faqs.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Frequently Asked Questions rendered directly on the Product Detail Page.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}
                className="text-xs flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add FAQ</span>
              </Button>
            </div>

            {faqs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No FAQs added.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFaqs((prev) => prev.map((item, i) => (i === idx ? { ...item, question: val } : item)));
                      }}
                      placeholder={`Question #${idx + 1}`}
                      className="w-[90%] px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFaqs((prev) => prev.map((item, i) => (i === idx ? { ...item, answer: val } : item)));
                      }}
                      placeholder="Answer..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-8 z-30 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Editing: <strong className="text-slate-800">{name || "Untitled Product"}</strong></span>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createProduct.isPending || updateProduct.isPending}
            className="bg-brand hover:bg-brand/90 text-white font-semibold px-6 text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Save size={14} />
            <span>{createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}</span>
          </Button>
        </div>
      </div>

      {/* Quick Add Brand Modal */}
      <Modal
        isOpen={isAddBrandOpen}
        onClose={() => setIsAddBrandOpen(false)}
        title="Add New Brand"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => {
                setNewBrandName(e.target.value);
                setNewBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
              }}
              placeholder="e.g. AGV, Alpinestars, Rynox, Motul"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Slug / URL Key *</label>
            <input
              type="text"
              value={newBrandSlug}
              onChange={(e) => setNewBrandSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="e.g. agv, alpinestars, rynox"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>

          {/* Logo upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Logo (WebP Compressed)</label>
            <div className="flex items-center gap-3">
              {newBrandLogo ? (
                <div className="relative w-12 h-12 bg-slate-50 border border-slate-200 rounded p-1">
                  <Image src={newBrandLogo} alt="Logo" fill sizes="48px" className="object-contain" />
                  <button
                    type="button"
                    onClick={() => setNewBrandLogo("")}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : null}
              <input
                type="file"
                ref={brandLogoInputRef}
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    setIsUploadingBrandLogo(true);
                    toast.info("Compressing brand logo to WebP...");
                    const compressed = await compressImageToWebP(f, 800, 0.9);
                    const url = await uploadImageToS3(compressed.file);
                    setNewBrandLogo(url);
                    toast.success("Logo uploaded!");
                  } catch (err: any) {
                    toast.error(err.message || "Failed to upload logo");
                  } finally {
                    setIsUploadingBrandLogo(false);
                    if (brandLogoInputRef.current) brandLogoInputRef.current.value = "";
                  }
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => brandLogoInputRef.current?.click()}
                disabled={isUploadingBrandLogo}
                className="text-xs"
              >
                <Upload size={12} className="mr-1" />
                {isUploadingBrandLogo ? "Uploading..." : "Upload Logo (Auto-WebP)"}
              </Button>
            </div>
            <input
              type="text"
              value={newBrandLogo}
              onChange={(e) => setNewBrandLogo(e.target.value)}
              placeholder="Or paste image URL (https://...)"
              className="w-full mt-2 px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>

          {/* Submenu Display Controls */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newBrandShowInMenu}
                onChange={(e) => setNewBrandShowInMenu(e.target.checked)}
                className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800">
                Show in Navigation Submenu ('Shop By Brand')
              </span>
            </label>
            {newBrandShowInMenu && (
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Submenu Column / Group
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {[
                    "Helmet Brands",
                    "Riding Gear",
                    "Luggage & Accessories",
                    "Parts & Tyres",
                    "Care & Maintenance",
                    "Featured Brands",
                  ].map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setNewBrandMenuGroup(grp)}
                      className={`px-2 py-0.5 text-[11px] rounded font-medium border cursor-pointer transition-colors ${
                        newBrandMenuGroup === grp
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newBrandMenuGroup}
                  onChange={(e) => setNewBrandMenuGroup(e.target.value)}
                  placeholder="Or enter custom group"
                  className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddBrandOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!newBrandName || isUploadingBrandLogo || createBrand.isPending}
              onClick={async () => {
                if (!newBrandName.trim()) {
                  toast.error("Please provide a brand name");
                  return;
                }
                const slugToUse = newBrandSlug.trim() || newBrandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                try {
                  await createBrand.mutateAsync({
                    name: newBrandName.trim(),
                    slug: slugToUse,
                    logo: newBrandLogo || undefined,
                    showInMenu: newBrandShowInMenu,
                    menuGroup: newBrandMenuGroup.trim() || "Featured Brands",
                    isActive: true,
                  });
                  setBrand(newBrandName.trim());
                  setIsAddBrandOpen(false);
                  toast.success(`Brand "${newBrandName}" created and selected!`);
                } catch (err: any) {
                  // toast handled in hook
                }
              }}
            >
              {createBrand.isPending ? "Creating..." : "Create & Select Brand"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* FINAL REVIEW & CONFIRMATION MODAL (At final submit time) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Final Review & Confirm Save"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">
                {mode === "create" ? "Reviewing new product before publishing:" : "Reviewing product changes before saving:"} <strong>{name || "Untitled"}</strong>
              </span>
            </div>
            <span className="text-slate-500 font-mono">SKU: {sku}</span>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Eye size={14} className="text-brand" />
              Customer Storefront Card Appearance
            </h4>
            <StorefrontCardPreview
              name={name}
              brand={brand}
              basePrice={basePrice}
              specialPrice={specialPrice}
              images={images}
              variants={variants}
              onSetPrimaryImage={(idx) => setPrimaryImage(idx)}
              onSelectColorPhoto={(targetColor) => {
                const idx = variants.findIndex(
                  (v) => (v.color || "Standard").toLowerCase() === targetColor.toLowerCase()
                );
                if (idx !== -1) {
                  setVariantImageModalIndex(idx);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
              <span className="font-semibold text-slate-800 truncate block">
                {categoryId || "Default Catalog"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pricing</span>
              <span className="font-semibold text-slate-800 block">
                ₹{basePrice || 0} {specialPrice ? `(Sale: ₹${specialPrice})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Gallery Photos</span>
              <span className="font-semibold text-slate-800 block">
                {images.length} photos {images.some(i => i.isBase) ? "✓ Primary Set" : "⚠ Auto First"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Variants</span>
              <span className="font-semibold text-slate-800 block">
                {variants.length} items
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              className="text-xs"
            >
              Back to Editing
            </Button>
            <Button
              type="button"
              disabled={createProduct.isPending || updateProduct.isPending}
              onClick={executeSave}
              className="bg-brand hover:bg-brand/90 text-white font-semibold px-6 text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save size={14} />
              <span>{createProduct.isPending || updateProduct.isPending ? "Saving..." : (mode === "create" ? "Confirm & Publish Product" : "Confirm & Save Changes")}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}





