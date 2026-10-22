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
  FireIcon,
  SparklesIcon 
} from "@heroicons/react/24/outline";
import { useTrendingSearches, useSearchSuggestions } from "@/core/hooks/useSearch";

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

  // Debounce the query for API calls (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Auto-focus mobile input when opened
  useEffect(() => {
    if (isMobileFull && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobileFull]);

  // Dynamic Popular/Trending Searches & Top Categories from backend
  const { data: trendingData, isLoading: isTrendingLoading } = useTrendingSearches();
  const trendingKeywords = trendingData?.trending || [];
  const quickCategories = trendingData?.categories || [];

  // Live suggestions with typo tolerance and category/brand discovery
  const { data, isLoading } = useSearchSuggestions(debouncedQuery);

  // Handle outside click for desktop dropdown
  useEffect(() => {
    if (isMobileFull) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileFull]);

  const handleSubmit = (e?: React.FormEvent, searchQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (searchQuery !== undefined ? searchQuery : query).trim();
    if (finalQuery) {
      setIsOpen(false);
      if (onClose) onClose();
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    }
  };

  const handleProductClick = () => {
    setIsOpen(false);
    setQuery("");
    if (onClose) onClose();
  };

  const handleChipClick = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    handleSubmit(undefined, term);
  };

  const products = data?.products || [];
  const categories = data?.categories || [];
  const brands = data?.brands || [];
  const hasResults = products.length > 0 || categories.length > 0 || brands.length > 0;
  const showDesktopDropdown = !isMobileFull && isOpen;

  // -------------------------------------------------------------
  // MOBILE FULL-SCREEN SEARCH VIEW
  // -------------------------------------------------------------
  if (isMobileFull) {
    return (
      <div className="h-full w-full flex flex-col bg-white text-slate-900 overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="px-3.5 py-3 border-b border-slate-200/90 flex items-center gap-2.5 bg-white shrink-0 shadow-xs">
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="p-2 -ml-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.25]" />
          </button>

          {/* Search Form & Input */}
          <form onSubmit={handleSubmit} className="flex-1 min-w-0">
            <div className="relative flex items-center bg-slate-100/90 rounded-full border border-slate-200 focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/10 transition-all px-3 py-1.5">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 shrink-0 mr-2 stroke-[2.25]" />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                placeholder="Search helmets, jackets, boots, brands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[15px] sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear text"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors ml-1"
                >
                  <XMarkIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </form>

          {/* Search CTA Button */}
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            className="text-brand font-bold text-sm px-2 py-1 rounded-lg hover:bg-brand/5 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            Search
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {/* STATE 1: Empty Query - Show Dynamic Trending & Top Categories */}
          {debouncedQuery.length < 2 && (
            <div className="space-y-6 pt-1">
              {/* Dynamic Trending Searches */}
              {trendingKeywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    <FireIcon className="w-4 h-4 text-banner" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingKeywords.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleChipClick(term)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 transition-colors active:scale-95 cursor-pointer"
                      >
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Quick Categories */}
              {quickCategories.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Top Categories
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {quickCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${cat.slug}`}
                        onClick={onClose}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between group transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors">
                          {cat.name}
                        </span>
                        <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:text-brand transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {isTrendingLoading && trendingKeywords.length === 0 && (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* STATE 2: Loading Indicator */}
          {debouncedQuery.length >= 2 && isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Searching Store4Riders catalog...</p>
            </div>
          )}

          {/* STATE 3: No Results Found */}
          {debouncedQuery.length >= 2 && !isLoading && !hasResults && (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <MagnifyingGlassIcon className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  No matching products found
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                  We could not find anything matching "{debouncedQuery}". Try checking spelling or search a broader term.
                </p>
              </div>
              {trendingKeywords.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Try searching for:
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {trendingKeywords.slice(0, 5).map((term: string) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleChipClick(term)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 4: Results Display */}
          {debouncedQuery.length >= 2 && !isLoading && hasResults && (
            <div className="space-y-5">
              {/* Matching Categories */}
              {categories.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Matching Categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat: any) => (
                      <Link
                        key={cat.id || cat.slug}
                        href={`/${cat.slug}`}
                        onClick={handleProductClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand/5 text-brand border border-brand/20 hover:bg-brand/10 transition-colors"
                      >
                        <span>{cat.name}</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Brands */}
              {brands.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Matching Brands
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brandName: string) => (
                      <button
                        key={brandName}
                        type="button"
                        onClick={() => handleChipClick(brandName)}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:border-brand hover:text-brand transition-colors"
                      >
                        <span>{brandName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Typo Correction Banner */}
              {data?.isCorrected && data?.correctedQuery && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900">
                  <SparklesIcon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Showing results for <strong className="font-bold underline">{data.correctedQuery}</strong> (corrected from "{debouncedQuery}")
                  </span>
                </div>
              )}

              {/* Matching Products (Spacious, Clear Product Cards) */}
              {products.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Products ({products.length})
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {products.map((product: any) => {
                      const base = Number(product.basePrice) || 0;
                      const special = Number(product.specialPrice) || base;
                      const hasDiscount = special < base;
                      const discountPercent = hasDiscount ? Math.round(((base - special) / base) * 100) : 0;
                      const productThumbnail =
                        product.thumbnail ||
                        product.image ||
                        (Array.isArray(product.images) && product.images.length > 0
                          ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url)
                          : "") ||
                        (product.colorImages && typeof product.colorImages === "object"
                          ? Object.values(product.colorImages)[0]
                          : "");

                      return (
                        <Link
                          key={product.id || product.slug}
                          href={`/${product.slug}`}
                          onClick={handleProductClick}
                          className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-brand/50 hover:shadow-md transition-all active:scale-[0.99] group"
                        >
                          {/* Image Box */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 p-1 flex items-center justify-center">
                            {productThumbnail ? (
                              <Image
                                src={productThumbnail}
                                alt={product.name}
                                fill
                                sizes="80px"
                                className="object-contain p-1"
                                unoptimized={typeof productThumbnail === "string" && productThumbnail.startsWith("http")}
                              />
                            ) : (
                              <MagnifyingGlassIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0 pr-1">
                            {product.brand && (
                              <p className="text-[11px] font-bold text-banner uppercase tracking-wider leading-none mb-1">
                                {product.brand}
                              </p>
                            )}
                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand line-clamp-2 leading-snug transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                              <span className="text-base font-bold text-slate-950 font-sans">
                                ₹{special.toLocaleString("en-IN")}
                              </span>
                              {hasDiscount && (
                                <>
                                  <span className="text-xs text-slate-400 line-through">
                                    ₹{base.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                    {discountPercent}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right Arrow */}
                          <div className="text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0">
                            <ChevronRightIcon className="w-5 h-5 stroke-[2]" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Sticky Bottom "View All" Button */}
        {debouncedQuery.length >= 2 && hasResults && (
          <div className="p-3 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              className="w-full bg-brand hover:bg-brand/95 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View All Results for "{debouncedQuery}"</span>
              <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DESKTOP NAVBAR AUTOCOMPLETE VIEW
  // -------------------------------------------------------------
  return (
    <div 
      className="relative flex items-center group w-32 sm:w-36 md:w-40 lg:w-36 xl:w-44 2xl:w-64" 
      ref={containerRef}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <div className={`relative flex items-center rounded-full transition-all duration-300 w-full ${
          isLight
            ? "border bg-neutral-100/90 border-neutral-200/90 shadow-xs focus-within:bg-white focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/5"
            : "border bg-black/40 backdrop-blur-xl border-white/25 shadow-md focus-within:bg-black/65 focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20"
        }`}>
          {/* Search Icon */}
          <div className="pl-2.5 xl:pl-3.5 pr-1 xl:pr-1.5 pointer-events-none flex items-center">
            <MagnifyingGlassIcon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 transition-colors ${
              isLight
                ? "text-neutral-400 group-focus-within:text-banner stroke-[2]"
                : "text-white/60 group-focus-within:text-banner stroke-[2]"
            }`} />
          </div>

          {/* Search Input */}
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search our store..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className={`w-full bg-transparent text-[12px] xl:text-[13px] py-1.5 xl:py-2 pl-1 pr-2 focus:outline-none font-medium transition-colors [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden ${
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
              className={`mr-2 p-0.5 rounded-full transition-colors flex items-center justify-center ${
                isLight ? "text-neutral-400 hover:text-neutral-700 bg-neutral-200/60" : "text-white/60 hover:text-white bg-white/20"
              }`}
              aria-label="Clear search"
            >
              <XMarkIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>

      {/* Desktop Autocomplete Dropdown */}
      {showDesktopDropdown && (
        <div className="absolute top-full mt-2 right-0 w-[380px] sm:w-[420px] md:w-[480px] lg:w-[500px] xl:w-[520px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 font-sans">
          {debouncedQuery.length < 2 ? (
            <div className="p-4 space-y-4">
              {/* Dynamic Popular Searches */}
              {trendingKeywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    <FireIcon className="w-4 h-4 text-banner" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingKeywords.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleChipClick(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors active:scale-95 cursor-pointer"
                      >
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Quick Categories */}
              {quickCategories.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Top Categories
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${cat.slug}`}
                        onClick={handleProductClick}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between group transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-brand transition-colors">
                          {cat.name}
                        </span>
                        <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {isTrendingLoading && trendingKeywords.length === 0 && (
                <div className="py-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-slate-500">
              <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Searching products...</p>
            </div>
          ) : !hasResults ? (
            <div className="py-10 px-4 text-center">
              <p className="text-sm font-semibold text-slate-800">
                No results found for "{debouncedQuery}"
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for 'Rynox', 'Axor', 'Helmets', or 'Jackets'
              </p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto overscroll-contain p-3.5 space-y-4">
              {/* Matching Categories */}
              {categories.length > 0 && (
                <div className="border-b border-slate-100 pb-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {categories.slice(0, 4).map((cat: any) => (
                      <Link
                        key={cat.id || cat.slug}
                        href={`/${cat.slug}`}
                        onClick={handleProductClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 hover:bg-brand/10 hover:text-brand hover:border-brand/30 border border-slate-200 transition-colors"
                      >
                        <span>{cat.name}</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Brands */}
              {brands.length > 0 && (
                <div className="border-b border-slate-100 pb-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Brands
                  </div>
                  <div className="flex flex-wrap gap-2 px-1">
                    {brands.map((brandName: string) => (
                      <button
                        key={brandName}
                        type="button"
                        onClick={() => handleChipClick(brandName)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 hover:border-brand hover:text-brand border border-slate-200 transition-colors cursor-pointer"
                      >
                        <span>{brandName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Typo Correction Banner */}
              {data?.isCorrected && data?.correctedQuery && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 mx-1">
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Showing results for <strong className="font-bold underline">{data.correctedQuery}</strong>
                  </span>
                </div>
              )}

              {/* Products List (Crisp, High Contrast Cards) */}
              {products.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Products ({products.length})
                  </div>
                  <div className="flex flex-col gap-2">
                    {products.slice(0, 6).map((product: any) => {
                      const base = Number(product.basePrice) || 0;
                      const special = Number(product.specialPrice) || base;
                      const hasDiscount = special < base;
                      const discountPercent = hasDiscount ? Math.round(((base - special) / base) * 100) : 0;
                      const productThumbnail =
                        product.thumbnail ||
                        product.image ||
                        (Array.isArray(product.images) && product.images.length > 0
                          ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url)
                          : "") ||
                        (product.colorImages && typeof product.colorImages === "object"
                          ? Object.values(product.colorImages)[0]
                          : "");

                      return (
                        <Link
                          key={product.id || product.slug}
                          href={`/${product.slug}`}
                          onClick={handleProductClick}
                          className="flex items-center gap-3.5 p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 hover:border-brand/40 transition-all group"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 p-1 flex items-center justify-center">
                            {productThumbnail ? (
                              <Image
                                src={productThumbnail}
                                alt={product.name}
                                fill
                                sizes="80px"
                                className="object-contain p-1"
                                unoptimized={typeof productThumbnail === "string" && productThumbnail.startsWith("http")}
                              />
                            ) : (
                              <MagnifyingGlassIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 pr-1">
                            {product.brand && (
                              <p className="text-[10px] font-bold text-banner uppercase tracking-wider leading-none mb-1">
                                {product.brand}
                              </p>
                            )}
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-brand line-clamp-2 leading-snug transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-950 font-sans">
                                ₹{special.toLocaleString("en-IN")}
                              </span>
                              {hasDiscount && (
                                <>
                                  <span className="text-[11px] text-slate-400 line-through">
                                    ₹{base.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                    {discountPercent}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Chevron */}
                          <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View All Button */}
              <div className="border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e)}
                  className="w-full text-center text-xs font-bold text-brand hover:text-banner uppercase tracking-wider py-2.5 bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors cursor-pointer"
                >
                  View All Results for "{debouncedQuery}"
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
