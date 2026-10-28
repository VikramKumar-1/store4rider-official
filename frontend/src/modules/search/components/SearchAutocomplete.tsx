"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ArrowLeftIcon, 
  ChevronRightIcon, 
  ShoppingBagIcon,
  TagIcon
} from "@heroicons/react/24/outline";
import { useSearchSuggestions } from "@/core/hooks/useSearch";

interface SearchAutocompleteProps {
  isLight: boolean;
  onClose?: () => void;
  isMobileFull?: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ 
  isLight,
  onClose,
  isMobileFull = false
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query for API calls (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Auto-focus input on mobile full-screen view
  useEffect(() => {
    if (isMobileFull && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobileFull]);

  // Fetch live suggestions only when query length >= 2
  const { data, isLoading } = useSearchSuggestions(debouncedQuery);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (isMobileFull) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileFull]);

  const handleSubmit = (
    e?: React.FormEvent, 
    searchQuery?: string,
    categorySlug?: string,
    brandName?: string
  ) => {
    if (e) e.preventDefault();
    const finalQuery = (searchQuery !== undefined ? searchQuery : query).trim();
    if (finalQuery) {
      setIsOpen(false);
      if (onClose) onClose();

      const params = new URLSearchParams();
      params.set("q", finalQuery);
      if (categorySlug) params.set("category", categorySlug);
      if (brandName) params.set("brand", brandName);

      router.push(`/search?${params.toString()}`);
    }
  };

  const handleProductClick = () => {
    setIsOpen(false);
    setQuery("");
    if (onClose) onClose();
  };

  const products = (data?.products || []).filter((p) => p.inStock);
  const categories = data?.categories || [];
  const brands = data?.brands || [];
  const hasResults = products.length > 0 || categories.length > 0 || brands.length > 0;
  
  // ONLY show dropdown if debounced query is at least 2 characters (No static empty suggestions)
  const isSearchActive = debouncedQuery.length >= 2;
  const showDesktopDropdown = !isMobileFull && isOpen && isSearchActive;

