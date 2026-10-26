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
  ClockIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";
import { 
  useTrendingSearches, 
  useSearchSuggestions, 
  ScopedSuggestion,
  SearchSuggestProduct 
} from "@/core/hooks/useSearch";

const RECENT_SEARCHES_STORAGE_KEY = "store4riders_recent_searches";

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Recent Searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((item): item is string => typeof item === "string").slice(0, 8));
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t.toLowerCase() !== termToRemove.toLowerCase());
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecent = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {}
  };

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

  const handleSubmit = (
    e?: React.FormEvent, 
    searchQuery?: string,
    categorySlug?: string,
    brandName?: string
  ) => {
    if (e) e.preventDefault();
    const finalQuery = (searchQuery !== undefined ? searchQuery : query).trim();
    if (finalQuery) {
      saveRecentSearch(finalQuery);
      setIsOpen(false);
      if (onClose) onClose();

      const params = new URLSearchParams();
      params.set("q", finalQuery);
      if (categorySlug) params.set("category", categorySlug);
      if (brandName) params.set("brand", brandName);

      router.push(`/search?${params.toString()}`);
    }
  };

  const handleProductClick = (product: any) => {
    saveRecentSearch(debouncedQuery || product.name);
    setIsOpen(false);
    setQuery("");
    if (onClose) onClose();
  };

  const handleChipClick = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    handleSubmit(undefined, term);
  };

  const handleScopedClick = (item: ScopedSuggestion) => {
    handleSubmit(undefined, item.query, item.categorySlug, item.brand);
  };

  const products = data?.products || [];
  const categories = data?.categories || [];
  const brands = data?.brands || [];
  const scopedSuggestions = data?.scopedSuggestions || [];
  const hasResults = products.length > 0 || categories.length > 0 || brands.length > 0 || scopedSuggestions.length > 0;
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
          <form onSubmit={(e) => handleSubmit(e)} className="flex-1 min-w-0">
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
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors ml-1 cursor-pointer"
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
          {/* STATE 1: Empty Query - Show Recent Searches, Dynamic Trending & Top Categories */}
          {debouncedQuery.length < 2 && (
            <div className="space-y-6 pt-1">
              {/* Recent Searches (History) */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-slate-400 stroke-[2]" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] text-slate-400 hover:text-brand font-semibold lowercase cursor-pointer"
                    >
                      clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/80 hover:border-slate-300 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => handleChipClick(term)}
                          className="flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{term}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          aria-label={`Remove ${term}`}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <XMarkIcon className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Trending Searches */}
              {trendingKeywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
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
                        <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
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
            <div className="space-y-4">
              {/* Typo Correction Banner */}
              {data?.isCorrected && data?.correctedQuery && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900">
                  <MagnifyingGlassIcon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Showing results for <strong className="font-bold underline">{data.correctedQuery}</strong> (corrected from "{debouncedQuery}")
                  </span>
                </div>
              )}

              {/* Scoped Intent Suggestions (Flipkart / Amazon style) */}
              {scopedSuggestions.length > 0 && (
                <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/70">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">
                    Quick Suggestions
                  </div>
                  <div className="divide-y divide-slate-200/60">
                    {scopedSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleScopedClick(item)}
                        className="w-full flex items-center justify-between px-2 py-2 text-left hover:bg-white rounded-lg transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 group-hover:text-brand shrink-0" />
                          <span className="text-xs font-medium text-slate-800 group-hover:text-brand truncate">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-200/60 group-hover:bg-brand/10 group-hover:text-brand shrink-0 ml-2">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Categories & Brands Pills */}
              {(categories.length > 0 || brands.length > 0) && (
                <div className="space-y-2">
                  {categories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                        In:
                      </span>
                      {categories.map((cat: any) => (
                        <Link
                          key={cat.id || cat.slug}
                          href={`/${cat.slug}`}
                          onClick={() => saveRecentSearch(cat.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/5 text-brand border border-brand/20 hover:bg-brand/10 transition-colors"
                        >
                          <span>{cat.name}</span>
                          <ChevronRightIcon className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {brands.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                        Brand:
                      </span>
                      {brands.map((brandName: string) => (
                        <button
                          key={brandName}
                          type="button"
                          onClick={() => handleSubmit(undefined, debouncedQuery, undefined, brandName)}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:border-brand hover:text-brand transition-colors cursor-pointer"
                        >
                          <span>{brandName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Matching Products */}
              {products.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Top Products ({products.length})
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
                          : "");

                      return (
                        <Link
                          key={product.id || product.slug}
                          href={`/${product.slug}`}
                          onClick={() => handleProductClick(product)}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand/50 hover:shadow-sm transition-all active:scale-[0.99] group"
                        >
                          {/* Image Box */}
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 p-1 flex items-center justify-center">
                            {productThumbnail ? (
                              <Image
                                src={productThumbnail}
                                alt={product.name}
                                fill
                                sizes="64px"
                                className="object-contain p-1"
                                unoptimized={typeof productThumbnail === "string" && productThumbnail.startsWith("http")}
                              />
                            ) : (
                              <ShoppingBagIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>

                          {/* Info Column */}
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
                              <span className="text-sm font-bold text-slate-950 font-sans">
                                ₹{special.toLocaleString("en-IN")}
                              </span>
                              {hasDiscount && (
                                <>
                                  <span className="text-[11px] text-slate-400 line-through">
                                    ₹{base.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-200/60">
                                    {discountPercent}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right Arrow */}
                          <div className="text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0">
                            <ChevronRightIcon className="w-4 h-4 stroke-[2]" />
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
  // DESKTOP NAVBAR AUTOCOMPLETE VIEW (ENTERPRISE 2-COLUMN DROPDOWN)
  // -------------------------------------------------------------
  return (
    <div 
      className="relative flex items-center group w-32 sm:w-36 md:w-40 lg:w-44 xl:w-56 2xl:w-64" 
      ref={containerRef}
    >
      <form onSubmit={(e) => handleSubmit(e)} className="w-full">
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
              className={`mr-2 p-0.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                isLight ? "text-neutral-400 hover:text-neutral-700 bg-neutral-200/60" : "text-white/60 hover:text-white bg-white/20"
              }`}
              aria-label="Clear search"
            >
              <XMarkIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>

      {/* Desktop Enterprise Autocomplete Dropdown */}
      {showDesktopDropdown && (
        <div className="absolute top-full mt-2.5 right-0 w-[580px] sm:w-[640px] md:w-[700px] lg:w-[760px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 font-sans">
          {debouncedQuery.length < 2 ? (
            /* PRE-QUERY STATE: Recent Searches, Popular Searches, Top Categories */
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] text-slate-400 hover:text-brand font-semibold lowercase cursor-pointer"
                    >
                      clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => handleChipClick(term)}
                          className="flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <ClockIcon className="w-3 h-3 text-slate-400" />
                          <span>{term}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          aria-label={`Remove ${term}`}
                          className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <XMarkIcon className="w-3 h-3 stroke-[2]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Popular Searches */}
              {trendingKeywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <FireIcon className="w-3.5 h-3.5 text-banner" />
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
                        <ArrowTrendingUpIcon className="w-3 h-3 text-slate-400 stroke-[2]" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Quick Categories */}
              {quickCategories.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Top Categories
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${cat.slug}`}
                        onClick={() => {
                          saveRecentSearch(cat.name);
                          setIsOpen(false);
                        }}
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
            /* LOADING STATE */
            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-500">
              <div className="w-7 h-7 border-3 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Searching Store4Riders catalog...</p>
            </div>
          ) : !hasResults ? (
            /* EMPTY STATE */
            <div className="py-10 px-4 text-center">
              <p className="text-sm font-semibold text-slate-800">
                No results found for "{debouncedQuery}"
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for 'Helmets', 'Jackets', 'Axor', or 'Rynox'
              </p>
            </div>
          ) : (
            /* ENTERPRISE 2-COLUMN RESULTS LAYOUT (Flipkart / Amazon style) */
            <div className="flex flex-col">
              <div className="grid grid-cols-12 min-h-[320px] max-h-[480px]">
                {/* Left Column: Scoped Suggestions, Typo Banner, Categories, Brands */}
                <div className="col-span-5 p-4 border-r border-slate-100 space-y-3.5 overflow-y-auto">
                  {/* Typo Correction Banner */}
                  {data?.isCorrected && data?.correctedQuery && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 leading-tight">
                      <MagnifyingGlassIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Showing results for <strong className="font-bold underline">{data.correctedQuery}</strong>
                      </span>
                    </div>
                  )}

                  {/* Scoped Intent Suggestions */}
                  {scopedSuggestions.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Suggested Searches
                      </div>
                      <div className="space-y-1">
                        {scopedSuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleScopedClick(item)}
                            className="w-full flex items-center justify-between p-1.5 rounded-lg text-left hover:bg-slate-100 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand shrink-0" />
                              <span className="text-xs font-medium text-slate-800 group-hover:text-brand truncate">
                                {item.label}
                              </span>
                            </div>
                            <ChevronRightIcon className="w-3 h-3 text-slate-300 group-hover:text-brand shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Categories */}
                  {categories.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Categories
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {categories.slice(0, 4).map((cat: any) => (
                          <Link
                            key={cat.id || cat.slug}
                            href={`/${cat.slug}`}
                            onClick={() => {
                              saveRecentSearch(cat.name);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 hover:bg-brand/10 hover:text-brand border border-slate-200/80 transition-colors"
                          >
                            <span>{cat.name}</span>
                            <ChevronRightIcon className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Brands */}
                  {brands.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Brands
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {brands.map((brandName: string) => (
                          <button
                            key={brandName}
                            type="button"
                            onClick={() => handleSubmit(undefined, debouncedQuery, undefined, brandName)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 hover:border-brand hover:text-brand border border-slate-200/80 transition-colors cursor-pointer"
                          >
                            <span>{brandName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Top Products Cards */}
                <div className="col-span-7 p-4 bg-slate-50/40 space-y-2 overflow-y-auto">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Top Products ({products.length})
                  </div>
                  <div className="space-y-2">
                    {products.slice(0, 5).map((product: any) => {
                      const base = Number(product.basePrice) || 0;
                      const special = Number(product.specialPrice) || base;
                      const hasDiscount = special < base;
                      const discountPercent = hasDiscount ? Math.round(((base - special) / base) * 100) : 0;
                      const productThumbnail =
                        product.thumbnail ||
                        product.image ||
                        (Array.isArray(product.images) && product.images.length > 0
                          ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url)
                          : "");

                      return (
                        <Link
                          key={product.id || product.slug}
                          href={`/${product.slug}`}
                          onClick={() => handleProductClick(product)}
                          className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 hover:border-brand/40 hover:shadow-xs transition-all group"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shrink-0 p-1 flex items-center justify-center">
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
                              <ShoppingBagIcon className="w-5 h-5 text-slate-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-1">
                            {product.brand && (
                              <p className="text-[9px] font-bold text-banner uppercase tracking-wider leading-none mb-0.5">
                                {product.brand}
                              </p>
                            )}
                            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-brand line-clamp-1 leading-snug transition-colors">
                              {product.name}
                            </h4>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-xs font-bold text-slate-950 font-sans">
                                ₹{special.toLocaleString("en-IN")}
                              </span>
                              {hasDiscount && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  ₹{base.toLocaleString("en-IN")}
                                </span>
                              )}
                              {hasDiscount && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand transition-colors shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom "View All" CTA Bar */}
              <div className="p-2.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e)}
                  className="w-full text-center py-2 px-4 rounded-xl bg-brand hover:bg-brand/95 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View All Results for "{debouncedQuery}"</span>
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
