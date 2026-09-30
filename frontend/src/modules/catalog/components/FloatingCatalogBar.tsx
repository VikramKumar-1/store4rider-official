"use client";

import React, { useState, useEffect } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SidebarFilters } from "./SidebarFilters";
import { useSearchParams } from "next/navigation";

interface FloatingCatalogBarProps {
  totalCount?: number;
  reviewCount?: string | number;
  averageRating?: number;
}

export const FloatingCatalogBar: React.FC<FloatingCatalogBarProps> = ({
  totalCount,
  reviewCount = "800+",
  averageRating = 4.8,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const searchParams = useSearchParams();

  // Count active filters from URL
  const activeFiltersCount = Array.from(searchParams.entries()).filter(
    ([k]) => !["sort", "page"].includes(k)
  ).length;

  // Prevent background scroll when mobile filter drawer is open
  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterDrawerOpen]);

  return (
    <>
      {/* FLOATING STACKED CONTAINER (Mobile Only) */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden flex flex-col pointer-events-none shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        
        {/* 1. REVIEWS FLOATING BUTTON (Top) */}
        <button
          type="button"
          onClick={() => {
            // Scroll to reviews or open modal logic here
          }}
          className="pointer-events-auto w-full bg-white/95 backdrop-blur-md border-t-2 border-[#FF5429] text-neutral-900 font-extrabold text-xs uppercase tracking-wider py-2.5 px-4 flex items-center justify-center gap-1.5 active:bg-neutral-50 transition-all cursor-pointer rounded-none shadow-sm"
        >
          <span>REVIEWS-{reviewCount} : {averageRating}</span>
          <StarIcon className="w-4 h-4 text-[#FF5429] mb-0.5" />
        </button>

        {/* 2. CATEGORY FILTER FLOATING BUTTON (Bottom) */}
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="pointer-events-auto w-full bg-neutral-950 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-5 flex items-center justify-between border-t border-neutral-800 active:bg-neutral-900 transition-all cursor-pointer rounded-none"
        >
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-[#FF5429] stroke-[2.5]" />
            <span>CATEGORY FILTER</span>
          </div>

          <div className="flex items-center gap-1.5">
            {activeFiltersCount > 0 && (
              <span className="bg-[#FF5429] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <span className="text-neutral-400 text-[11px] font-sans">
              {totalCount ? `(${totalCount})` : "FILTERS"}
            </span>
          </div>
        </button>
      </div>

      {/* 3. MOBILE FILTER DRAWER (Slides up from bottom when bar is clicked) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 pointer-events-auto"
          />

          {/* Drawer Sheet */}
          <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pointer-events-auto">
            {/* Drawer Header */}
            <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-[#FF5429]" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-neutral-900">
                  Filter & Sort Products
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors"
                aria-label="Close filters"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Drawer Body with Filters */}
            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
              <SidebarFilters />
            </div>

            {/* Drawer Footer Action */}
            <div className="p-4 border-t border-neutral-100 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full bg-[#FF5429] hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-full transition-colors active:scale-95"
              >
                Apply Filters {totalCount ? `(${totalCount} Products)` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCatalogBar;
