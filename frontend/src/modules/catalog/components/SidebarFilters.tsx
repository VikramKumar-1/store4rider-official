"use client";

import React, { useMemo } from "react";
import { 
  Filter, 
  RotateCcw, 
  X, 
  Check,
  PackageCheck,
  Tag
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { name: "All Gear", slug: "", count: 1196 },
  { name: "Helmets", slug: "helmets", count: 335 },
  { name: "Jackets", slug: "riding-jackets", count: 108 },
  { name: "Luggage", slug: "motorcycle-luggage", count: 115 },
  { name: "Gloves", slug: "riding-gloves", count: 74 },
  { name: "Boots", slug: "riding-boots", count: 52 },
  { name: "Pants", slug: "riding-pants", count: 48 },
  { name: "Accessories", slug: "bike-accessories", count: 48 },
];

const BRANDS = [
  { name: "MT Helmets", short: "MT", count: 90 },
  { name: "Axor Helmets", short: "Axor", count: 85 },
  { name: "SMK Helmets", short: "SMK", count: 45 },
  { name: "Rynox Gear", short: "Rynox", count: 28 },
  { name: "ViaTerra", short: "ViaTerra", count: 22 },
  { name: "Furygan", short: "Furygan", count: 18 },
  { name: "Korda", short: "Korda", count: 16 },
  { name: "RS Taichi", short: "RS Taichi", count: 14 },
  { name: "Raida Gears", short: "Raida", count: 12 },
  { name: "MotoTech Gear", short: "MotoTech", count: 10 },
];

const SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

const PRICE_RANGES = [
  { label: "< ₹3,000", short: "< ₹3k", id: "under-3k", min: undefined, max: 3000 },
  { label: "₹3k – ₹6k", short: "₹3k–6k", id: "3k-6k", min: 3000, max: 6000 },
  { label: "₹6k – ₹10k", short: "₹6k–10k", id: "6k-10k", min: 6000, max: 10000 },
  { label: "> ₹10,000", short: "> ₹10k", id: "above-10k", min: 10000, max: undefined },
];

