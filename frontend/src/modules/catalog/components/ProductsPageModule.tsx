"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useProducts } from "@/core/hooks/useProducts";
import { useCategoryTree } from "@/core/hooks/useCategories";
import { CatalogModule } from "@/modules/catalog";
import { CatalogProduct } from "@/modules/catalog/types/catalog.types";

export const ProductsPageModule = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  
  let category = searchParams.get("category") || undefined;
  if (!category && params) {
    const rawParam = params.categorySlug || params.slug || params.category;
    if (rawParam && !params.brandSlug) {
      const slugArr = Array.isArray(rawParam) ? rawParam : [rawParam];
      category = slugArr[slugArr.length - 1];
    }
  }
  
  let brand = searchParams.get("brand") || undefined;
  if (!brand && params?.brandSlug) {
    const slugArr = Array.isArray(params.brandSlug) ? params.brandSlug : [params.brandSlug];
    brand = slugArr[slugArr.length - 1];
  }
  
  const search = searchParams.get("search") || searchParams.get("q") || undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
  const minPrice = searchParams.has("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.has("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const sort = searchParams.get("sort") || undefined;
  const activeColorParam = searchParams.get("colour") || searchParams.get("color");

  // Dynamic attribute filters
  const dynamicParams: Record<string, string> = {};
  const DYNAMIC_FILTER_KEYS = ['helmet_type', 'material', 'riding_style', 'certification', 'gender', 'size', 'colour', 'inStock', 'onSale'];
  for (const key of DYNAMIC_FILTER_KEYS) {
    const val = searchParams.get(key);
    if (val) dynamicParams[key] = val;
  }

  const { data: catTreeData } = useCategoryTree();
  let categoryNode = undefined;
  if (category && catTreeData) {
    const findNode = (nodes: any[]): any => {
      for (const n of nodes) {
        if (n.slug === category) return n;
        if (n.children) {
          const f = findNode(n.children);
          if (f) return f;
        }
      }
      return null;
    };
    categoryNode = findNode(catTreeData);
  }

  const { data, isLoading, isFetching, error } = useProducts({ 
    category, 
    brand, 
    search, 
    page, 
    limit: 12,
    minPrice,
    maxPrice,
    sort,
    ...dynamicParams
  });

  if (error) return <div className="text-center py-32 text-red-500 font-bold">Failed to load products</div>;

  const productsList = data?.items || [];
  
  // Secondary client-side deduplication shield by product _id
  const seen = new Set<string>();
  const uniqueProducts = productsList.filter(p => {
    if (!p?._id || seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });

  const mappedProducts: CatalogProduct[] = uniqueProducts.map((p) => {
    let cleanCat = "ACCESSORIES";
    const pAny = p as any;
    if (pAny.category && pAny.category.name) {
      cleanCat = pAny.category.name;
    } else if (pAny.categorySlugs && pAny.categorySlugs.length > 0) {
      const lastSlug = pAny.categorySlugs[pAny.categorySlugs.length - 1];
      cleanCat = lastSlug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    } else if (p.magentoCategories) {
      const parts = p.magentoCategories.split(/[\/,|]/).map((s: string) => s.trim()).filter((s: string) => s && !s.toLowerCase().includes("root test") && !s.toLowerCase().includes("default"));
      cleanCat = parts.length > 0 ? parts[parts.length - 1] : "ACCESSORIES";
    }

    let effectivePrice = p.basePrice || 0;

    // 1. Resolve price from child variants (standard Magento configurable product structure)
    if (effectivePrice === 0 && Array.isArray(p.variants) && p.variants.length > 0) {
      const variantPrices = p.variants
        .map((v: any) => (typeof v === "object" ? v.price : 0))
        .filter((pr: number) => pr > 0);
      if (variantPrices.length > 0) {
        effectivePrice = Math.min(...variantPrices);
      }
    }

    // 2. Fallback to legacy Magento metaTitle price extraction if parent basePrice is 0
    if (effectivePrice === 0 && p.metaTitle) {
      const match = p.metaTitle.match(/(?:rs\.?|inr|₹)\s*([0-9,]+)/i);
      if (match && match[1]) {
        const parsed = parseFloat(match[1].replace(/,/g, ""));
        if (parsed > 0) {
          effectivePrice = parsed;
        }
      }
    }

    // 3. Fallback: if still 0 but specialPrice exists, use it as the price
    if (effectivePrice === 0 && p.specialPrice && p.specialPrice > 0) {
      effectivePrice = p.specialPrice;
    }

    const displayPrice = (p.specialPrice && p.specialPrice > 0 && effectivePrice > 0 && p.specialPrice < effectivePrice)
      ? p.specialPrice : effectivePrice;

    const priceFormatted = displayPrice > 0
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(displayPrice)
      : "Select Options";

    return {
      id: p._id,
      name: p.name,
      category: cleanCat,
      priceFormatted,
      imageUrl: (() => {
        const defaultUrl = p.images?.[0]?.url || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";
        if (!activeColorParam) return defaultUrl;
        
        const activeColors = activeColorParam.split(",").map((c: string) => c.trim().toLowerCase());
        
        // 1. Try colorImages map (case-insensitive key lookup)
        if (p.colorImages) {
          const imageKeys = Object.keys(p.colorImages);
          for (const color of activeColors) {
            const matchedKey = imageKeys.find(k => k.toLowerCase() === color);
            if (matchedKey && p.colorImages[matchedKey]) {
              return p.colorImages[matchedKey];
            }
          }
        }
        
        // 2. Try variant imageUrl matching the active color
        if (p.variants && Array.isArray(p.variants)) {
          for (const color of activeColors) {
            const matchedVariant = p.variants.find((v: any) => {
              const vColor = v.attributes?.color || v.attributes?.colour;
              return vColor && vColor.toLowerCase() === color && v.imageUrl;
            });
            if (matchedVariant?.imageUrl) return matchedVariant.imageUrl;
          }
        }
        
        // 3. Try to guess from parent images array (URL or Alt Text)
        if (p.images && Array.isArray(p.images)) {
          const ALL_COLORS = ["black", "white", "red", "blue", "green", "yellow", "orange", "grey", "gray", "pink", "purple", "brown", "silver", "gold", "neon", "flu", "matte", "gloss"];
          for (const color of activeColors) {
            const colorWords = color.split(/[\/\s-]/).filter((w: string) => w.length > 2 && w.toLowerCase() !== 'flu.');
            
            let bestImg = null;
            let bestScore = -1;

            for (const img of p.images) {
              const textToSearch = (img.url + " " + (img.altText || "")).toLowerCase();
              if (colorWords.length > 0 && colorWords.every((w: string) => textToSearch.includes(w))) {
                let penalty = 0;
                for (const c of ALL_COLORS) {
                  if (!colorWords.map((w: string) => w.toLowerCase()).includes(c) && textToSearch.includes(c)) {
                    penalty += 10;
                  }
                }
                const score = 100 - penalty;
                if (score > bestScore) {
                  bestScore = score;
                  bestImg = img;
                }
              }
            }
            if (bestImg) return bestImg.url;
          }
        }
        
        return defaultUrl;
      })(),
      rating: 4.9,
      productUrl: `/products/${p.slug}${activeColorParam ? `?color=${encodeURIComponent(activeColorParam.split(',')[0].trim())}` : ''}`
    };
  });

  return (
    <CatalogModule 
      products={mappedProducts} 
      totalCount={data?.totalCount || 0} 
      isLoading={isLoading && !data}
      isFetching={isFetching}
      categoryNode={categoryNode}
    />
  );
};
