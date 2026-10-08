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
        <a
          href="https://www.google.com/maps/search/?api=1&query=Store4Riders"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto w-full bg-white border-t border-neutral-200 py-2.5 px-4 flex items-center justify-between active:bg-neutral-50 transition-colors shadow-[0_-4px_15px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-2.5">
            {/* Google "G" Logo */}
            <div className="w-[28px] h-[28px] rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-900 font-black text-[13px] leading-none tracking-tight mt-px">{averageRating}</span>
                {/* 4.5 Stars */}
                <div className="flex gap-[1px] text-[#FBBC05]">
                   <svg className="w-[11px] h-[11px]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                   <svg className="w-[11px] h-[11px]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                   <svg className="w-[11px] h-[11px]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                   <svg className="w-[11px] h-[11px]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                   <svg className="w-[11px] h-[11px]" viewBox="0 0 20 20" fill="url(#halfStarMobile)"><defs><linearGradient id="halfStarMobile"><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="#e5e7eb"/></linearGradient></defs><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </div>
              </div>
              <span className="text-neutral-500 font-medium text-[10px] tracking-wide mt-0.5">Based on {reviewCount} reviews</span>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 text-[#4285F4] font-bold text-[11px] uppercase tracking-wider group">
            See all reviews
            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform stroke-[2.5] mb-px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>

        {/* 2. CATEGORY FILTER FLOATING BUTTON (Bottom) */}
        <button
          type="button"
          onClick={() => setIsFilterDrawerOpen(true)}
          className="pointer-events-auto w-full bg-neutral-950 text-white font-black text-[13px] uppercase tracking-wider py-4 px-5 flex items-center justify-between border-t border-neutral-800 active:bg-neutral-900 transition-all cursor-pointer rounded-none pb-safe"
        >
          <div className="flex items-center gap-2.5">
            <FunnelIcon className="w-5 h-5 text-[#FF5429] stroke-[2.5]" />
            <span>CATEGORY FILTER</span>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="bg-[#FF5429] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <span className="text-neutral-400 text-[12px] font-bold font-sans">
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
