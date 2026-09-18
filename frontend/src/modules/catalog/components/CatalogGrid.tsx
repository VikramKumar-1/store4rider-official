"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CatalogProductCard } from "./CatalogProductCard";
import { CatalogProduct } from "../types/catalog.types";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface CatalogGridProps {
  products: CatalogProduct[];
  totalCount?: number;
  isLoading?: boolean;
  isFetching?: boolean;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ 
  products, 
  totalCount = 0,
  isLoading = false,
  isFetching = false
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 12; // Strictly matching the backend API limit
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", newPage.toString());
    router.push(`/products?${current.toString()}`, { scroll: false });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);
  const progressPercent = totalCount === 0 ? 0 : Math.min(100, Math.round((endItem / totalCount) * 100));

  const getPaginationRange = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const paginationRange = getPaginationRange();

  return (
    <div className="flex flex-col w-full">
      
      {/* 3-Column Product Grid or Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="aspect-[3/4] bg-neutral-100 rounded-sm" />
              <div className="h-3 w-20 bg-neutral-100 rounded" />
              <div className="h-5 w-3/4 bg-neutral-100 rounded" />
              <div className="h-3 w-16 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 transition-opacity duration-200 ${
            isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
          }`}
        >
          {products.map((product) => (
            <CatalogProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Modern Luxury Pagination Container */}
      {totalPages > 1 && (
        <div className="mt-14 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-5 select-none">
          
          {/* Left: Progress info & item count */}
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <p className="text-xs text-neutral-500 font-medium">
              Showing <span className="font-bold text-neutral-900">{startItem}</span>–<span className="font-bold text-neutral-900">{endItem}</span> of <span className="font-bold text-neutral-900">{totalCount.toLocaleString()}</span> products
            </p>
            {/* Subtle Progress Track */}
            <div className="w-40 h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-banner transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Center / Right: Numbered pagination controls */}
          <nav aria-label="Catalog pagination" className="flex items-center gap-1.5 flex-wrap justify-center">
            
            {/* First Page button if far */}
            {currentPage > 4 && totalPages > 7 && (
              <button
                onClick={() => handlePageChange(1)}
                aria-label="First page"
                title="First Page"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer border border-neutral-200/60"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            )}

            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-banner hover:bg-neutral-50 border border-neutral-200 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Numbered Pills */}
            <div className="flex items-center gap-1">
              {paginationRange.map((page, idx) => {
                if (page === "...") {
                  return (
                    <span 
                      key={`ellipsis-${idx}`} 
                      className="w-8 h-9 flex items-center justify-center text-xs font-bold text-neutral-400 select-none"
                    >
                      …
                    </span>
                  );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    aria-current={isActive ? "page" : undefined}
                    className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-sm scale-105"
                        : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 border border-transparent"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-banner hover:bg-neutral-50 border border-neutral-200 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page button if far */}
            {currentPage < totalPages - 3 && totalPages > 7 && (
              <button
                onClick={() => handlePageChange(totalPages)}
                aria-label="Last page"
                title="Last Page"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer border border-neutral-200/60"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            )}

          </nav>

        </div>
      )}
      
      {!isLoading && products.length === 0 && (
        <div className="w-full py-20 flex flex-col items-center justify-center text-neutral-400">
          <p className="text-lg mb-2">No products found matching your criteria.</p>
          <button onClick={() => router.push('/products', { scroll: false })} className="text-banner hover:underline text-sm font-bold tracking-wider cursor-pointer">
            CLEAR FILTERS
          </button>
        </div>
      )}
      
    </div>
  );
};
