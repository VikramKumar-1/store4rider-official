"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/core/api/client";

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

  // Debounce the query for API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch suggestions
  const { data, isLoading } = useQuery({
    queryKey: ["search-suggest", debouncedQuery],
    queryFn: async () => {
      const res = await apiClient.get(`/search/suggest?q=${encodeURIComponent(debouncedQuery)}`);
      return res.data.data;
    },
    enabled: debouncedQuery.length > 1,
    staleTime: 60000,
  });

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      if (onClose) onClose();
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleProductClick = () => {
    setIsOpen(false);
    setQuery("");
    if (onClose) onClose();
  };

  const products = data?.products || [];
  const categories = data?.categories || [];
  const hasResults = products.length > 0 || categories.length > 0;
  const showDropdown = isOpen && (debouncedQuery.length > 1);

  return (
    <div className={`relative flex items-center group ${isMobileFull ? "w-full" : ""}`} ref={containerRef}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className={`relative flex items-center rounded-full transition-all duration-300 w-full ${
          isMobileFull
            ? "bg-white/90 backdrop-blur-md border border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-1 px-1 sm:py-0 animate-in fade-in zoom-in-[0.98] duration-200"
            : isLight
            ? "sm:w-48 md:w-60 lg:w-72 border bg-neutral-100/90 border-neutral-200/90 shadow-xs focus-within:bg-white focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/5 sm:focus-within:w-64 lg:focus-within:w-80"
            : "sm:w-48 md:w-60 lg:w-72 border bg-black/40 backdrop-blur-xl border-white/25 shadow-md focus-within:bg-black/65 focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20 sm:focus-within:w-64 lg:focus-within:w-80"
        }`}>
          
          {/* Search Icon on the LEFT (Brand orange / neutral) */}
          <div className="pl-3.5 pr-1.5 pointer-events-none flex items-center">
            <MagnifyingGlassIcon className={`w-4 h-4 shrink-0 transition-colors ${
              isMobileFull
                ? "text-banner stroke-[2.25]"
                : isLight
                ? "text-neutral-400 group-focus-within:text-banner stroke-[2]"
                : "text-white/60 group-focus-within:text-banner stroke-[2]"
            }`} />
          </div>

          <input
            type="text"
            placeholder="Search our store"
            value={query}
            autoFocus={isMobileFull}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className={`w-full bg-transparent text-xs sm:text-[13px] py-2 pl-1 pr-2 focus:outline-none font-medium transition-colors [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden ${
              isMobileFull
                ? "text-neutral-900 placeholder:text-neutral-400 font-sans"
                : isLight 
                ? "text-neutral-900 placeholder:text-neutral-400" 
                : "text-white placeholder:text-white/60"
            }`}
          />

          {/* Close/Cut X on mobile (Brand styled, tactile rotation + scale feedback) */}
          {isMobileFull && onClose ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                onClose();
              }}
              className="p-1.5 mr-1 rounded-full hover:bg-neutral-100/80 text-neutral-500 hover:text-banner transition-all duration-200 active:scale-90 hover:rotate-90 cursor-pointer flex items-center justify-center"
              aria-label="Close search"
            >
              <XMarkIcon className="w-5 h-5 stroke-[2]" />
            </button>
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className={`hidden sm:flex mr-2 p-0.5 rounded-full transition-colors items-center justify-center ${
                isLight ? "text-neutral-400 hover:text-neutral-700 bg-neutral-200/60" : "text-white/60 hover:text-white bg-white/20"
              }`}
              aria-label="Clear search"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <span className={`hidden lg:inline-flex mr-2.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 select-none ${
              isLight ? "bg-neutral-200/70 text-neutral-500" : "bg-white/15 text-white/70"
            }`}>
              ⌘K
            </span>
          )}
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div className={`absolute top-full right-0 mt-2 w-full sm:w-[400px] lg:w-[500px] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
          isMobileFull || isLight
            ? "bg-white/95 backdrop-blur-xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.12)]" 
            : "bg-neutral-900/90 backdrop-blur-xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
        }`}>
          {isLoading ? (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-banner border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !hasResults ? (
            <div className={`py-5 px-4 text-center text-[13px] ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
              No results found for "{debouncedQuery}"
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto overscroll-contain p-2 space-y-2">
              {/* Categories Section */}
              {categories.length > 0 && (
                <div className={`border-b pb-2 ${isLight ? "border-neutral-200/60" : "border-white/10"}`}>
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1 px-1">
                    {categories.slice(0, 3).map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.slug}`}
                        onClick={handleProductClick}
                        className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full border transition-all ${
                          isLight 
                            ? "border-neutral-200 text-neutral-700 bg-white/80 hover:border-banner hover:text-banner" 
                            : "border-white/15 text-neutral-200 bg-white/5 hover:border-banner hover:text-banner"
                        }`}
                      >
                        <span className="font-medium">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {products.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Products
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {products.slice(0, 5).map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={handleProductClick}
                        className={`flex items-center gap-3 p-2 rounded-lg border transition-all group ${
                          isLight 
                            ? "bg-white/70 border-neutral-200/80 hover:border-banner/60 hover:bg-white hover:shadow-xs" 
                            : "bg-white/[0.03] border-white/10 hover:border-banner/60 hover:bg-white/[0.08]"
                        }`}
                      >
                        <div className={`relative w-12 h-12 rounded-md overflow-hidden shrink-0 border ${
                          isLight ? "bg-neutral-50 border-neutral-100" : "bg-neutral-800 border-white/10"
                        }`}>
                          {product.thumbnail ? (
                            <Image
                              src={product.thumbnail}
                              alt={product.name}
                              fill
                              className="object-cover mix-blend-multiply"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <MagnifyingGlassIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                            isLight ? "text-neutral-800 group-hover:text-banner" : "text-neutral-100 group-hover:text-banner"
                          }`}>
                            {product.name}
                          </p>
                          <p className={`text-[11px] truncate ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                            {product.brand} • {product.categoryId}
                          </p>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <p className={`text-xs sm:text-sm font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
                            ₹{product.specialPrice || product.basePrice}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Button */}
              <div className={`border-t p-2 ${isLight ? "border-neutral-200/50 bg-neutral-900/5" : "border-white/10 bg-white/5"}`}>
                <button
                  onClick={handleSubmit}
                  className="w-full text-center text-xs font-bold text-banner hover:text-orange-600 uppercase tracking-wider py-2"
                >
                  View All Results
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