export function SidebarFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentBrandParam = searchParams.get("brand") || "";
  const activeBrands = useMemo(
    () => (currentBrandParam ? currentBrandParam.split(",").map((b) => b.trim()) : []),
    [currentBrandParam]
  );
  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const currentInStock = searchParams.get("inStock") === "true";
  const currentOnSale = searchParams.get("onSale") === "true";
  const currentSize = searchParams.get("size") || "";

  // Determine active price ID
  const activePriceId = (() => {
    if (!currentMinPrice && !currentMaxPrice) return "all";
    if (!currentMinPrice && currentMaxPrice === "3000") return "under-3k";
    if (currentMinPrice === "3000" && currentMaxPrice === "6000") return "3k-6k";
    if (currentMinPrice === "6000" && currentMaxPrice === "10000") return "6k-10k";
    if (currentMinPrice === "10000" && !currentMaxPrice) return "above-10k";
    return "custom";
  })();

  const activeFilterCount = 
    Number(Boolean(currentCategory)) + 
    activeBrands.length + 
    Number(Boolean(currentMinPrice || currentMaxPrice)) +
    Number(currentInStock) +
    Number(currentOnSale) +
    Number(Boolean(currentSize));

  const hasActiveFilters = activeFilterCount > 0;

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleBrandToggle = (brand: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    let updated: string[];

    if (activeBrands.includes(brand)) {
      updated = activeBrands.filter((b) => b !== brand);
    } else {
      updated = [...activeBrands, brand];
    }

    if (updated.length > 0) {
      params.set("brand", updated.join(","));
    } else {
      params.delete("brand");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handlePriceSelect = (range: (typeof PRICE_RANGES)[0]) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (activePriceId === range.id) {
      // Deselect if already active
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      params.delete("minPrice");
      params.delete("maxPrice");
      if (range.min !== undefined) params.set("minPrice", range.min.toString());
      if (range.max !== undefined) params.set("maxPrice", range.max.toString());
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const removePriceFilter = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete("minPrice");
    params.delete("maxPrice");
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleToggleInStock = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentInStock) {
      params.delete("inStock");
    } else {
      params.set("inStock", "true");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleToggleOnSale = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentOnSale) {
      params.delete("onSale");
    } else {
      params.set("onSale", "true");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleSizeSelect = (sz: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentSize.toUpperCase() === sz.toUpperCase()) {
      params.delete("size");
    } else {
      params.set("size", sz);
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleResetAll = () => {
    router.push("/products", { scroll: false });
  };

  const isCategoryActive = (slug: string) => {
    if (!currentCategory && !slug) return true;
    if (!currentCategory || !slug) return false;
    return currentCategory.toLowerCase() === slug.toLowerCase();
  };

  return (
    <div className="w-full select-none space-y-2.5">
      
      {/* 1. Master Control Header & Active Badges */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-50 text-banner flex items-center justify-center border border-orange-200/80">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <span className="font-black text-xs uppercase tracking-wider text-neutral-900">
              Filters
            </span>
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-banner text-white text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetAll}
              className="text-[11px] font-bold text-neutral-500 hover:text-banner transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear All
            </button>
          )}
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 pt-2 mt-2 border-t border-neutral-100">
            {currentInStock && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-banner border border-orange-200 shadow-2xs">
                <PackageCheck className="w-2.5 h-2.5" />
                In Stock
                <button onClick={handleToggleInStock} className="hover:text-orange-950 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {currentOnSale && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-banner border border-orange-200 shadow-2xs">
                <Tag className="w-2.5 h-2.5" />
                On Sale
                <button onClick={handleToggleOnSale} className="hover:text-orange-950 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {currentCategory && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-banner border border-orange-200 shadow-2xs">
                {CATEGORIES.find((c) => c.slug === currentCategory)?.name || currentCategory}
                <button onClick={() => handleCategoryClick("")} className="hover:text-orange-950 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {activeBrands.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-banner border border-orange-200 shadow-2xs">
                {b}
                <button onClick={() => handleBrandToggle(b)} className="hover:text-orange-950 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {currentSize && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-banner border border-orange-200 shadow-2xs">
                Size: {currentSize}
                <button onClick={() => handleSizeSelect(currentSize)} className="hover:text-orange-950 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {(currentMinPrice || currentMaxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-banner border border-orange-200 shadow-2xs">
                {PRICE_RANGES.find((p) => p.id === activePriceId)?.short || "Custom Price"}
                <button onClick={removePriceFilter} className="hover:text-orange-950 cursor-pointer">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. CARD 1: Category & Quick Toggles */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-banner rounded-full"></span>
            <span className="font-extrabold text-xs uppercase tracking-wide text-neutral-900">
              Categories
            </span>
          </div>

          {/* Quick Toggles: In Stock & On Sale */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleInStock}
              title="Only in-stock products"
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                currentInStock
                  ? "bg-banner text-white border-banner shadow-xs"
                  : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border-neutral-200/80"
              }`}
            >
              <PackageCheck className="w-3 h-3" />
              <span>In Stock</span>
            </button>

            <button
              onClick={handleToggleOnSale}
              title="Only on-sale products"
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                currentOnSale
                  ? "bg-banner text-white border-banner shadow-xs"
                  : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 border-neutral-200/80"
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>Sale</span>
            </button>
          </div>
        </div>

        {/* 2-Column Categories */}
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = isCategoryActive(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  active
                    ? "bg-banner text-white border-banner shadow-xs font-bold"
                    : "bg-neutral-50/80 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 border-neutral-200/70"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className={`text-[9px] tabular-nums ${active ? "text-orange-100 font-bold" : "text-neutral-400"}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CARD 2: Rider Specs (Size & Brands) */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-3 shadow-xs space-y-3">
        {/* Size Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-banner rounded-full"></span>
              <span className="font-extrabold text-xs uppercase tracking-wide text-neutral-900">
                Rider Size
              </span>
            </div>
            {currentSize && (
              <button 
                onClick={() => handleSizeSelect(currentSize)}
                className="text-[10px] font-bold text-neutral-400 hover:text-banner cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Distinct Square Size Boxes */}
          <div className="grid grid-cols-6 gap-1">
            {SIZES.map((sz) => {
              const isSelected = currentSize.toUpperCase() === sz.toUpperCase();
              return (
                <button
                  key={sz}
                  onClick={() => handleSizeSelect(sz)}
                  className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-banner text-white border-banner shadow-xs scale-105 font-black"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-banner hover:text-banner hover:bg-orange-50/30"
                  }`}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brands Section (Multi-select) */}
        <div className="pt-2.5 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-banner rounded-full"></span>
              <span className="font-extrabold text-xs uppercase tracking-wide text-neutral-900">
                Brands
              </span>
            </div>
            <span className="text-[10px] font-semibold text-neutral-400">
              {activeBrands.length ? `${activeBrands.length} selected` : "Multi-select"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {BRANDS.map((brand) => {
              const isSelected = activeBrands.includes(brand.name);
              return (
                <button
                  key={brand.name}
                  onClick={() => handleBrandToggle(brand.name)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-banner text-white border-banner shadow-xs font-bold"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  <span>{brand.short}</span>
                  <span className={`text-[8px] tabular-nums ${isSelected ? "text-orange-100" : "text-neutral-400"}`}>
                    {brand.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. CARD 3: Price Budget */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-banner rounded-full"></span>
            <span className="font-extrabold text-xs uppercase tracking-wide text-neutral-900">
              Price Budget
            </span>
          </div>
          {activePriceId !== "all" && (
            <button 
              onClick={removePriceFilter}
              className="text-[10px] font-bold text-neutral-400 hover:text-banner cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* 4 Segmented Price Range Pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {PRICE_RANGES.map((range) => {
            const active = activePriceId === range.id;
            return (
              <button
                key={range.id}
                onClick={() => handlePriceSelect(range)}
                className={`flex items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border truncate ${
                  active
                    ? "bg-banner text-white border-banner shadow-xs"
                    : "bg-neutral-50/80 hover:bg-neutral-100 text-neutral-700 border-neutral-200/70"
                }`}
              >
                {range.short}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}


