"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { KitProduct } from "../types/product-detail.types";

const KitImage = ({ src, alt }: { src: string, alt: string }) => {
  const [error, setError] = React.useState(false);
  
  return (
    <Image
      src={error ? "/no-image.svg" : src}
      alt={alt}
      fill
      unoptimized
      className={`object-contain mix-blend-multiply ${error ? 'opacity-50' : ''}`}
      sizes="(max-width: 768px) 115px, 125px"
      onError={() => setError(true)}
    />
  );
};

export const CompleteKitSlider: React.FC<{ products: KitProduct[] }> = ({ products }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 140;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="w-full relative rounded-xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50/90 via-white/85 to-orange-50/20 backdrop-blur-xl p-3 sm:p-3.5 shadow-2xs overflow-hidden group/kit">
      {/* Subtle decorative ambient glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-400/10 rounded-full blur-xl pointer-events-none" />

      {/* Header with badge */}
      <div className="flex items-center justify-between mb-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand rounded-full shrink-0" />
          <div>
            <h3 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-900 leading-tight">
              Complete Your Kit
            </h3>
          </div>
        </div>

        {/* Scroll Arrows on Desktop */}
        {products.length > 2 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleScroll("left")}
              className="w-6 h-6 rounded-full bg-white/90 border border-neutral-200/80 shadow-2xs flex items-center justify-center text-neutral-600 hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
              aria-label="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="w-6 h-6 rounded-full bg-white/90 border border-neutral-200/80 shadow-2xs flex items-center justify-center text-neutral-600 hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
              aria-label="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Products Slider Row */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2.5 overflow-x-auto scrollbar-none py-1 relative z-10"
      >
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={product.productUrl}
            className="shrink-0 w-[115px] sm:w-[125px] block group cursor-pointer transform-gpu"
          >
            {/* Image Container */}
            <div className="relative aspect-square w-full bg-[#f4f4f4] rounded-lg overflow-hidden mb-2 border border-neutral-200/80 group-hover:border-neutral-300 transition-colors pointer-events-none">
              <KitImage src={product.imageUrl} alt={product.name} />
            </div>

            {/* Typography Details */}
            <div className="px-0.5">
              <h4 className="text-[11px] font-bold text-neutral-900 font-sans line-clamp-2 leading-tight group-hover:text-brand transition-colors">
                {product.name}
              </h4>
              <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-neutral-100">
                <span className="text-[11px] font-extrabold text-brand font-sans">
                  {product.priceFormatted}
                </span>
                <span className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center text-[10px] font-bold group-hover:bg-brand group-hover:text-white transition-colors">
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
