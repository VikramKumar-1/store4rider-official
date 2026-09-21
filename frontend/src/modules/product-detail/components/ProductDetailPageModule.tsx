"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useProductBySlug, useProductsBySkus, useProductReviews, IBackendProduct } from "@/core/hooks/useProducts";
import { ProductDetailModule } from "@/modules/product-detail";
import { PDPData, KitProduct } from "@/modules/product-detail/types/product-detail.types";
import { useRecentViewsStore } from "@/stores/useRecentViewsStore";

/**
 * Helper: Strip HTML tags for clean plain text.
 * Reused for shortDescription display.
 */
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
};

/**
 * Helper: Format price in INR (Indian Rupees).
 */
const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Helper: Extract the last meaningful category name from magentoCategories string.
 * e.g. "Root Test 01/Riding Gear/Motorcycle Riding Boots" → "MOTORCYCLE RIDING BOOTS"
 */
const extractCategoryName = (product: IBackendProduct): string => {
  if (product.magentoCategories) {
    const parts = product.magentoCategories.split(",")[0].split("/");
    const lastPart = parts[parts.length - 1]?.trim();
    if (lastPart && !lastPart.toLowerCase().includes("root")) {
      return lastPart.toUpperCase();
    }
    // Try second-to-last
    if (parts.length >= 2) {
      const secondLast = parts[parts.length - 2]?.trim();
      if (secondLast && !secondLast.toLowerCase().includes("root")) {
        return secondLast.toUpperCase();
      }
    }
  }
  return product.productType?.toUpperCase() || "GEAR";
};

/**
 * Helper: Parse configurableVariations string into colors & sizes arrays.
 * Input format: "sku=CL-FR-BL-7,eu_size_for_boots=41,color=Black|sku=CL-FR-BR-7,eu_size_for_boots=41,color=Brown"
 */
const parseVariations = (variationsStr?: string): { colors: string[]; sizes: string[] } => {
  const colors = new Set<string>();
  const sizes = new Set<string>();

  if (!variationsStr) return { colors: [], sizes: [] };

  const variants = variationsStr.split("|");
  for (const variant of variants) {
    const attrs = variant.split(",");
    for (const attr of attrs) {
      const [key, value] = attr.split("=");
      if (!key || !value) continue;
      const k = key.trim().toLowerCase();
      const v = value.trim();

      if (k === "color") {
        colors.add(v);
      } else if (k.includes("size") || k.includes("eu_size")) {
        sizes.add(v);
      }
    }
  }

  return {
    colors: Array.from(colors),
    sizes: Array.from(sizes),
  };
};

/**
 * Rich color mapper for motorcycle gear:
 * Supports single colors (Black, Brown, Red) and dual/multi-tone variations
 * (e.g. "Black/Red", "Black/Grey", "Black/Orange", "Black/Blue") via diagonal CSS gradients.
 */
const singleColorMap: Record<string, string> = {
  black: "#111111",
  noir: "#111111",
  brown: "#78350F",
  tan: "#D2B48C",
  white: "#FFFFFF",
  blanc: "#FFFFFF",
  red: "#DC2626",
  blue: "#2563EB",
  green: "#16A34A",
  grey: "#6B7280",
  gray: "#6B7280",
  "dark grey": "#374151",
  "dark gray": "#374151",
  "light grey": "#D1D5DB",
  "light gray": "#D1D5DB",
  charcoal: "#374151",
  orange: "#EA580C",
  yellow: "#EAB308",
  neon: "#CCFF00",
  "hi-vis": "#CCFF00",
  "hi-vis yellow": "#CCFF00",
  navy: "#1E3A8A",
  olive: "#556B2F",
  camo: "#4A5D4E",
  silver: "#C0C0C0",
  gold: "#D97706",
  beige: "#E5D3B3",
  sand: "#E5D3B3",
  khaki: "#C3B091",
  maroon: "#800020",
  burgundy: "#800020",
  pink: "#EC4899",
  purple: "#7C3AED",
  teal: "#0D9488",
  cyan: "#06B6D4",
};

