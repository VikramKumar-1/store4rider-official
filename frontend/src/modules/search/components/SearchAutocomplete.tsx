"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/core/api/client";

interface SearchAutocompleteProps {
  isLight: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ isLight }) => {
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
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleProductClick = () => {
    setIsOpen(false);
    setQuery("");
  };

  const products = data?.products || [];
  const categories = data?.categories || [];
  const hasResults = products.length > 0 || categories.length > 0;
  const showDropdown = isOpen && (debouncedQuery.length > 1);

  return (
    <div className="relative hidden sm:flex items-center group" ref={containerRef}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className={`relative flex items-center rounded-full transition-all duration-300 w-48 md:w-60 lg:w-72 border ${
          isLight
            ? "bg-neutral-100/90 border-neutral-200/90 shadow-xs focus-within:bg-white focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/5 focus-within:w-64 lg:focus-within:w-80"
            : "bg-black/40 backdrop-blur-xl border-white/25 shadow-md focus-within:bg-black/65 focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20 focus-within:w-64 lg:focus-within:w-80"
        }`}>
          
          <input
            type="text"
            placeholder="Search helmets, gear, boots..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className={`w-full bg-transparent text-xs sm:text-[13px] py-2 pl-4 pr-2 focus:outline-none font-medium transition-colors ${
              isLight 
                ? "text-neutral-900 placeholder:text-neutral-400" 
                : "text-white placeholder:text-white/60"
            }`}
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className={`p-0.5 rounded-full transition-colors ${
                isLight ? "text-neutral-400 hover:text-neutral-700 bg-neutral-200/60" : "text-white/60 hover:text-white bg-white/20"
              }`}
              aria-label="Clear search"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <span className={`hidden lg:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 select-none ${
              isLight ? "bg-neutral-200/70 text-neutral-500" : "bg-white/15 text-white/70"
            }`}>
              ↵
            </span>
          )}

          <button 
            type="submit"
            className="mr-2 ml-1 p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors"
            aria-label="Submit search"
          >
            <MagnifyingGlassIcon className={`w-4 h-4 shrink-0 transition-colors ${
              isLight ? "text-neutral-400 group-focus-within:text-neutral-900" : "text-white/60 group-focus-within:text-white"
            } stroke-[2]`} />
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-banner border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-sm text-neutral-500">
              No results found for "{debouncedQuery}"
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto overscroll-contain">
              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="border-b border-neutral-100 p-2">
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Categories
                  </div>
                  {categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      onClick={handleProductClick}
                      className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-banner rounded-md transition-colors"
                    >
                      <span className="font-semibold">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Products Section */}
              {products.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Products
                  </div>
                  <div className="flex flex-col gap-1">
                    {products.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={handleProductClick}
                        className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors group"
                      >
                        <div className="relative w-12 h-12 bg-neutral-100 rounded overflow-hidden shrink-0">
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
                          <p className="text-sm font-semibold text-neutral-800 truncate group-hover:text-banner transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {product.brand} • {product.categoryId}
                          </p>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <p className="text-sm font-bold text-neutral-900">
                            ₹{product.specialPrice || product.basePrice}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Button */}
              <div className="border-t border-neutral-100 p-2 bg-neutral-50">
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
