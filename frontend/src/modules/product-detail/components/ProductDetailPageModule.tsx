"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useProductBySlug, useProductsBySkus, useProductKit, useProductReviews, IBackendProduct } from "@/core/hooks/useProducts";
import { ProductDetailModule } from "@/modules/product-detail";
import { PDPData, KitProduct } from "@/modules/product-detail/types/product-detail.types";
import { useRecentViewsStore } from "@/stores/useRecentViewsStore";
import { useStoreReviews } from "@/core/hooks/useStoreReviews";

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
const parseVariations = (variationsStr?: string): { colors: string[]; sizes: string[]; sizeLabel: string } => {
  const colors = new Set<string>();
  const sizes = new Set<string>();
  let sizeLabel = "SIZE";

  if (!variationsStr) return { colors: [], sizes: [], sizeLabel };

  const variants = variationsStr.split("|");
  for (const variant of variants) {
    const attrs = variant.split(",");
    for (const attr of attrs) {
      const [key, value] = attr.split("=");
      if (!key || !value) continue;
      const k = key.trim().toLowerCase();
      const v = value.trim();

      if (k.includes("color") || k.includes("colour")) {
        colors.add(v);
      } else {
        sizes.add(v);
        if (!k.includes("size") && sizeLabel === "SIZE") {
          sizeLabel = key.trim().replace(/_/g, ' ').toUpperCase();
        }
      }
    }
  }

  return {
    colors: Array.from(colors),
    sizes: Array.from(sizes),
    sizeLabel,
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

  // Extract all known colors from the string (handles "Black Orange", "Black/Orange", "Matte Black Red")
  // Sort by length descending to match "dark grey" before "grey"
  const knownKeys = Object.keys(singleColorMap).sort((a, b) => b.length - a.length);
  const foundColors: string[] = [];
  let tempStr = clean;
  
  for (const key of knownKeys) {
    // Ensure we match whole color words (e.g., don't match 'red' in 'colored')
    const regex = new RegExp(`(?:^|[^a-z])${key}(?:$|[^a-z])`);
    if (regex.test(tempStr)) {
      foundColors.push(singleColorMap[key]);
      tempStr = tempStr.replace(regex, " "); // Remove to avoid overlaps
    }
  }

  if (foundColors.length > 1) {
    if (foundColors.length === 2) {
      return `linear-gradient(135deg, ${foundColors[0]} 50%, ${foundColors[1]} 50%)`;
    } else if (foundColors.length === 3) {
      return `linear-gradient(135deg, ${foundColors[0]} 33.3%, ${foundColors[1]} 33.3% 66.6%, ${foundColors[2]} 66.6%)`;
    } else {
      const step = 100 / foundColors.length;
      const stops = foundColors.map((h, i) => `${h} ${i * step}% ${(i + 1) * step}%`).join(", ");
      return `linear-gradient(135deg, ${stops})`;
    }
  }

  if (foundColors.length === 1) {
    return foundColors[0];
  }

  // Fallback: check substring match for any color word (without strict boundaries)
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
  // Resolve price with fallbacks: basePrice → variant prices → specialPrice
  let effectivePrice = p.basePrice || 0;
  if (effectivePrice === 0 && Array.isArray(p.variants) && p.variants.length > 0) {
    const vp = p.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
    if (vp.length > 0) effectivePrice = Math.min(...vp);
  }
  if (effectivePrice === 0 && p.specialPrice && p.specialPrice > 0) effectivePrice = p.specialPrice;
  const price = (p.specialPrice && p.specialPrice > 0 && effectivePrice > 0 && p.specialPrice < effectivePrice)
    ? p.specialPrice : effectivePrice;
  return {
    id: p._id,
    name: p.name,
    category: catName.toUpperCase(),
    priceFormatted: price > 0 ? formatINR(price) : "Contact for Price",
    imageUrl: p.images?.[0]?.url || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    productUrl: `/products/${p.slug}`,
  };
};

// Removed obsolete inferImageColorLabel functionality as backend API now provides reliable altText from Magento.

const parseVariationsToRawVariants = (variationsStr?: string) => {
  if (!variationsStr) return [];
  const result: any[] = [];
  const variants = variationsStr.split("|");
  for (const variant of variants) {
    const attrs = variant.split(",");
    let sku = "";
    const attributes: Record<string, string> = {};
    for (const attr of attrs) {
      const [key, value] = attr.split("=");
      if (!key || !value) continue;
      const k = key.trim().toLowerCase();
      const v = value.trim();
      if (k === "sku") {
        sku = v;
      } else if (k.includes("color") || k.includes("colour")) {
        attributes["color"] = v;
      } else {
        attributes[k] = v;
      }
    }
    if (sku || Object.keys(attributes).length > 0) {
      result.push({
        sku,
        attributes,
        price: 0,
        stock: 1,
      });
    }
  }
  return result;
};

/**
 * Maps raw backend product to PDP display data.
 * Separated out so the main component stays clean.
 */
const mapProductToPDP = (
  product: IBackendProduct,
  kitProducts: KitProduct[],
  upSellProducts: KitProduct[],
  reviews: any[],
  storeReviews: any[]
): PDPData => {
  // Only show real related products from database (no dummy placeholders)
  const finalKitProducts = kitProducts || [];

  let base = product.basePrice;
  let special = product.specialPrice;

  // Fallback 1: If base is 0, get lowest price from variants
  if (!base && product.variants && product.variants.length > 0) {
    const variantPrices = product.variants
      .map((v: any) => v.price)
      .filter((p: number) => p > 0);
    if (variantPrices.length > 0) {
      base = Math.min(...variantPrices);
    }
    // Also check variant specialPrices
    if (!special) {
      const variantSpecials = product.variants
        .map((v: any) => v.specialPrice)
        .filter((p: number | undefined) => p && p > 0);
      if (variantSpecials.length > 0) {
        special = Math.min(...(variantSpecials as number[]));
      }
    }
  }

  // Fallback 2: If base is still 0 but specialPrice exists, use specialPrice as the display price
  if (!base && special && special > 0) {
    base = special;
    special = undefined;
  }

  // Fallback 3: If STILL 0, try to extract price from metaTitle (Legacy Magento fallback)
  if (!base && product.metaTitle) {
    const match = product.metaTitle.match(/(?:rs\.?|inr|₹)\s*([0-9,]+)/i);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ""));
      if (parsed > 0) {
        base = parsed;
      }
    }
  }

  const hasDiscount = special && special > 0 && base > 0 && special < base;
  const displayPrice = hasDiscount ? special! : base;
  const priceFormatted = displayPrice > 0 ? formatINR(displayPrice) : "Contact for Price";
  const originalPriceFormatted = hasDiscount ? formatINR(base) : undefined;
  const discountBadge = hasDiscount
    ? `${Math.round(((base - special!) / base) * 100)}%`
    : undefined;

  const gallery = product.images?.length > 0
    ? product.images.map(img => ({
        url: img.url,
        altText: img.altText || product.name,
      }))
    : [{ url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80", altText: "Placeholder" }];

  const category = extractCategoryName(product);

  const plainTextDesc = product.shortDescription
    ? stripHtml(product.shortDescription)
    : stripHtml(product.description || "");
  const shortDescription = plainTextDesc || "Premium riding gear built for safety and comfort.";

  let colorNames: string[] = [];
  let sizes: string[] = [];
  let sizeLabel = "SIZE";

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
          if (k.includes('color') || k.includes('colour')) {
            colorSet.add(v);
          } else {
            // Treat ANY other attribute (size, weight, dimension, fit, etc.) as the secondary variant selector
            sizeSet.add(v);
            if (!k.includes('size') && sizeLabel === "SIZE") {
              // Extract a clean label (e.g. "weight_in_ml" -> "WEIGHT IN ML")
              sizeLabel = key.replace(/_/g, ' ').trim().toUpperCase();
            }
          }
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
    sizeLabel = parsed.sizeLabel || "SIZE";
  }

  const mappedColors = colorNames.length > 0
    ? colorNames.map(name => ({
        name,
        background: parseColorToBackground(name),
      }))
    : []; // Hide color selector entirely if no colors are found instead of guessing 'Standard'

  const avgRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  let rawVariants = product.variants?.map((v: any) => ({
    sku: v.sku,
    price: v.price,
    specialPrice: v.specialPrice,
    stock: v.stock,
    attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {}),
    imageUrl: v.imageUrl
  }));

  if ((!rawVariants || rawVariants.length === 0) && product.configurableVariations) {
    rawVariants = parseVariationsToRawVariants(product.configurableVariations);
  }

  // Determine free shipping eligibility
  const hasShippingCharge = (product as any).shippingFee > 0 || (product as any).shipping_charge > 0 || (product as any).shippingCost > 0;
  const isFreeShipping = hasShippingCharge 
    ? false 
    : ((product as any).isFreeShipping ?? (product as any).free_shipping ?? (displayPrice >= 999));

  return {
    id: product._id,
    slug: product.slug,
    category,
    name: product.name,
    rating: avgRating,
    reviewCount: reviews ? reviews.length : 0,
    originalPriceFormatted,
    discountBadge,
    priceFormatted,
    shortDescription,
    fullDescription: product.description || "",
    sizeChart: product.sizeChart || product.size_chart,
    images: gallery,
    colors: mappedColors,
    sizes: sizes.length > 0 ? sizes : (sizeLabel !== "SIZE" ? [] : ["One Size"]),
    sizeLabel,
    kitProducts: finalKitProducts,
    storeReviews: storeReviews || [],
    productReviews: reviews || [],
    upSellProducts,
    rawVariants,
    isFreeShipping,
  };
};

export const ProductDetailPageModule = () => {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const { data: product, isLoading, error } = useProductBySlug(slug);

  // These queries fire in PARALLEL once product is available (not waterfall).
  // They won't block the page from rendering — the page shows immediately
  // with the main product data, and these sections fill in when ready.
  const upsellSkus = product?.upsellSkus || [];
  const productId = product?._id || "";

  // Smart kit recommendations query (cross-category complementary gear)
  const { data: kitProducts } = useProductKit(slug);
  const { data: upsellProducts } = useProductsBySkus(upsellSkus);
  const { data: reviewsData } = useProductReviews(productId);
  const { data: storeReviewsData, fetchNextPage, hasNextPage, isFetchingNextPage } = useStoreReviews();

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
    (kitProducts || []).map(mapToKitProduct),
    (upsellProducts || []).map(mapToKitProduct),
    mappedReviews,
    storeReviewsData?.pages.flatMap(p => p.data) || []
  );

  return <ProductDetailModule product={mappedProduct} />;
};