export const parseColorToBackground = (colorName: string): string => {
  if (!colorName) return "#111111";
  const clean = colorName.trim().toLowerCase();

  // Direct single color match
  if (singleColorMap[clean]) {
    return singleColorMap[clean];
  }

  // Multi-tone colors like "Black/Grey", "Black/Red", "Black-Orange"
  const parts = colorName.split(/[/\\&_+-]/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    const hexParts = parts.map(p => {
      const pClean = p.toLowerCase();
      if (singleColorMap[pClean]) return singleColorMap[pClean];
      if (pClean.includes("black")) return "#111111";
      if (pClean.includes("grey") || pClean.includes("gray")) return "#6B7280";
      if (pClean.includes("red")) return "#DC2626";
      if (pClean.includes("blue")) return "#2563EB";
      if (pClean.includes("orange") || pClean.includes("org")) return "#EA580C";
      if (pClean.includes("yellow")) return "#EAB308";
      if (pClean.includes("white")) return "#FFFFFF";
      if (pClean.includes("brown")) return "#78350F";
      if (pClean.includes("green")) return "#16A34A";
      return "#6B7280";
    });

    if (hexParts.length === 2) {
      return `linear-gradient(135deg, ${hexParts[0]} 50%, ${hexParts[1]} 50%)`;
    } else if (hexParts.length === 3) {
      return `linear-gradient(135deg, ${hexParts[0]} 33.3%, ${hexParts[1]} 33.3% 66.6%, ${hexParts[2]} 66.6%)`;
    } else {
      const step = 100 / hexParts.length;
      const stops = hexParts.map((h, i) => `${h} ${i * step}% ${(i + 1) * step}%`).join(", ");
      return `linear-gradient(135deg, ${stops})`;
    }
  }

  // Fallback: check substring match
  for (const [key, hex] of Object.entries(singleColorMap)) {
    if (clean.includes(key)) {
      return hex;
    }
  }

  return "#4B5563";
};

const mapToKitProduct = (p: IBackendProduct): KitProduct => {
  const catParts = (p.magentoCategories || "").split(",")[0].split("/");
  const catName = catParts.filter(c => !c.toLowerCase().includes("root")).pop()?.trim() || "GEAR";
  const price = (p.specialPrice && p.specialPrice < p.basePrice) ? p.specialPrice : p.basePrice;
  return {
    id: p._id,
    name: p.name,
    category: catName.toUpperCase(),
    priceFormatted: formatINR(price),
    imageUrl: p.images?.[0]?.url || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    productUrl: `/products/${p.slug}`,
  };
};

/**
 * Known filename to color keyword lookup table extracted from Magento catalog.
 * Provides fallback in case database altText does not yet have the color suffix.
 */
const filenameToColorMap: Record<string, string> = {
  // Clan SNKR Stealth Edition
  "snkr--se-_9": "Black/Grey",
  "snkr--se-_25": "Black/Red",
  "snkr--se-_14": "Black/Blue",
  "snkr--se-_10": "Black/Orange",
  // Clan FRML 1.0 Formal Shoes
  "frml-1-_5_.jpg": "Black",
  "frml-1-_1_.jpg": "Black",
  "frml-1-_2_.jpg": "Black",
  "frml-1-_3_.jpg": "Black",
  "frml-1-_4_.jpg": "Black",
  "frml-1-_5__1.jpg": "Brown",
  "frml-1-_1__1.jpg": "Brown",
  "frml-1-_2__1.jpg": "Brown",
  "frml-1-_3__1.jpg": "Brown",
  "frml-1-_4__1.jpg": "Brown",
  // Clan Scout Waterproof
  "clan-scout-shoes-_30": "Black",
  "clan-scout-shoes-_13": "Black",
  "clan-scout-shoes-_24": "Blue",
  "clan-scout-shoes-_19__2": "Blue",
  "clan-scout-shoes-_11": "Grey",
  "clan-scout-shoes-_5__11zon_1": "Grey",
  "clan-scout-shoes-_46": "Red",
  "clan-scout-shoes-_48": "Red",
  // Clan Scout D3O Waterproof
  "clan-scout-shoes-_3__11zon_1": "Red",
  "clan-scout-shoes-_38": "Black",
  "clan_scout_d3o_waterproof_riding_boots_-_grey": "Grey",
  "clan-scout-shoes-_19__1": "Blue",
};

const inferImageColorLabel = (imgUrl: string, existingAlt: string, productName: string): string => {
  if (existingAlt && (existingAlt.includes("-") || existingAlt.includes("|")) && !existingAlt.endsWith("additional view")) {
    return existingAlt;
  }

  const urlLower = (imgUrl || "").toLowerCase();
  for (const [key, color] of Object.entries(filenameToColorMap)) {
    if (urlLower.includes(key.toLowerCase())) {
      return `${productName} - ${color}`;
    }
  }

  return existingAlt || productName;
};

