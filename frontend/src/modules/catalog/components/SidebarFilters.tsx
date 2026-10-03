"use client";

import React, { useMemo } from "react";
import { 
  X, 
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pt-3.5 flex flex-col gap-2.5">
          {children}
        </div>
      )}
    </div>
  );
}

export function SidebarFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract params to pass to API
  const currentCategory = searchParams.get("category") || "";
  const currentBrandParam = searchParams.get("brand") || "";
  const currentSearch = searchParams.get("search") || searchParams.get("q") || "";
  
  const { data: aggregations, isLoading } = useProductAggregations({
    category: currentCategory || undefined,
    search: currentSearch || undefined,
  });

  const CATEGORIES = aggregations?.categories 
    ? aggregations.categories.slice(0, 30).map((c: any) => {
        const parts = c.name.split('>');
        const displayName = parts[parts.length - 1].trim();
        const indent = (parts.length - 1) * 12; // increased indent for visual hierarchy
        return { 
          fullName: c.name, 
          displayName,
          slug: slugify(displayName), 
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

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (slug) params.set("category", slug);
    else params.delete("category");
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
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
    router.push(`/products?${params.toString()}`, { scroll: false });
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
    router.push(`/products?${params.toString()}`, { scroll: false });
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
    router.push(`/products?${params.toString()}`, { scroll: false });
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
      {activePills.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-200 p-4 mb-4 mt-2">
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
      )}

      {/* Dynamic Filter Sections powered by Backend filterConfig */}
      <div className="flex flex-col">
        {(aggregations?.filterConfig || [
          { code: "category", label: "Category" },
          { code: "price", label: "Price" },
          { code: "size", label: "Size" },
          { code: "brand", label: "Brand" },
          { code: "color", label: "Color" }
        ]).map((config: any) => {
          
          // 1. Categories
          if (config.code === "category" && !currentCategory && CATEGORIES.length > 0) {
            return (
              <AccordionSection key="category" title={config.label} defaultOpen={true}>
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
                            onChange={() => handleCategoryClick(cat.slug)}
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
            return (
              <AccordionSection key="price" title={config.label} defaultOpen={true}>
                <div className="flex flex-col gap-1.5">
                  {PRICE_RANGES.map((range) => {
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
              <AccordionSection key="size" title={config.label} defaultOpen={true}>
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
          if (config.code === "brand" && BRANDS.length > 0) {
            return (
              <AccordionSection key="brand" title={config.label} defaultOpen={true}>
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
              <AccordionSection key="color" title={config.label} defaultOpen={true}>
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
              <AccordionSection key={dynamicFilter.code} title={dynamicFilter.label} defaultOpen={true}>
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
        })}
      </div>
    </div>
  );
}