  // -------------------------------------------------------------
  // MOBILE FULL-SCREEN SEARCH VIEW
  // -------------------------------------------------------------
  if (isMobileFull) {
    return (
      <div className="h-full w-full flex flex-col bg-white text-slate-900 overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="px-3 py-2.5 border-b border-slate-200 flex items-center gap-2 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="p-2 -ml-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.25]" />
          </button>

          <form onSubmit={(e) => handleSubmit(e)} className="flex-1 min-w-0">
            <div className="relative flex items-center bg-slate-100 rounded-full border border-slate-200/90 focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/5 transition-all px-3 py-1.5">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 shrink-0 mr-2 stroke-[2.25]" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                placeholder="Search helmets, jackets, boots, brands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear text"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors ml-1 cursor-pointer"
                >
                  <XMarkIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </form>

          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            className="text-slate-900 hover:bg-slate-100 font-bold text-sm px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer shrink-0"
          >
            Search
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {!isSearchActive ? (
            /* Clean Empty State: Simple Prompt */
            <div className="h-64 flex flex-col items-center justify-center text-center px-4 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <MagnifyingGlassIcon className="w-6 h-6 stroke-[1.75]" />
              </div>
              <p className="text-sm font-medium text-slate-700">Search Store4Riders Catalog</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Type at least 2 characters to discover motorcycle helmets, riding gear, and accessories.
              </p>
            </div>
          ) : isLoading ? (
            /* Loading State */
            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-500">
              <div className="w-7 h-7 border-3 border-slate-800 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Searching Store4Riders catalog...</p>
            </div>
          ) : !hasResults ? (
            /* Empty Results */
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-semibold text-slate-800">
                No results found for &quot;{debouncedQuery}&quot;
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                Check your spelling or try searching for a brand like Axor, SMK, Rynox, or Forma.
              </p>
            </div>
          ) : (
            /* Results List */
            <div className="space-y-4">
              {/* Matching Categories & Brands Tags */}
              {(categories.length > 0 || brands.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                  {categories.slice(0, 3).map((cat) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={cat.url || `/search?q=${encodeURIComponent(cat.name)}`}
                      onClick={handleProductClick}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/60 transition-colors"
                    >
                      <TagIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                  {brands.slice(0, 3).map((brandName) => (
                    <button
                      key={brandName}
                      type="button"
                      onClick={() => handleSubmit(undefined, debouncedQuery, undefined, brandName)}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
                    >
                      <span>{brandName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Products List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Matching Products ({products.length})
                </div>
                {products.map((product) => {
                  const base = Number(product.basePrice) || 0;
                  const special = Number(product.specialPrice) || base;
                  const hasDiscount = special < base;
                  const discountPercent = hasDiscount ? Math.round(((base - special) / base) * 100) : 0;
                  const productThumbnail = (product as any).thumbnail || (product as any).image || "";

                  return (
                    <Link
                      key={product.id || product.slug}
                      href={`/${product.slug}`}
                      onClick={handleProductClick}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-400 transition-all active:scale-[0.99] group"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-50 border border-slate-200/80 shrink-0 p-1 flex items-center justify-center">
                        {productThumbnail ? (
                          <Image
                            src={productThumbnail}
                            alt={product.name}
                            fill
                            sizes="56px"
                            className="object-contain p-0.5"
                            unoptimized={typeof productThumbnail === "string" && productThumbnail.startsWith("http")}
                          />
                        ) : (
                          <ShoppingBagIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-1">
                        {product.brand && (
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                            {product.brand}
                          </p>
                        )}
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-black line-clamp-1 leading-snug transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm font-bold text-slate-950 font-sans">
                            ₹{special.toLocaleString("en-IN")}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-xs text-slate-400 line-through">
                                ₹{base.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-200/60">
                                {discountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sticky Bottom CTA */}
        {isSearchActive && hasResults && (
          <div className="p-3 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              className="w-full bg-neutral-900 hover:bg-black text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View All Results for &quot;{debouncedQuery}&quot;</span>
              <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DESKTOP AUTOCOMPLETE VIEW (PROPORTIONATE, SLEEK DROPDOWN)
  // -------------------------------------------------------------
  return (
    <div 
      className="relative flex items-center group w-44 sm:w-52 md:w-60 lg:w-72 xl:w-80" 
      ref={containerRef}
    >
      <form onSubmit={(e) => handleSubmit(e)} className="w-full">
        <div className={`relative flex items-center rounded-full transition-all duration-200 w-full ${
          isLight
            ? "border bg-neutral-100/90 border-neutral-200/90 shadow-2xs focus-within:bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5"
            : "border bg-black/40 backdrop-blur-xl border-white/25 shadow-md focus-within:bg-black/65 focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20"
        }`}>
          {/* Search Icon */}
          <div className="pl-3 pr-1.5 pointer-events-none flex items-center">
            <MagnifyingGlassIcon className={`w-4 h-4 shrink-0 transition-colors ${
              isLight
                ? "text-neutral-400 group-focus-within:text-slate-800 stroke-[2]"
                : "text-white/60 group-focus-within:text-white stroke-[2]"
            }`} />
          </div>

          {/* Search Input */}
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search helmets, gear, parts..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (debouncedQuery.length >= 2) setIsOpen(true);
            }}
            className={`w-full bg-transparent text-xs sm:text-[13px] py-1.5 sm:py-2 pl-1 pr-2 focus:outline-none font-medium transition-colors [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden ${
              isLight 
                ? "text-neutral-900 placeholder:text-neutral-400" 
                : "text-white placeholder:text-white/60"
            }`}
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className={`mr-2.5 p-0.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                isLight ? "text-neutral-400 hover:text-neutral-700 bg-neutral-200/70" : "text-white/60 hover:text-white bg-white/20"
              }`}
              aria-label="Clear search"
            >
              <XMarkIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>

      {/* Sleek, proportionate desktop autocomplete dropdown (Slate / Black neutral theme) */}
      {showDesktopDropdown && (
        <div className="absolute top-full mt-2 right-0 w-[420px] sm:w-[460px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 font-sans">
          {isLoading ? (
            /* Loading State */
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
              <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Searching catalog...</p>
            </div>
          ) : !hasResults ? (
            /* Empty State */
            <div className="py-8 px-4 text-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                No products found for &quot;{debouncedQuery}&quot;
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try searching for &apos;Helmets&apos;, &apos;Jackets&apos;, &apos;Axor&apos;, or &apos;SMK&apos;
              </p>
            </div>
          ) : (
            /* Results Panel */
            <div className="flex flex-col">
              {/* Quick Category & Brand Badges (1 compact row with actual category URLs) */}
              {(categories.length > 0 || brands.length > 0) && (
                <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {categories.slice(0, 2).map((cat) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={cat.url || `/search?q=${encodeURIComponent(cat.name)}`}
                      onClick={handleProductClick}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white text-slate-800 hover:bg-slate-100 hover:text-black border border-slate-200/80 transition-colors shadow-2xs"
                    >
                      <TagIcon className="w-3 h-3 text-slate-400" />
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                  {brands.slice(0, 3).map((brandName) => (
                    <button
                      key={brandName}
                      type="button"
                      onClick={() => handleSubmit(undefined, debouncedQuery, undefined, brandName)}
                      className="shrink-0 inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
                    >
                      <span>{brandName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Product Rows List */}
              <div className="p-2 space-y-1 max-h-[360px] overflow-y-auto">
                {products.slice(0, 5).map((product) => {
                  const base = Number(product.basePrice) || 0;
                  const special = Number(product.specialPrice) || base;
                  const hasDiscount = special < base;
                  const discountPercent = hasDiscount ? Math.round(((base - special) / base) * 100) : 0;
                  const productThumbnail = (product as any).thumbnail || (product as any).image || "";

                  return (
                    <Link
                      key={product.id || product.slug}
                      href={`/${product.slug}`}
                      onClick={handleProductClick}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-200/70 shrink-0 p-1 flex items-center justify-center">
                        {productThumbnail ? (
                          <Image
                            src={productThumbnail}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-contain p-0.5"
                            unoptimized={typeof productThumbnail === "string" && productThumbnail.startsWith("http")}
                          />
                        ) : (
                          <ShoppingBagIcon className="w-4 h-4 text-slate-300" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        {product.brand && (
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                            {product.brand}
                          </p>
                        )}
                        <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 group-hover:text-black line-clamp-1 leading-snug transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-950 font-sans">
                            ₹{special.toLocaleString("en-IN")}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{base.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
                                {discountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {/* Bottom "View All" CTA Button (Sleek Charcoal / Neutral Black) */}
              <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e)}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View All Results for &quot;{debouncedQuery}&quot;</span>
                  <ChevronRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
