"use client";

import React, { useMemo } from "react";
import { 
  X, 
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProductAggregations } from "@/core/hooks/useProducts";
import { slugify } from "@store4riders/shared-utils";

const PRICE_RANGES = [
  { label: "< ₹3,000", short: "₹0.00 - ₹2,999.99", id: "under-3k", min: undefined, max: 3000 },
  { label: "₹3k – ₹6k", short: "₹3,000.00 - ₹5,999.99", id: "3k-6k", min: 3000, max: 6000 },
  { label: "₹6k – ₹10k", short: "₹6,000.00 - ₹9,999.99", id: "6k-10k", min: 6000, max: 10000 },
  { label: "> ₹10,000", short: "₹10,000.00 and above", id: "above-10k", min: 10000, max: undefined },
];

function AccordionSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-solid border-neutral-200 py-3.5">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between text-left cursor-pointer group outline-none"
      >
        <span className="font-bold text-[13px] uppercase tracking-wide text-neutral-900 group-hover:text-banner transition-colors">{title}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2.5 pt-3.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  let currentCategory = searchParams.get("category") || "";
  if (!currentCategory && params?.categorySlug) {
    const slugArr = params.categorySlug as string[];
    currentCategory = slugArr[slugArr.length - 1];
  }

  // Extract brand from either URL search params or dynamic path segment (for Brand Pages)
  const isBrandPage = !!params?.brandSlug;
  const currentBrandParam = searchParams.get("brand") || (params?.brandSlug as string) || "";
  const currentSearch = searchParams.get("search") || searchParams.get("q") || "";
  
  const { data: aggregations, isLoading } = useProductAggregations({
    category: currentCategory || undefined,
    search: currentSearch || undefined,
    brand: currentBrandParam || undefined,
    colour: searchParams.get("colour") || searchParams.get("color") || undefined,
    size: searchParams.get("size") || undefined,
    helmet_type: searchParams.get("helmet_type") || undefined,
    material: searchParams.get("material") || undefined,
    riding_style: searchParams.get("riding_style") || undefined,
    certification: searchParams.get("certification") || undefined,
    gender: searchParams.get("gender") || undefined,
  });

  const CATEGORIES = aggregations?.categories 
    ? aggregations.categories.slice(0, 30).map((c: any) => {
        const rawParts = c.name.split('>');
        const parts = rawParts.map((p: string) => p.trim()).filter((p: string) => 
          !p.toLowerCase().includes('root') && !p.toLowerCase().includes('default category')
        );
        const displayName = parts.length > 0 ? parts[parts.length - 1] : rawParts[rawParts.length - 1].trim();
        const indent = Math.max(0, parts.length - 1) * 12; // increased indent for visual hierarchy
        const fullSlug = parts.length > 0 ? parts.map((p: string) => slugify(p)).join('/') : slugify(displayName);
        return { 
          fullName: c.name, 
          displayName,
          slug: slugify(displayName), 
          fullSlug,
          count: c.count,
          indent
        };
      })
    : [];
    
  const BRANDS = aggregations?.brands 
    ? aggregations.brands.slice(0, 15).map((b: any) => ({ name: b.name, short: b.name, count: b.count }))
    : [];
    
  const SIZES = aggregations?.sizes 
    ? aggregations.sizes.slice(0, 12).map((s: any) => ({ name: s.name, count: s.count }))
    : [];
    
  const COLOURS = useMemo(() => {
    if (!aggregations?.colors) return [];
    
    return aggregations.colors.map((c: any) => {
      const nameLower = c.name.toLowerCase();
      let hex = "#cccccc";
      
      if (nameLower.includes('red')) hex = '#DC2626';
      else if (nameLower.includes('blue')) hex = '#2563EB';
      else if (nameLower.includes('green') || nameLower.includes('olive') || nameLower.includes('khaki')) hex = '#16A34A';
      else if (nameLower.includes('yellow')) hex = '#EAB308';
      else if (nameLower.includes('orange') || nameLower.includes('org')) hex = '#EA580C';
      else if (nameLower.includes('white')) hex = '#FFFFFF';
      else if (nameLower.includes('brown') || nameLower.includes('tan')) hex = '#78350F';
      else if (nameLower.includes('grey') || nameLower.includes('gray') || nameLower.includes('anthracite') || nameLower.includes('titanium')) hex = '#6B7280';
      else if (nameLower.includes('black') || nameLower.includes('noir') || nameLower.includes('matte')) hex = '#111111';
      else if (nameLower.includes('silver')) hex = '#9CA3AF';
      else if (nameLower.includes('hi-viz') || nameLower.includes('neon')) hex = '#D9F99D';

      return { name: c.name, count: c.count, hex };
    });
  }, [aggregations?.colors]);

  const DYNAMIC_FILTERS = useMemo(() => {
    if (!aggregations?.dynamicAttributes) return [];
    return Object.entries(aggregations.dynamicAttributes).map(([code, values]: [string, any]) => {
      let label = code.replace(/_/g, " ").toUpperCase();
      if (code === 'helmet_type') label = 'HELMET TYPE';
      if (code === 'riding_style') label = 'RIDING STYLE';
      return { code, label, values };
    });
  }, [aggregations?.dynamicAttributes]);

  // Active filters parsing
  const activeBrands = currentBrandParam ? currentBrandParam.split(",").map(b => b.trim()) : [];
  const activeSizes = searchParams.get("size") ? searchParams.get("size")!.split(",").map(s => s.trim()) : [];
  const activeColours = searchParams.get("colour") ? searchParams.get("colour")!.split(",").map(c => c.trim()) : [];
  const currentMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const currentMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

  const activePriceObj = PRICE_RANGES.find(p => p.min === currentMinPrice && p.max === currentMaxPrice);
  const activePriceId = activePriceObj?.id || (currentMinPrice || currentMaxPrice ? "custom" : "all");

  const isCategoryActive = (slug: string) => {
    if (!currentCategory && !slug) return true;
    if (!currentCategory || !slug) return false;
    return currentCategory.toLowerCase() === slug.toLowerCase();
  };

  const handleCategoryClick = (slug: string, fullSlug?: string) => {
    const queryParams = new URLSearchParams(Array.from(searchParams.entries()));
    queryParams.set("page", "1");
    
    if (isBrandPage) {
      if (!slug) {
        queryParams.delete("category");
      } else {
        queryParams.set("category", slug);
      }
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      router.push(`/brands/${currentBrandParam}${qs}`, { scroll: false });
      return;
    }

    queryParams.delete("category"); // Clean it up from search params just in case
    // If they uncheck the category, they go back to all products
    if (!slug) {
      router.push(`/products?${queryParams.toString()}`, { scroll: false });
    } else {
      // Use the beautiful nested URL
      const path = fullSlug ? `/${fullSlug}` : `/${slug}`;
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      router.push(`${path}${qs}`, { scroll: false });
    }
  };

  const toggleArrayParam = (paramName: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const current = params.get(paramName) ? params.get(paramName)!.split(",") : [];
    
    if (current.includes(value)) {
      const updated = current.filter(item => item !== value);
      if (updated.length > 0) params.set(paramName, updated.join(","));
      else params.delete(paramName);
    } else {
      current.push(value);
      params.set(paramName, current.join(","));
    }
    
    params.set("page", "1");
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/products';
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleBrandToggle = (brandName: string) => toggleArrayParam("brand", brandName);
  const handleSizeToggle = (size: string) => toggleArrayParam("size", size);
  const handleColourToggle = (colour: string) => toggleArrayParam("colour", colour);
  const handleDynamicFilterToggle = (code: string, val: string) => toggleArrayParam(code, val);

  const handlePriceSelect = (range: any) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (range.id === "all") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      if (range.min !== undefined) params.set("minPrice", range.min.toString());
      else params.delete("minPrice");
      if (range.max !== undefined) params.set("maxPrice", range.max.toString());
      else params.delete("maxPrice");
    }
    params.set("page", "1");
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/products';
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const removeArrayParamItem = (paramName: string, value: string) => {
    toggleArrayParam(paramName, value);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const keepKeys = ['search', 'q', 'category']; // Keep search query and category
    const allKeys = Array.from(params.keys());
    allKeys.forEach(key => {
      if (!keepKeys.includes(key)) {
        params.delete(key);
      }
    });
    params.set("page", "1");
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/products';
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Build active pills list for "Now Shopping By"
  const activePills: { label: string; param: string; value: string; displayValue: string }[] = [];
  
  if (activePriceId !== "all") {
    let display = activePriceObj ? activePriceObj.label : `₹${currentMinPrice || 0} - ₹${currentMaxPrice || 'Above'}`;
    activePills.push({ label: "Price", param: "price", value: activePriceId, displayValue: display });
  }
  
  activeBrands.forEach(b => activePills.push({ label: "Brand", param: "brand", value: b, displayValue: b }));
  activeSizes.forEach(s => activePills.push({ label: "Size", param: "size", value: s, displayValue: s }));
  activeColours.forEach(c => activePills.push({ label: "Color", param: "colour", value: c, displayValue: c }));
  
  DYNAMIC_FILTERS.forEach(df => {
    const paramValue = searchParams.get(df.code);
    if (paramValue) {
      paramValue.split(",").map(v => v.trim()).forEach(val => {
        activePills.push({ label: df.label, param: df.code, value: val, displayValue: val });
      });
    }
  });

  return (
    <div className="w-full flex flex-col font-sans">
      
      {/* SHOPPING OPTIONS Header */}
      <div className="mb-2">
        <h3 className="text-[20px] text-neutral-800 font-medium mb-3">Shop By</h3>
        <div className="border-t-2 border-neutral-900 w-10 mb-4"></div>
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-bold uppercase text-neutral-900 tracking-wide">SHOPPING OPTIONS</h4>
          {activePills.length > 0 && (
            <button 
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-banner hover:text-red-700 uppercase tracking-wider"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* NOW SHOPPING BY - Active Filters Summary */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activePills.length > 0 ? "max-h-[500px] opacity-100 mb-4 mt-2" : "max-h-0 opacity-0 mb-0 mt-0"}`}>
        <div className="bg-neutral-50 border border-neutral-200 p-4">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Now Shopping By</h5>
          <div className="flex flex-col gap-2">
            {activePills.map((pill, idx) => (
              <div key={idx} className="flex items-start justify-between group">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-neutral-700 uppercase">{pill.label}:</span>
                  <span className="text-[13px] font-semibold text-neutral-900">{pill.displayValue}</span>
                </div>
                <button 
                  onClick={() => {
                    if (pill.param === 'price') handlePriceSelect({ id: 'all' });
                    else removeArrayParamItem(pill.param, pill.value);
                  }}
                  className="mt-1 p-1 rounded hover:bg-neutral-200 text-neutral-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Filter Sections powered by Backend filterConfig */}
      <div className="flex flex-col">
        {(() => {
          const baseConfig = aggregations?.filterConfig || [
            { code: "category", label: "Category" },
            { code: "price", label: "Price" },
            { code: "size", label: "Size" },
            { code: "brand", label: "Brand" },
            { code: "color", label: "Color" }
          ];
          
          const fullConfig = [...baseConfig];
          DYNAMIC_FILTERS.forEach((df: any) => {
            if (!fullConfig.find(c => c.code === df.code)) {
              fullConfig.push({ code: df.code, label: df.label });
            }
          });
          
          return fullConfig.map((config: any) => {
          
          // 1. Categories
          if (config.code === "category" && !currentCategory && CATEGORIES.length > 0) {
            return (
              <AccordionSection key="category" title={config.label} defaultOpen={false}>
                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-2">
                  {CATEGORIES.map((cat: any) => {
                    const active = isCategoryActive(cat.slug);
                    return (
                      <label 
                        key={cat.fullName} 
                        className="flex items-center justify-between cursor-pointer group"
                        style={{ paddingLeft: `${cat.indent}px` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={active}
                            onChange={() => handleCategoryClick(active ? "" : cat.slug, cat.fullSlug)}
                            className="w-4 h-4 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer bg-white transition-colors"
                          />
                          <span className={`text-[14px] ${active ? "text-banner font-bold" : "text-neutral-700 group-hover:text-banner"}`}>
                            {cat.displayName}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          ({cat.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionSection>
            );
          }

          // 2. Price
          if (config.code === "price") {
            const minPrice = aggregations?.priceStats?.min || 0;
            const maxPrice = aggregations?.priceStats?.max || Infinity;
            
            // Only show price ranges that overlap with the actual products on this page
            const applicableRanges = PRICE_RANGES.filter(range => {
              const rangeMin = range.min || 0;
              const rangeMax = range.max || Infinity;
              return rangeMax >= minPrice && rangeMin <= maxPrice;
            });
            
            if (applicableRanges.length === 0) return null;
            
            return (
              <AccordionSection key="price" title={config.label} defaultOpen={true}>
                <div className="flex flex-col gap-1.5">
                  {applicableRanges.map((range) => {
                    const active = activePriceId === range.id;
                    return (
                      <button
                        key={range.id}
                        onClick={() => handlePriceSelect(range)}
                        className="flex items-center gap-2 text-[14px] text-left cursor-pointer group py-1"
                      >
                        <ChevronRight className={`w-4 h-4 ${active ? "text-banner" : "text-neutral-400 group-hover:text-banner"}`} />
                        <span className={active ? "text-banner font-bold" : "text-neutral-700 group-hover:text-banner"}>
                          {range.short}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </AccordionSection>
            );
          }

          // 3. Size
          if (config.code === "size" && SIZES.length > 0) {
            return (
              <AccordionSection key="size" title={config.label} defaultOpen={false}>
                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-2">
                  {SIZES.map((sz: any) => {
                    const active = activeSizes.includes(sz.name);
                    return (
                      <label key={sz.name} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={active}
                            onChange={() => handleSizeToggle(sz.name)}
                            className="w-4 h-4 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer bg-white transition-colors"
                          />
                          <span className={`text-[14px] ${active ? "text-banner font-bold" : "text-neutral-700 group-hover:text-banner"}`}>
                            {sz.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          ({sz.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionSection>
            );
          }

          // 4. Brand
          if (config.code === "brand" && BRANDS.length > 0 && !isBrandPage) {
            return (
              <AccordionSection key="brand" title={config.label} defaultOpen={false}>
                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-2">
                  {BRANDS.map((brand: any) => {
                    const active = activeBrands.includes(brand.name);
                    return (
                      <label key={brand.name} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={active}
                            onChange={() => handleBrandToggle(brand.name)}
                            className="w-4 h-4 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer bg-white transition-colors"
                          />
                          <span className={`text-[14px] ${active ? "text-banner font-bold" : "text-neutral-700 group-hover:text-banner"}`}>
                            {brand.short}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          ({brand.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionSection>
            );
          }

          // 5. Color
          if (config.code === "color" && COLOURS.length > 0) {
            return (
              <AccordionSection key="color" title={config.label} defaultOpen={false}>
                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-2">
                  {COLOURS.map((color: any) => {
                    const active = activeColours.includes(color.name);
                    return (
                      <label key={color.name} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={active}
                            onChange={() => handleColourToggle(color.name)}
                            className="w-4 h-4 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer bg-white transition-colors"
                          />
                          <div className="w-3.5 h-3.5 rounded-sm border border-neutral-200" style={{ backgroundColor: color.hex }}></div>
                          <span className={`text-[14px] ${active ? "text-banner font-bold" : "text-neutral-700 group-hover:text-banner"}`}>
                            {color.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          ({color.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionSection>
            );
          }

          // 6. Dynamic Filter Attributes (helmet_type, gender, material, etc)
          const dynamicFilter = DYNAMIC_FILTERS.find((df: any) => df.code === config.code);
          if (dynamicFilter && dynamicFilter.values.length > 0) {
            const paramValue = searchParams.get(dynamicFilter.code) || "";
            const activeValues = Array.from(new Set(paramValue ? paramValue.split(",").map((v) => v.trim()) : []));
            
            return (
              <AccordionSection key={dynamicFilter.code} title={dynamicFilter.label} defaultOpen={false}>
                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-2">
                  {dynamicFilter.values.map((val: any) => {
                    const active = activeValues.includes(val.name);
                    return (
                      <label key={val.name} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={active}
                            onChange={() => handleDynamicFilterToggle(dynamicFilter.code, val.name)}
                            className="w-4 h-4 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer bg-white transition-colors"
                          />
                          <span className={`text-[14px] ${active ? "text-banner font-bold" : "text-neutral-700 group-hover:text-banner"}`}>
                            {val.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          ({val.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionSection>
            );
          }

          return null;
        })})()}
      </div>
    </div>
  );
}
