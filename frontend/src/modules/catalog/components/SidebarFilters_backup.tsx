"use client";

import React, { useMemo } from "react";
import { 
  Filter, 
  RotateCcw, 
  X, 
  Check,
  PackageCheck,
  Tag,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProductAggregations } from "@/core/hooks/useProducts";
import { slugify } from "@store4riders/shared-utils";

const DEFAULT_CATEGORIES = [
  { name: "All Gear", slug: "", count: 0 },
];

const PRICE_RANGES = [
  { label: "< ₹3,000", short: "₹0.00 - ₹2,999.99", id: "under-3k", min: undefined, max: 3000 },
  { label: "₹3k – ₹6k", short: "₹3,000.00 - ₹5,999.99", id: "3k-6k", min: 3000, max: 6000 },
  { label: "₹6k – ₹10k", short: "₹6,000.00 - ₹9,999.99", id: "6k-10k", min: 6000, max: 10000 },
  { label: "> ₹10,000", short: "₹10,000.00 and above", id: "above-10k", min: 10000, max: undefined },
];

function AccordionSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-dashed border-neutral-300 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between text-left cursor-pointer group"
      >
        <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 group-hover:text-banner transition-colors">{title}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pt-4 flex flex-col gap-2.5">
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
        const indent = (parts.length - 1) * 8; // Slight indent for visual cue if it's a subcategory
        return { 
          fullName: c.name, 
          displayName,
          slug: slugify(displayName), 
          count: c.count,
          indent
        };
      }) // We rely on backend's count-based sorting so most popular (Helmets, etc) stay at the top
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
      let hex = "#cccccc"; // Default fallback
      
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
      return {
        code,
        label,
        values
      };
    });
  }, [aggregations?.dynamicAttributes]);


  // Active filters parsing
  const activeBrands = currentBrandParam ? currentBrandParam.split(",").map(b => b.trim()) : [];
  const activeSizes = searchParams.get("size") ? searchParams.get("size")!.split(",").map(s => s.trim()) : [];
  const activeColours = searchParams.get("colour") ? searchParams.get("colour")!.split(",").map(c => c.trim()) : [];
  const currentMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const currentMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const currentInStock = searchParams.get("inStock") === "true";
  const currentOnSale = searchParams.get("onSale") === "true";

  const activePriceId = PRICE_RANGES.find(p => p.min === currentMinPrice && p.max === currentMaxPrice)?.id || 
                       (currentMinPrice || currentMaxPrice ? "custom" : "all");

  const isCategoryActive = (slug: string) => {
    if (!currentCategory && !slug) return true;
    if (!currentCategory || !slug) return false;
    return currentCategory.toLowerCase() === slug.toLowerCase();
  };

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

  const toggleArrayParam = (paramName: string, value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const current = params.get(paramName) ? params.get(paramName)!.split(",") : [];
    
    if (current.includes(value)) {
      const updated = current.filter(item => item !== value);
      if (updated.length > 0) {
        params.set(paramName, updated.join(","));
      } else {
        params.delete(paramName);
      }
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

  return (
    <div className="w-full flex flex-col font-sans">
      
      {/* SHOPPING OPTIONS Header */}
      <div className="mb-2">
        <h3 className="text-[22px] text-neutral-900 font-light mb-4">Shop By</h3>
        <div className="border-t-2 border-neutral-900 w-12 mb-4"></div>
        <h4 className="text-[13px] font-bold uppercase text-neutral-900 tracking-wide">SHOPPING OPTIONS</h4>
      </div>

      {/* Dynamic Filter Sections powered by Backend filterConfig */}
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
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {CATEGORIES.map((cat: any) => {
                  const active = isCategoryActive(cat.slug);
                  return (
                    <label 
                      key={cat.fullName} 
                      className="flex items-center gap-2 cursor-pointer group"
                      style={{ paddingLeft: `${cat.indent}px` }}
                    >
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleCategoryClick(cat.slug)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={`text-[13px] ${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}`}>
                        {cat.displayName}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {cat.count}
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
              <div className="flex flex-col gap-2">
                {PRICE_RANGES.map((range) => {
                  const active = activePriceId === range.id;
                  return (
                    <button
                      key={range.id}
                      onClick={() => handlePriceSelect(range)}
                      className="flex items-center gap-2 text-[13px] text-left cursor-pointer group"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 ${active ? "text-banner" : "text-neutral-400 group-hover:text-banner"}`} />
                      <span className={active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}>
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
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {SIZES.map((sz: any) => {
                  const active = activeSizes.includes(sz.name);
                  return (
                    <label key={sz.name} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleSizeToggle(sz.name)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={`text-[13px] ${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}`}>
                        {sz.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {sz.count}
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
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {BRANDS.map((brand: any) => {
                  const active = activeBrands.includes(brand.name);
                  return (
                    <label key={brand.name} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleBrandToggle(brand.name)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={`text-[13px] ${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}`}>
                        {brand.short}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {brand.count}
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
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {COLOURS.map((color: any) => {
                  const active = activeColours.includes(color.name);
                  return (
                    <label key={color.name} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleColourToggle(color.name)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <div className="w-3 h-3 rounded-sm border border-neutral-300" style={{ backgroundColor: color.hex }}></div>
                      <span className={`text-[13px] ${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}`}>
                        {color.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {color.count}
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
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {dynamicFilter.values.map((val: any) => {
                  const active = activeValues.includes(val.name);
                  return (
                    <label key={val.name} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleDynamicFilterToggle(dynamicFilter.code, val.name)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={`text-[13px] ${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}`}>
                        {val.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {val.count}
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
  );
}
