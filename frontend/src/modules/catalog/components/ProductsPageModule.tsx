"use client";

import { useSearchParams } from "next/navigation";
import { useProducts } from "@/core/hooks/useProducts";
import { CatalogModule } from "@/modules/catalog";
import { CatalogProduct } from "@/modules/catalog/types/catalog.types";

export const ProductsPageModule = () => {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const brand = searchParams.get("brand") || undefined;
  const search = searchParams.get("search") || searchParams.get("q") || undefined;
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const sort = searchParams.get("sort") || undefined;

  const { data, isLoading, isFetching, error } = useProducts({ 
    category, 
    brand, 
    search, 
    page, 
    limit: 12,
    minPrice,
    maxPrice,
    sort
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
    const rawCat = (p.magentoCategories || "").toLowerCase();
    const nameLower = (p.name || "").toLowerCase();

    let cleanCat = "ACCESSORIES";
    if (nameLower.includes("protector") || nameLower.includes("armour") || nameLower.includes("armor") || nameLower.includes("guard")) {
      cleanCat = "PROTECTION";
    } else if (nameLower.includes("base layer") || nameLower.includes("innerwear") || nameLower.includes("thermal")) {
      cleanCat = "BASE LAYER";
    } else if (nameLower.includes("visor") || nameLower.includes("pinlock") || nameLower.includes("deflector")) {
      cleanCat = "ACCESSORY";
    } else if (nameLower.includes("helmet") || rawCat.includes("helmet")) {
      cleanCat = "HELMET";
    } else if (nameLower.includes("jacket") || nameLower.includes("suit") || nameLower.includes("vest") || rawCat.includes("jacket")) {
      cleanCat = "JACKET";
    } else if (nameLower.includes("boot") || nameLower.includes("shoe") || rawCat.includes("boot") || rawCat.includes("shoe")) {
      cleanCat = "BOOTS";
    } else if (nameLower.includes("glove") || rawCat.includes("glove")) {
      cleanCat = "GLOVES";
    } else if (nameLower.includes("pant") || nameLower.includes("trouser") || rawCat.includes("pant")) {
      cleanCat = "PANTS";
    } else if (nameLower.includes("bag") || nameLower.includes("luggage") || rawCat.includes("luggage") || rawCat.includes("bag")) {
      cleanCat = "LUGGAGE";
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

    const displayPrice = (p.specialPrice && p.specialPrice > 0 && p.specialPrice < effectivePrice)
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
      imageUrl: p.images?.[0]?.url || "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      rating: 4.9,
      productUrl: `/products/${p.slug}`
    };
  });

  return (
    <CatalogModule 
      products={mappedProducts} 
      totalCount={data?.totalCount || 0} 
      isLoading={isLoading && !data}
      isFetching={isFetching}
    />
  );
};
