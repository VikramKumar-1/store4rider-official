"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 12; // Strictly matching the backend API limit
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", newPage.toString());
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
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
      
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="aspect-[3/4] bg-neutral-100 rounded-lg" />
              <div className="h-3 w-20 bg-neutral-100 rounded" />
              <div className="h-4 w-3/4 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 md:gap-8 transition-opacity duration-200 ${
            isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
          }`}
        >
          {products.map((product) => (
            <CatalogProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Modern Minimalist Pagination Container */}
      {totalPages > 1 && (
        <div className="mt-8 pt-6 sm:mt-10 border-t border-neutral-100 flex flex-col items-center justify-center gap-6 select-none">
          
          {/* Top: Progress info & item count */}
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-[13px] text-neutral-500">
              Showing <span className="font-bold text-neutral-900">{startItem}-{endItem}</span> of <span className="font-bold text-neutral-900">{totalCount.toLocaleString()}</span> products
            </p>
            {/* Subtle Progress Track */}
            <div className="w-48 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#FF5429] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Center: Numbered pagination controls */}
          <nav aria-label="Catalog pagination" className="flex flex-col items-center gap-4">
            
            <div className="flex items-center justify-center gap-1.5 sm:gap-4">
              {/* Numbered Pills */}
              {paginationRange.map((page, idx) => {
                if (page === "...") {
                  return (
                    <span 
                      key={`ellipsis-${idx}`} 
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-bold text-neutral-400 select-none"
                    >
                      ...
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
                    className={`w-8 h-8 rounded-lg text-[13px] sm:w-10 sm:h-10 sm:rounded-xl sm:text-[15px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? "bg-neutral-900 text-white shadow-md"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
              {/* Previous Button */}
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg sm:rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:text-neutral-900 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Next Button */}
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg sm:rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:text-neutral-900 transition-all cursor-pointer shadow-xs"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
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
