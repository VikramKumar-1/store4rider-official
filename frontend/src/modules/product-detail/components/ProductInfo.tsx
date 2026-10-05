"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { StarIcon } from "@heroicons/react/24/solid";
import { ColorOption } from "../types/product-detail.types";

interface ProductInfoProps {
  id: string;
  category: string;
  rating: number;
  name: string;
  originalPriceFormatted?: string;
  discountBadge?: string;
  priceFormatted: string;
  shortDescription: string;
  colors?: ColorOption[];
  sizes?: string[];
  selectedColor?: string;
  selectedSize?: string;
  disabledColors?: string[];
  disabledSizes?: string[];
  sizeChart?: string;
  isFreeShipping?: boolean;
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
}

import { toast } from "sonner";
import { apiClient } from "@/core/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useWishlist } from "@/core/hooks/useWishlist";

export const ProductInfo: React.FC<ProductInfoProps> = ({
  id,
  category,
  rating,
  name,
  originalPriceFormatted,
  discountBadge,
  priceFormatted,
  shortDescription,
  colors,
  sizes,
  selectedColor,
  selectedSize,
  disabledColors = [],
  disabledSizes = [],
  sizeChart,
  isFreeShipping = false,
  onColorChange,
  onSizeChange,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const descRef = React.useRef<HTMLParagraphElement>(null);
  const queryClient = useQueryClient();
  const { data: wishlistIds = [] } = useWishlist();

  React.useEffect(() => {
    setIsWishlisted(wishlistIds.includes(id));
  }, [wishlistIds, id]);

  React.useEffect(() => {
    if (descRef.current) {
      if (descRef.current.scrollHeight > descRef.current.clientHeight) {
        setShowReadMore(true);
      }
    }
  }, [shortDescription]);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        {/* Header: Rating Only */}
        <div className="flex items-center justify-end">
          {rating > 0 ? (
            <div className="flex items-center gap-1 bg-yellow-100/50 px-1.5 py-0.5 rounded-sm">
              <StarIcon className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="text-[11px] font-bold text-neutral-700">{rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-brand transition-colors group">
              <StarIcon className="w-3 h-3 text-neutral-300 group-hover:text-amber-400 transition-colors" />
              <span>Be the first to review</span>
            </div>
          )}
        </div>

        {/* Title (Max 3 lines, shows full on hover) */}
        <h1
          title={name}
          className="font-sans font-extrabold text-lg md:text-2xl uppercase tracking-tight text-neutral-900 leading-tight line-clamp-3 cursor-help"
        >
          {name}
        </h1>

        {/* Pricing (Side by Side) */}
        <div className="flex items-center justify-between w-full mt-0.5">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-extrabold text-brand text-xl">
              {priceFormatted}
            </span>
            {originalPriceFormatted && discountBadge && (
              <>
                <span className="text-neutral-400 line-through text-sm font-medium">
                  {originalPriceFormatted}
                </span>
                <span className="bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm relative -top-0.5">
                  {discountBadge} OFF
                </span>
              </>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              const prev = isWishlisted;
              setIsWishlisted(!prev);

              apiClient.post("/wishlist/toggle", { productId: id })
                .then((res) => {
                  queryClient.invalidateQueries({ queryKey: ["wishlist_ids"] });
                  queryClient.invalidateQueries({ queryKey: ["wishlist"] });
                  if (res.data?.data?.added || !prev) {
                    toast.success("Saved to wishlist!");
                  } else {
                    toast.error("Removed from wishlist");
                  }
                })
                .catch((err) => {
                  setIsWishlisted(prev); // revert on error
                  if (err.response?.status === 401) {
                    toast.error("Please login to save to wishlist");
                  } else {
                    toast.error("Failed to update wishlist");
                  }
                });
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-95 border ${isWishlisted
                ? "text-red-500 bg-red-50 border-red-200 shadow-sm"
                : "text-neutral-400 bg-neutral-50 border-neutral-200 hover:text-brand hover:bg-red-50 hover:border-red-200"
              }`}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={isWishlisted ? 0 : 2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        {/* Trust Badges - Modern Tactile Clay Cards (MOBILE ONLY) */}
        <div className={`grid md:hidden ${isFreeShipping ? 'grid-cols-4 gap-1.5 sm:gap-2.5' : 'grid-cols-3 gap-2 sm:gap-3.5'} w-full my-2.5`}>
          {/* 1. COD & EMI available */}
          <div className="flex flex-col items-center justify-center text-center p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-neutral-50/90 to-neutral-100/70 border border-neutral-200/70 shadow-[0_2px_4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-xs hover:border-orange-200 transition-all group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 border border-orange-100/80 flex items-center justify-center shadow-2xs mb-1.5 shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-orange-500 shrink-0">
                <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
                <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-neutral-800 leading-tight">
              COD & EMI Available
            </span>
          </div>

          {/* 2. 100% genuine products */}
          <div className="flex flex-col items-center justify-center text-center p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-neutral-50/90 to-neutral-100/70 border border-neutral-200/70 shadow-[0_2px_4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-xs hover:border-blue-200 transition-all group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center shadow-2xs mb-1.5 shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 shrink-0">
                <path d="m23 12-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
            </div>
            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-neutral-800 leading-tight">
              100% Genuine
            </span>
          </div>

          {/* 3. Easy Exchange */}
          <div className="flex flex-col items-center justify-center text-center p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-neutral-50/90 to-neutral-100/70 border border-neutral-200/70 shadow-[0_2px_4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-xs hover:border-purple-200 transition-all group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center shadow-2xs mb-1.5 shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600 shrink-0">
                <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-neutral-800 leading-tight">
              Easy Exchange
            </span>
          </div>

          {/* 4. Free shipping */}
          {isFreeShipping && (
            <div className="flex flex-col items-center justify-center text-center p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-neutral-50/90 to-neutral-100/70 border border-neutral-200/70 shadow-[0_2px_4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-xs hover:border-emerald-200 transition-all group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shadow-2xs mb-1.5 shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 256 256" fill="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 shrink-0">
                  <path d="M244.8,111.37l-25-35.75A15.91,15.91,0,0,0,206.67,69.5H176V56a16,16,0,0,0-16-16H24A16,16,0,0,0,8,56V184a16,16,0,0,0,16,16H42.79a32,32,0,1,0,58.42,0h53.58a32,32,0,1,0,58.42,0H232a16,16,0,0,0,16-16V117.8A16,16,0,0,0,244.8,111.37ZM72,216a16,16,0,1,1,16-16A16,16,0,0,1,72,216Zm112,0a16,16,0,1,1,16-16A16,16,0,0,1,184,216Zm48-32H213.21a32,32,0,1,0-58.42,0H176V85.5h30.67l25.33,36.19Z" />
                </svg>
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-bold text-neutral-800 leading-tight">
                Free Shipping
              </span>
            </div>
          )}
        </div>

        {/* Trust Badges - Clean Horizontal List (DESKTOP ONLY) */}
        <div className="hidden md:flex flex-wrap items-center gap-5 w-full my-4">
          {/* 1. 100% genuine products */}
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] text-blue-600 shrink-0">
              <path d="m23 12-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span className="text-[13px] font-bold text-[#374151]">
              100% Genuine
            </span>
          </div>

          {/* 2. EMI available */}
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] text-orange-500 shrink-0">
              <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
              <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
            </svg>
            <span className="text-[13px] font-bold text-[#374151]">
              EMI available
            </span>
          </div>

          {/* 3. Easy exchange */}
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] text-purple-600 shrink-0">
              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
            </svg>
            <span className="text-[13px] font-bold text-[#374151]">
              Easy exchange
            </span>
          </div>

          {/* 4. Free shipping */}
          {isFreeShipping && (
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 256 256" fill="currentColor" className="w-[18px] h-[18px] text-emerald-600 shrink-0">
                <path d="M244.8,111.37l-25-35.75A15.91,15.91,0,0,0,206.67,69.5H176V56a16,16,0,0,0-16-16H24A16,16,0,0,0,8,56V184a16,16,0,0,0,16,16H42.79a32,32,0,1,0,58.42,0h53.58a32,32,0,1,0,58.42,0H232a16,16,0,0,0,16-16V117.8A16,16,0,0,0,244.8,111.37ZM72,216a16,16,0,1,1,16-16A16,16,0,0,1,72,216Zm112,0a16,16,0,1,1,16-16A16,16,0,0,1,184,216Zm48-32H213.21a32,32,0,1,0-58.42,0H176V85.5h30.67l25.33,36.19Z" />
              </svg>
              <span className="text-[13px] font-bold text-[#374151]">
                Free shipping
              </span>
            </div>
          )}
        </div>

        {/* Short Description (Collapsible) */}
        {shortDescription && (
          <div className="mt-2 relative">
            <p
              ref={descRef}
              className={`text-neutral-500 text-xs md:text-sm leading-relaxed font-sans ${isDescExpanded ? "" : "line-clamp-3"}`}
            >
              {shortDescription}
            </p>
            {showReadMore && (
              <div className="flex justify-center w-full mt-1.5">
                <button
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-[11px] font-extrabold text-[#ab1509] hover:text-[#8a1107] uppercase tracking-wider hover:underline transition-all flex items-center gap-1 py-0.5 px-2"
                >
                  {isDescExpanded ? "READ LESS" : "READ MORE"}
                </button>
              </div>
            )}
          </div>
        )}



      </div>

      {/* Size Chart Modal */}
      {showSizeChart && sizeChart && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative flex flex-col max-h-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50 shrink-0">
              <h3 className="font-extrabold text-lg uppercase tracking-wide text-neutral-900">Size Guide</h3>
              <button onClick={() => setShowSizeChart(false)} className="text-neutral-400 hover:text-red-500 p-1 hover:scale-110 active:scale-90 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 pb-12 overflow-y-auto min-h-0">
              {sizeChart.includes('<') ? (
                <div
                  className="w-full text-[10px] sm:text-sm text-neutral-800 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-neutral-300 [&_th]:p-1.5 sm:[&_th]:p-3 [&_th]:bg-neutral-100 [&_th]:whitespace-nowrap [&_td]:border [&_td]:border-neutral-300 [&_td]:p-1.5 sm:[&_td]:p-3 [&_td]:text-center [&_img]:w-full [&_img]:max-h-[60vh] [&_img]:object-contain [&_img]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: sizeChart.replace(/""/g, '"') }}
                />
              ) : (
                <img src={sizeChart} alt="Size Chart" className="w-full max-h-[60vh] object-contain rounded-md mx-auto" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
