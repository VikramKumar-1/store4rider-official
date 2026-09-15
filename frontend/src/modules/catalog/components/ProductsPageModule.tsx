"use client";

import { useProducts } from "@/core/hooks/useProducts";
import { CatalogModule } from "@/modules/catalog";
import { CatalogProduct } from "@/modules/catalog/types/catalog.types";

export const ProductsPageModule = () => {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-16">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex flex-col gap-3 animate-pulse">
            <div className="aspect-[3/4] bg-neutral-100 rounded-sm" />
            <div className="h-3 w-20 bg-neutral-100 rounded" />
            <div className="h-5 w-3/4 bg-neutral-100 rounded" />
            <div className="h-3 w-16 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
  if (error) return <div className="text-center py-32 text-red-500 font-bold">Failed to load products</div>;

  const mappedProducts: CatalogProduct[] = (products || []).map((p) => {
    // Extract category from magentoCategories path (correct field name)
    const rawCat = (p.magentoCategories || "").toLowerCase();
    let cleanCat = "ACCESSORIES";
    if (rawCat.includes("helmet")) cleanCat = "HELMET";
    else if (rawCat.includes("jacket") || rawCat.includes("suit")) cleanCat = "JACKET";
    else if (rawCat.includes("boot") || rawCat.includes("shoe")) cleanCat = "BOOTS";
    else if (rawCat.includes("glove")) cleanCat = "GLOVES";

    // Use specialPrice if available, otherwise basePrice (correct field name)
    const displayPrice = (p.specialPrice && p.specialPrice < p.basePrice)
      ? p.specialPrice : p.basePrice;

    const priceFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(displayPrice || 0);

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

  return <CatalogModule products={mappedProducts} />;
};
