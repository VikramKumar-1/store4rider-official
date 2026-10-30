"use client";

import { useParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { useProductBySlug, useProductKit, useProductUpsell, useProductCrossSell, useProductReviews, IBackendProduct } from "@/core/hooks/useProducts";
import { ProductDetailModule } from "@/modules/product-detail";
import { normalizeExternalImageUrl, deduplicateProductImages } from "@/core/utils/mediaUrlHelper";
import { PDPData, KitProduct } from "@/modules/product-detail/types/product-detail.types";
import { useRecentViewsStore } from "@/stores/useRecentViewsStore";
import { useStoreReviews } from "@/core/hooks/useStoreReviews";
import { useUIStore } from "@/stores/useUIStore";

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
 * Helper: Extract meaningful category name, subcategory name, and slugs.
 * Priority:
 * 1. Explicit backend-resolved category & subCategory fields
 * 2. DB categorySlugs array
 * 3. Legacy Magento magentoCategories string
 */
const extractCategoryInfo = (
  product: IBackendProduct
): { categoryName: string; categorySlug: string; subCategoryName?: string; subCategorySlug?: string } => {
  if (product.category) {
    return {
      categoryName: product.category,
      categorySlug: product.categorySlug || product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      subCategoryName: product.subCategory,
      subCategorySlug: product.subCategorySlug,
    };
  }

  let categoryName = "GEAR";
  let categorySlug = "";
  let subCategoryName: string | undefined = undefined;
  let subCategorySlug: string | undefined = undefined;

  if (product.magentoCategories) {
    const firstCat = product.magentoCategories.split(",")[0];
    const token = "__ESC_SLASH__";
    const parts = firstCat
      .replace(/\\\/|\\\//g, token)
      .split("/")
      .map(p => p.replace(new RegExp(token, "g"), "/").trim())
      .filter(p => p && !p.toLowerCase().includes("root"));

    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]?.trim();
      if (lastPart) {
        categoryName = lastPart.toUpperCase();
      }
    }
  }

  const categorySlugs = (product as any).categorySlugs;
  if (categorySlugs && Array.isArray(categorySlugs) && categorySlugs.length > 0) {
    if (categorySlugs.length >= 2) {
      const leafSlug = categorySlugs[0];
      const parentSlug = categorySlugs[1];
      if (!subCategoryName) {
        subCategorySlug = `${parentSlug}/${leafSlug}`;
        subCategoryName = leafSlug.replace(/-/g, " ").toUpperCase();
      }
      if (categoryName === "GEAR" || !categorySlug) {
        categorySlug = parentSlug;
        categoryName = parentSlug.replace(/-/g, " ").toUpperCase();
      }
    } else {
      const norm = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const matched = categorySlugs.find((s: string) => s === norm || s.includes(norm) || norm.includes(s));
      categorySlug = matched || categorySlugs[categorySlugs.length - 1];
      if (categoryName === "GEAR") {
        categoryName = categorySlug.replace(/-/g, " ").toUpperCase();
      }
    }
  }

  if (!categorySlug && categoryName) {
    categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  return { categoryName, categorySlug, subCategoryName, subCategorySlug };
};

const extractCategoryName = (product: IBackendProduct): string => {
  return extractCategoryInfo(product).categoryName;
};

/**
 * Helper: Parse configurableVariations string into colors & sizes arrays.
 * Input format: "sku=CL-FR-BL-7,eu_size_for_boots=41,color=Black|sku=CL-FR-BR-7,eu_size_for_boots=41,color=Brown"
 */
const parseVariations = (
  variationsStr?: string,
  variationLabelsStr?: string
): { colors: string[]; sizes: string[]; sizeLabel: string } => {
  const colors = new Set<string>();
  const sizes = new Set<string>();
  let sizeLabel = "SIZE";

  if (variationLabelsStr) {
    // E.g. "eu_size_for_boots=EU Size for boots,color=Color"
    const labelPairs = variationLabelsStr.split(",");
    for (const pair of labelPairs) {
      const [k, lbl] = pair.split("=");
      if (k && lbl && !k.toLowerCase().includes("color") && !k.toLowerCase().includes("colour")) {
        sizeLabel = lbl.trim().toUpperCase();
        break;
      }
    }
  }

  if (!variationsStr) return { colors: [], sizes: [], sizeLabel };

  const variants = variationsStr.split("|");
  for (const variant of variants) {
    const attrs = variant.split(",");
    for (const attr of attrs) {
      const [key, value] = attr.split("=");
      if (!key || !value) continue;
      const k = key.trim().toLowerCase();
      const v = value.trim();

      if (k === "sku") continue;

      if (k.includes("color") || k.includes("colour")) {
        colors.add(v);
      } else {
        sizes.add(v);
        if (sizeLabel === "SIZE") {
          if (k === "eu_size_for_boots") {
            sizeLabel = "EU SIZE FOR BOOTS";
          } else if (!k.includes("size")) {
            sizeLabel = key.trim().replace(/_/g, ' ').toUpperCase();
          }
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
  "flu green": "#CCFF00",
  "flu. green": "#CCFF00",
  "flu.green": "#CCFF00",
  "fluorescent green": "#CCFF00",
  "flu yellow": "#CCFF00",
  "flu. yellow": "#CCFF00",
  "flu.yellow": "#CCFF00",
  "fluo yellow": "#CCFF00",
  "fluo green": "#CCFF00",
  navy: "#1E3A8A",
  olive: "#556B2F",
  camo: "#4A5D4E",
  silver: "#C0C0C0",
  gold: "#D97706",
  golden: "#D4AF37",
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
  const foundColors: { color: string; index: number }[] = [];
  let tempStr = clean;
  
  for (const key of knownKeys) {
    // Ensure we match whole color words (e.g., don't match 'red' in 'colored')
    const regex = new RegExp(`(?:^|[^a-z])${key.replace(".", "\\.")}(?:$|[^a-z])`);
    const match = tempStr.match(regex);
    if (match && match.index !== undefined) {
      foundColors.push({ color: singleColorMap[key], index: match.index });
      tempStr = tempStr.replace(regex, " ".repeat(match[0].length)); // preserve string indices
    }
  }

  foundColors.sort((a, b) => a.index - b.index);
  const colors = foundColors.map(c => c.color);

  if (colors.length > 1) {
    if (colors.length === 2) {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 49.5%, ${colors[1]} 50.5%, ${colors[1]} 100%)`;
    } else if (colors.length === 3) {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 32.8%, ${colors[1]} 33.3%, ${colors[1]} 66.1%, ${colors[2]} 66.6%, ${colors[2]} 100%)`;
    } else {
      const step = 100 / colors.length;
      const stops = colors.map((h, i) => {
        const start = (i * step).toFixed(1);
        const end = ((i + 1) * step).toFixed(1);
        return `${h} ${start}%, ${h} ${end}%`;
      }).join(", ");
      return `linear-gradient(135deg, ${stops})`;
    }
  }

  if (colors.length === 1) {
    return colors[0];
  }

  // Fallback: check substring match for any color word (without strict boundaries)
  for (const [key, hex] of Object.entries(singleColorMap)) {
    if (clean.includes(key)) {
      return hex;
    }
  }

  return "#4B5563";
};

export const normalizeColorKey = (c: string): string => {
  if (!c) return "";
  return c
    .toLowerCase()
    .replace(/\./g, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
};

const mapToKitProduct = (p: IBackendProduct): KitProduct => {
  const catParts = (p.magentoCategories || "").split(",")[0].split("/");
  const catName = catParts.filter(c => !c.toLowerCase().includes("root")).pop()?.trim() || "GEAR";
  // Resolve price with fallbacks: basePrice â†’ variant prices â†’ specialPrice
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
    imageUrl: p.images?.[0]?.url || "/no-image.svg",
    productUrl: `/${p.slug}`,
  };
};

export const inferRichColorFromUrl = (url: string, fallback: string): string => {
  if (!url) return fallback;
  const parts = url.toLowerCase().split(/[-_/+.\s]/);
  const colors: string[] = [];
  let finish = "";
  
  const knownKeys = Object.keys(singleColorMap);
  for (const p of parts) {
    if (knownKeys.includes(p) && !colors.includes(p.charAt(0).toUpperCase() + p.slice(1))) {
      colors.push(p.charAt(0).toUpperCase() + p.slice(1));
    } else if (p === 'gloss' || p === 'matte') {
      finish = p.charAt(0).toUpperCase() + p.slice(1);
    }
  }
  
  if (colors.length > 1 || (colors.length === 1 && finish && fallback.toLowerCase() !== colors[0].toLowerCase())) {
    const colorStr = colors.join("/");
    return finish ? `${colorStr} ${finish}` : colorStr;
  }
  
  return fallback;
};

const parseVariationsToRawVariants = (variationsStr?: string, parentStockStatus: number = 1) => {
  if (!variationsStr) return [];
  const result: any[] = [];
  const variants = variationsStr.split("|");
  for (const variant of variants) {
    const attrs = variant.split(",");
    let sku = "";
    let price = 0;
    let specialPrice = undefined;
    let stock = parentStockStatus === 0 ? 0 : 1;
    const attributes: Record<string, string> = {};
    
    for (const attr of attrs) {
      const [key, value] = attr.split("=");
      if (!key || !value) continue;
      const k = key.trim().toLowerCase();
      const v = value.trim();
      
      if (k === "sku") {
        sku = v;
      } else if (k === "price" || k === "baseprice") {
        price = parseFloat(v) || 0;
      } else if (k === "special_price" || k === "specialprice") {
        specialPrice = parseFloat(v) || undefined;
      } else if (k === "qty" || k === "quantity" || k === "stock") {
        stock = parseInt(v, 10) || 0;
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
        price,
        specialPrice,
        stock,
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
  crossSellProducts: KitProduct[],
  reviews: any[],
  storeReviews: any[]
): PDPData => {
  // Only show real related products from database that actually have a price
  const finalKitProducts = (kitProducts || []).filter(
    (p) => p.priceFormatted && p.priceFormatted !== "Contact for Price"
  );
  
  const finalUpSellProducts = (upSellProducts || []).filter(
    (p) => p.priceFormatted && p.priceFormatted !== "Contact for Price"
  );

  const finalCrossSellProducts = (crossSellProducts || []).filter(
    (p) => p.priceFormatted && p.priceFormatted !== "Contact for Price"
  );

  let rawVariants = product.variants?.map((v: any) => ({
    sku: v.sku,
    price: v.price,
    specialPrice: v.specialPrice,
    stock: v.stock,
    attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {}),
    imageUrl: v.imageUrl
  }));

  if ((!rawVariants || rawVariants.length === 0) && product.configurableVariations) {
    rawVariants = parseVariationsToRawVariants(product.configurableVariations, product.stockStatus ?? 1);
  }

  // Pre-process variants to enhance simple color names if image URL has rich color names
  if (rawVariants && rawVariants.length > 0) {
    rawVariants.forEach((v: any) => {
      const colorKey = Object.keys(v.attributes).find(k => k.toLowerCase().includes('color') || k.toLowerCase().includes('colour'));
      const vColor = colorKey ? String(v.attributes[colorKey]).trim() : "";

      // 1. Resolve image from product.colorImages if available
      if (!v.imageUrl && vColor && product.colorImages) {
        const cMap = product.colorImages instanceof Map ? Object.fromEntries(product.colorImages) : product.colorImages;
        const matchedKey = Object.keys(cMap).find(k => k.trim().toLowerCase() === vColor.toLowerCase());
        if (matchedKey && cMap[matchedKey]) {
          v.imageUrl = cMap[matchedKey];
        }
      }

      // SMART MATCHING: If variant is missing an image, guess it from product.images using SKU tokens!
      if (!v.imageUrl && v.sku && product.images && product.images.length > 0) {
        const skuTokens = v.sku.toLowerCase().split(/[-_/\s+]/).filter((t: string) => t.length > 2);
        let bestImg = null;
        let bestScore = 0;
        
        for (const img of product.images) {
          const urlLower = img.url.toLowerCase();
          let score = 0;
          for (const token of skuTokens) {
            if (urlLower.includes(token)) {
              score += token.length;
            }
          }
          if (score > bestScore) {
            bestScore = score;
            bestImg = img;
          }
        }
        
        if (bestImg && bestScore > 3) {
          v.imageUrl = bestImg.url;
        }
      }

      if (colorKey && v.imageUrl) {
        const originalColor = String(v.attributes[colorKey]).trim();
        const richColor = inferRichColorFromUrl(v.imageUrl, originalColor);
        if (richColor !== originalColor) {
          v.attributes[colorKey] = richColor; // Upgrade variant attribute
        }
      }
    });
  }

  let base = product.basePrice;
  let special = product.specialPrice;

  // Fallback 1: If base is 0, get lowest price from rawVariants
  if (!base && rawVariants && rawVariants.length > 0) {
    const variantPrices = rawVariants
      .map((v: any) => v.price)
      .filter((p: number) => p > 0);
    if (variantPrices.length > 0) {
      base = Math.min(...variantPrices);
    }
  }

  // Fallback 1b: If parent has no specialPrice, check variant specialPrices
  if (!special && rawVariants && rawVariants.length > 0) {
    const variantSpecials = rawVariants
      .map((v: any) => v.specialPrice)
      .filter((p: number | undefined) => p && p > 0);
    if (variantSpecials.length > 0) {
      special = Math.min(...(variantSpecials as number[]));
    }
  }

  // Fallback 2: If base is still 0 but specialPrice exists, use specialPrice as the display price
  if (!base && special && special > 0) {
    base = special;
    special = undefined;
  }

  // Fallback 3: If STILL 0, try to extract price from metaTitle (Legacy Magento fallback)
  if (!base && product.metaTitle) {
    const match = product.metaTitle.match(/(?:rs\.?|inr|â‚¹)\s*([0-9,]+)/i);
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

  let colorNames: string[] = [];
  let sizes: string[] = [];
  let sizeLabel = "SIZE";

  // Prefer extracting from rawVariants
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();

  if (rawVariants && rawVariants.length > 0) {
    rawVariants.forEach((variant: any) => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          const k = key.toLowerCase();
          const v = String(value).trim();
          if (k === 'sku') return;
          if (k.includes('color') || k.includes('colour')) {
            colorSet.add(v);
          } else {
            sizeSet.add(v);
            if (k === 'eu_size_for_boots' && sizeLabel === "SIZE") {
              sizeLabel = "EU SIZE FOR BOOTS";
            } else if (!k.includes('size') && sizeLabel === "SIZE") {
              sizeLabel = key.replace(/_/g, ' ').trim().toUpperCase();
            }
          }
        });
      }
    });
  } else {
    // Fallback to parsing the legacy Magento string
    const parsed = parseVariations(product.configurableVariations, (product as any).configurableVariationLabels);
    parsed.colors.forEach(c => colorSet.add(c));
    parsed.sizes.forEach(s => sizeSet.add(s));
    sizeLabel = parsed.sizeLabel || "SIZE";
  }

  const hasColor = (set: Set<string>, candidate: string) => {
    const normCand = normalizeColorKey(candidate);
    return Array.from(set).some((c) => normalizeColorKey(c) === normCand);
  };

  // Add colors from colorImages map if any exist that weren't in variants
  if (product.colorImages) {
    const cMap = product.colorImages instanceof Map ? Object.fromEntries(product.colorImages) : product.colorImages;
    Object.keys(cMap).forEach(color => {
      if (!hasColor(colorSet, color)) colorSet.add(color);
    });
  }
  
  // Add colors inferred from product images ONLY if no colors were found in variants or colorImages
  if (colorSet.size === 0 && product.images && Array.isArray(product.images)) {
    product.images.forEach(img => {
      const alt = img.altText || "";
      const match = alt.match(/-(?:\s*)(.+)$/);
      if (match) {
        const inferredColor = match[1].trim();
        if (!hasColor(colorSet, inferredColor) && (inferredColor.includes("/") || Object.keys(singleColorMap).includes(inferredColor.toLowerCase()))) {
          colorSet.add(inferredColor);
        }
      }
    });
  }

  colorNames = Array.from(colorSet);
  sizes = Array.from(sizeSet);

  // 1. Collect all images for the product
  const rawGalleryImages: any[] = [];
  if (product.images?.length > 0) {
    product.images.forEach((img) => {
      if (img?.url && img.url !== "/no-image.svg") {
        rawGalleryImages.push({
          url: normalizeExternalImageUrl(img.url),
          altText: img.altText || product.name,
        });
      }
    });
  }

  // 2. Add colorImages if any exist that weren't already represented
  if (product.colorImages) {
    const cMap = product.colorImages instanceof Map ? Object.fromEntries(product.colorImages) : product.colorImages;
    Object.entries(cMap).forEach(([color, url]) => {
      if (typeof url === "string" && url && url !== "/no-image.svg") {
        rawGalleryImages.push({
          url: normalizeExternalImageUrl(url),
          altText: `${product.name} - ${color}`,
        });
      }
    });
  }

  // 2b. Add variant images if any exist that weren't already represented
  if (rawVariants && rawVariants.length > 0) {
    rawVariants.forEach((v: any) => {
      const vUrl = v.imageUrl || v.images?.[0]?.url;
      const vColor = v.attributes?.color || v.attributes?.colour;
      if (vUrl && vUrl !== "/no-image.svg") {
        const cleanUrl = normalizeExternalImageUrl(vUrl);
        const alreadyIn = rawGalleryImages.some((img) => img.url === cleanUrl);
        if (!alreadyIn) {
          rawGalleryImages.push({
            url: cleanUrl,
            altText: vColor ? `${product.name} - ${vColor}` : (v.altText || product.name),
          });
        }
      }
    });
  }

  // 3. Deduplicate images by (color, angle) and sequence angles 1, 2, 3...
  const gallery = rawGalleryImages.length > 0 
    ? deduplicateProductImages(rawGalleryImages, colorNames, product.name)
    : [{ url: "/no-image.svg", altText: "Placeholder" }];

  const mappedColors = colorNames.length > 0
    ? colorNames.map(name => {
        let imgUrl: string | undefined = undefined;
        if (product.colorImages) {
          const cMap = product.colorImages instanceof Map ? Object.fromEntries(product.colorImages) : product.colorImages;
          const matchKey = Object.keys(cMap).find(k => normalizeColorKey(k) === normalizeColorKey(name));
          if (matchKey && cMap[matchKey]) imgUrl = cMap[matchKey];
        }
        if (!imgUrl && rawVariants) {
          const v = rawVariants.find((rv: any) => {
            const vc = rv.attributes?.color || rv.attributes?.colour;
            return vc && normalizeColorKey(String(vc)) === normalizeColorKey(name) && rv.imageUrl;
          });
          if (v) imgUrl = v.imageUrl;
        if (imgUrl) imgUrl = normalizeExternalImageUrl(imgUrl);
        }
        const swatchMap = (product as any).colorSwatches
          ? ((product as any).colorSwatches instanceof Map
              ? Object.fromEntries((product as any).colorSwatches)
              : (product as any).colorSwatches)
          : {};
        let swatchBg = swatchMap[name] || swatchMap[normalizeColorKey(name)];
        if (swatchBg && swatchBg.includes(",") && !swatchBg.includes("gradient")) {
          const parts = swatchBg.split(",").map((s: string) => s.trim());
          if (parts.length === 2) {
            swatchBg = `linear-gradient(135deg, ${parts[0]} 0%, ${parts[0]} 49.5%, ${parts[1]} 50.5%, ${parts[1]} 100%)`;
          } else if (parts.length === 3) {
            swatchBg = `linear-gradient(135deg, ${parts[0]} 0%, ${parts[0]} 32.8%, ${parts[1]} 33.3%, ${parts[1]} 66.1%, ${parts[2]} 66.6%, ${parts[2]} 100%)`;
          } else if (parts.length >= 4) {
            const step = 100 / parts.length;
            const stops = parts.map((h: string, i: number) => {
              const start = (i * step).toFixed(1);
              const end = ((i + 1) * step).toFixed(1);
              return `${h} ${start}%, ${h} ${end}%`;
            }).join(", ");
            swatchBg = `linear-gradient(135deg, ${stops})`;
          }
        }
        return {
          name,
          background: swatchBg || parseColorToBackground(name),
          imageUrl: imgUrl,
        };
      })
    : []; // Hide color selector entirely if no colors are found instead of guessing 'Standard'

  const avgRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;



  // Determine free shipping eligibility
  const hasShippingCharge = (product as any).shippingFee > 0 || (product as any).shipping_charge > 0 || (product as any).shippingCost > 0;
  const isFreeShipping = hasShippingCharge 
    ? false 
    : ((product as any).isFreeShipping ?? (product as any).free_shipping ?? (displayPrice >= 999));

  const rawBrand = product.brand || (product.attributes && ((product.attributes as any).brand || (product.attributes as any).Brand)) || "";
  const brand = typeof rawBrand === "string" ? rawBrand.trim() : "";
  const brandSlug = product.brandSlug || (brand ? brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : undefined);
  const brandLogo = product.brandLogo;

  const catInfo = extractCategoryInfo(product);
  const category = (product as any).category || catInfo.categoryName || "";
  const categorySlug = (product as any).categorySlug || catInfo.categorySlug || "";
  const subCategory = (product as any).subCategory || catInfo.subCategoryName || undefined;
  const subCategorySlug = (product as any).subCategorySlug || catInfo.subCategorySlug || undefined;
  const categoryHierarchy = (product as any).categoryHierarchy || [];

  return {
    id: product._id,
    slug: product.slug,
    brand: brand || undefined,
    brandSlug,
    brandLogo,
    category,
    categorySlug,
    subCategory,
    subCategorySlug,
    categoryHierarchy,
    name: product.name,
    sku: product.sku,
    productType: product.productType,
    price: displayPrice,
    originalPrice: hasDiscount ? base : undefined,
    variantsByColor: (product as any).variantsByColor || {},
    rating: avgRating,
    reviewCount: reviews ? reviews.length : 0,
    originalPriceFormatted,
    discountBadge,
    priceFormatted,
    shortDescription: product.shortDescription || (product as any).short_description || "",
    fullDescription: product.description || "",
    sizeChart: product.sizeChart || product.size_chart,
    images: gallery,
    colorImages: product.colorImages instanceof Map ? Object.fromEntries(product.colorImages) : (product.colorImages || {}),
    colorSwatches: (product as any).colorSwatches || {},
    colors: mappedColors,
    sizes: sizes.length > 0 ? sizes : [],
    sizeLabel,
    kitProducts: finalKitProducts,
    storeReviews: storeReviews || [],
    productReviews: reviews || [],
    upSellProducts: finalUpSellProducts,
    crossSellProducts: finalCrossSellProducts,
    rawVariants,
    isFreeShipping,
    stockStatus: product.stockStatus ?? 1,
    allowBackorders: product.allowBackorders ?? false,
    weight: product.weight,
    videoUrl: product.videoUrl,
    attributes: product.attributes instanceof Map ? Object.fromEntries(product.attributes) : (product.attributes || {}),
  };
};

interface ProductDetailPageModuleProps {
  slug?: string;
  initialProduct?: IBackendProduct | null;
}

export const ProductDetailPageModule = ({ slug: propSlug, initialProduct }: ProductDetailPageModuleProps = {}) => {
  const params = useParams();
  const rawCatSlug = params?.categorySlug;
  const lastCatSlug = Array.isArray(rawCatSlug)
    ? rawCatSlug[rawCatSlug.length - 1]
    : typeof rawCatSlug === "string"
    ? rawCatSlug
    : "";
  const slug = propSlug || (params?.slug as string) || lastCatSlug || "";

  const { data: product, isLoading, error } = useProductBySlug(slug, initialProduct || undefined);

  // These queries fire in PARALLEL once product is available (not waterfall).
  // They won't block the page from rendering â€” the page shows immediately
  // with the main product data, and these sections fill in when ready.
  const upsellSkus = product?.upsellSkus || [];
  const productId = product?._id || "";

  // Smart recommendations (Kit, Upsell & Cross-sell)
  const { data: kitProducts } = useProductKit(slug);
  const { data: upsellProducts } = useProductUpsell(slug);
  const { data: crossSellProducts } = useProductCrossSell(slug);
  const { data: reviewsData } = useProductReviews(productId);
  const homepageReviewIds = useUIStore((state) => state.homepageReviewIds);
  const { data: storeReviewsData, fetchNextPage, hasNextPage, isFetchingNextPage } = useStoreReviews({
    random: true,
    limit: 10,
    excludeIds: homepageReviewIds,
  });

  const addRecentView = useRecentViewsStore((state) => state.addRecentView);

  useEffect(() => {
    if (product) {
      let base = product.basePrice || 0;
      let special = product.specialPrice;

      if (!base && product.variants && product.variants.length > 0) {
        const vp = product.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
        if (vp.length > 0) base = Math.min(...vp);
        if (!special) {
          const vs = product.variants.map((v: any) => v.specialPrice).filter((p: any) => p && p > 0);
          if (vs.length > 0) special = Math.min(...vs);
        }
      }
      if (!base && special && special > 0) {
        base = special;
        special = undefined;
      }
      if (!base && product.metaTitle) {
        const match = product.metaTitle.match(/(?:rs\.?|inr|₹)\s*([0-9,]+)/i);
        if (match && match[1]) {
          base = parseFloat(match[1].replace(/,/g, ""));
        }
      }

      const hasDiscount = special && special > 0 && base > 0 && special < base;
      const finalPrice = (hasDiscount ? special : base) || 0;

      addRecentView({
        id: product._id,
        name: product.name,
        category: extractCategoryName(product),
        priceFormatted: finalPrice > 0 ? formatINR(finalPrice) : "Contact for Price",
        imageUrl: product.images?.[0]?.url || "/no-image.svg",
        rating: 4.95,
        productUrl: `/${product.slug}`,
      });
    }
  }, [product, addRecentView]);

  const mappedReviews = useMemo(() => {
    return (reviewsData || []).map((r: any) => ({
      id: r._id,
      author: r.userName || (r.userId?.startsWith("guest:") ? "Rider" : "Verified Rider"),
      city: r.city,
      rating: r.rating,
      title: r.title,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently",
      text: r.comment,
      isVerified: Boolean(r.isVerified === true),
    }));
  }, [reviewsData]);

  const mappedProduct = useMemo(() => {
    if (!product) return null;
    return mapProductToPDP(
      product,
      (kitProducts || []).map(mapToKitProduct),
      (upsellProducts || []).map(mapToKitProduct),
      (crossSellProducts || []).map(mapToKitProduct),
      mappedReviews,
      storeReviewsData?.pages.flatMap((p) => p.data) || []
    );
  }, [product, kitProducts, upsellProducts, crossSellProducts, mappedReviews, storeReviewsData]);

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
                {[1, 2, 3, 4].map((i) => (
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

  if (error || !product || !mappedProduct) {
    return <div className="text-center py-32 text-red-500 font-bold">Product not found</div>;
  }

    return <ProductDetailModule product={mappedProduct} />;
};
