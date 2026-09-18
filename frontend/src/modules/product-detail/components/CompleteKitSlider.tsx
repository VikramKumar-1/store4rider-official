"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { KitProduct } from "../types/product-detail.types";

export const CompleteKitSlider: React.FC<{ products: KitProduct[] }> = ({ products }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 180;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full relative rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50/90 via-white/85 to-orange-50/20 backdrop-blur-xl p-4 sm:p-5 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] overflow-hidden group/kit">
      {/* Subtle decorative ambient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with badge */}
      <div className="flex items-center justify-between mb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-5 bg-brand rounded-full shrink-0" />
          <div>
            <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-neutral-900 leading-tight">
              Complete Your Kit
            </h3>
            <span className="text-[10px] text-neutral-400 font-medium block">
              Frequently paired by riders
            </span>
          </div>
        </div>

        {/* Scroll Arrows on Desktop */}
        {products.length > 2 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleScroll("left")}
              className="w-7 h-7 rounded-full bg-white/90 border border-neutral-200/80 shadow-2xs flex items-center justify-center text-neutral-600 hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
              aria-label="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="w-7 h-7 rounded-full bg-white/90 border border-neutral-200/80 shadow-2xs flex items-center justify-center text-neutral-600 hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
              aria-label="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Products Slider Row */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-none py-1 snap-x snap-mandatory relative z-10"
      >
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={product.productUrl}
            className="group shrink-0 w-[135px] sm:w-[150px] snap-start flex flex-col bg-white/95 rounded-xl border border-neutral-200/80 p-2.5 shadow-2xs hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5 transition-all duration-300"
          >
            {/* Image Container */}
            <div className="relative aspect-square w-full bg-neutral-50/80 rounded-lg overflow-hidden mb-2 border border-neutral-100">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-2 group-hover:scale-105 transition-transform duration-300 ease-out"
                sizes="(max-width: 768px) 135px, 150px"
              />
            </div>

            {/* Typography Details */}
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  {product.category}
                </span>
                <h4 className="text-xs font-bold text-neutral-900 font-sans line-clamp-2 leading-snug group-hover:text-brand transition-colors mt-0.5">
                  {product.name}
                </h4>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-neutral-100">
                <span className="text-xs font-extrabold text-brand font-sans">
                  {product.priceFormatted}
                </span>
                <span className="w-5 h-5 rounded-full bg-neutral-100 group-hover:bg-brand group-hover:text-white text-neutral-400 flex items-center justify-center text-xs font-bold transition-colors">
                  +
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