/**
 * Maps raw backend product to PDP display data.
 * Separated out so the main component stays clean.
 */
const mapProductToPDP = (
  product: IBackendProduct,
  kitProducts: KitProduct[],
  upSellProducts: KitProduct[],
  reviews: any[]
): PDPData => {
  // --- UI TESTING FALLBACK ---
  // If the database product doesn't have related/upsell products yet, we provide dummy data so you can see the UI layout.
  const dummyKitProducts: KitProduct[] = [
    { id: "k1", name: "Premium Leather Jacket", category: "Jacket", priceFormatted: "₹ 12,999", imageUrl: "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=400&q=80", productUrl: "#" },
    { id: "k2", name: "Carbon Fiber Helmet", category: "Helmet", priceFormatted: "₹ 8,499", imageUrl: "https://images.unsplash.com/photo-1558981420-c532902e58b4?auto=format&fit=crop&w=400&q=80", productUrl: "#" },
    { id: "k3", name: "Armored Riding Gloves", category: "Gloves", priceFormatted: "₹ 3,200", imageUrl: "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=400&q=80", productUrl: "#" },
    { id: "k4", name: "Riding Pants with Knee Guards", category: "Pants", priceFormatted: "₹ 6,500", imageUrl: "https://images.unsplash.com/photo-1605389656254-20993510e97d?auto=format&fit=crop&w=400&q=80", productUrl: "#" }
  ];

  const finalKitProducts = kitProducts && kitProducts.length > 0 ? kitProducts : dummyKitProducts;
  // ---------------------------

  const hasDiscount = product.specialPrice && product.specialPrice < product.basePrice;
  const displayPrice = hasDiscount ? product.specialPrice! : product.basePrice;
  const priceFormatted = formatINR(displayPrice);
  const originalPriceFormatted = hasDiscount ? formatINR(product.basePrice) : undefined;
  const discountBadge = hasDiscount
    ? `${Math.round(((product.basePrice - product.specialPrice!) / product.basePrice) * 100)}%`
    : undefined;

  const gallery = product.images?.length > 0
    ? product.images.map(img => ({
        url: img.url,
        altText: inferImageColorLabel(img.url, img.altText || "", product.name),
      }))
    : [{ url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80", altText: "Placeholder" }];

  const category = extractCategoryName(product);

  const plainTextDesc = product.shortDescription
    ? stripHtml(product.shortDescription)
    : stripHtml(product.description || "");
  const shortDescription = plainTextDesc || "Premium riding gear built for safety and comfort.";

  let colorNames: string[] = [];
  let sizes: string[] = [];

  // Prefer extracting from actual child variants if they exist (more accurate)
  if (product.variants && product.variants.length > 0) {
    const colorSet = new Set<string>();
    const sizeSet = new Set<string>();
    
    product.variants.forEach(variant => {
      if (variant.attributes) {
        // Handle Mongoose Map or POJO
        const attrs = variant.attributes instanceof Map 
          ? Object.fromEntries(variant.attributes)
          : variant.attributes;
          
        Object.entries(attrs).forEach(([key, value]) => {
          const k = key.toLowerCase();
          const v = String(value).trim();
          if (k === 'color') colorSet.add(v);
          else if (k.includes('size') || k.includes('eu_size')) sizeSet.add(v);
        });
      }
    });
    colorNames = Array.from(colorSet);
    sizes = Array.from(sizeSet);
  } else {
    // Fallback to parsing the legacy Magento string
    const parsed = parseVariations(product.configurableVariations);
    colorNames = parsed.colors;
    sizes = parsed.sizes;
  }

  const mappedColors = colorNames.length > 0
    ? colorNames.map(name => ({
        name,
        background: parseColorToBackground(name),
      }))
    : [{ name: "Standard", background: "#111111" }];

  return {
    id: product._id,
    slug: product.slug,
    category,
    name: product.name,
    rating: 4.95,
    reviewCount: reviews.length,
    originalPriceFormatted,
    discountBadge,
    priceFormatted,
    shortDescription,
    fullDescription: product.description || "",
    images: gallery,
    colors: mappedColors,
    sizes: sizes.length > 0 ? sizes : ["One Size"],
    kitProducts: finalKitProducts,
    // TODO: Replace with real Google reviews from API
    storeReviews: [
      { id: "sr1", author: "Rahul Sharma", rating: 5, date: "2 weeks ago", text: "Amazing quality riding boots! Waterproofing works perfectly in Mumbai rains." },
      { id: "sr2", author: "Ankit Patel", rating: 5, date: "1 month ago", text: "Best riding gear store in India. Fast delivery and genuine products." },
      { id: "sr3", author: "Priya Singh", rating: 4, date: "1 month ago", text: "Great customer service. They helped me pick the right size." },
      { id: "sr4", author: "Vikram Joshi", rating: 5, date: "2 months ago", text: "Bought gloves and jacket. Premium quality, worth every rupee." },
      { id: "sr5", author: "Deepak Kumar", rating: 5, date: "3 months ago", text: "1 year damage cover is a game changer. Highly recommended!" },
    ],
    productReviews: reviews && reviews.length > 0 ? reviews : [
      { id: "pr1", author: "Aman V.", rating: 5, date: "15 Oct 2023", text: "The D3O protection on these boots is amazing. Feels very sturdy yet comfortable enough for short walks off the bike." },
      { id: "pr2", author: "Karthik Reddy", rating: 4, date: "02 Sep 2023", text: "Waterproofing works exactly as advertised. Used it during heavy monsoon rides and my feet stayed completely dry. Deducting one star because they take a little time to break in." },
      { id: "pr3", author: "Siddharth S.", rating: 5, date: "28 Aug 2023", text: "Looks just like a regular high-top sneaker but has all the protection of a proper riding boot. Extremely satisfied with this purchase!" },
    ],
    upSellProducts,
    rawVariants: product.variants?.map(v => ({
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {})
    })),
  };
};

export const ProductDetailPageModule = () => {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const { data: product, isLoading, error } = useProductBySlug(slug);

  // These queries fire in PARALLEL once product is available (not waterfall).
  // They won't block the page from rendering — the page shows immediately
  // with the main product data, and these sections fill in when ready.
  const relatedSkus = product?.relatedSkus || [];
  const upsellSkus = product?.upsellSkus || [];
  const productId = product?._id || "";

  const { data: relatedProducts } = useProductsBySkus(relatedSkus);
  const { data: upsellProducts } = useProductsBySkus(upsellSkus);
  const { data: reviewsData } = useProductReviews(productId);

  const addRecentView = useRecentViewsStore((state) => state.addRecentView);

  useEffect(() => {
    if (product) {
      addRecentView({
        id: product._id,
        name: product.name,
        category: extractCategoryName(product),
        priceFormatted: formatINR((product.specialPrice && product.specialPrice < product.basePrice) ? product.specialPrice : product.basePrice),
        imageUrl: product.images?.[0]?.url || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
        rating: 4.95,
        productUrl: `/products/${product.slug}`,
      });
    }
  }, [product, addRecentView]);

  // Show a lightweight skeleton instead of a blocking full-page spinner
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-white">
        {/* Skeleton header */}
        <div className="h-12 bg-neutral-100 animate-pulse" />
        <div className="h-16 bg-white border-b border-neutral-200" />
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Skeleton gallery */}
            <div className="w-full lg:w-[40%]">
              <div className="aspect-square bg-neutral-100 rounded-md animate-pulse" />
              <div className="flex gap-2 mt-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-20 h-20 bg-neutral-100 rounded-sm animate-pulse" />
                ))}
              </div>
            </div>
            {/* Skeleton info */}
            <div className="w-full lg:w-[60%] space-y-4">
              <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-neutral-100 rounded animate-pulse" />
              <div className="h-6 w-40 bg-neutral-100 rounded animate-pulse" />
              <div className="h-20 w-full bg-neutral-100 rounded animate-pulse mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) return <div className="text-center py-32 text-red-500 font-bold">Product not found</div>;

  const mappedReviews = (reviewsData || []).map((r: any) => ({
    id: r._id,
    author: r.userId || "Customer",
    rating: r.rating,
    date: new Date(r.createdAt).toLocaleDateString(),
    text: r.comment,
  }));

  const mappedProduct = mapProductToPDP(
    product,
    (relatedProducts || []).map(mapToKitProduct),
    (upsellProducts || []).map(mapToKitProduct),
    mappedReviews
  );

  return <ProductDetailModule product={mappedProduct} />;
};
