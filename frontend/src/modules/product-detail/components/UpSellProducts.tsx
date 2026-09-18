"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { KitProduct } from "../types/product-detail.types";

export const UpSellProducts: React.FC<{ products: KitProduct[] }> = ({ products }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="w-full mt-12 md:mt-16 mb-28 md:mb-36 border-t border-neutral-200/80 pt-10">
      {/* Header with Navigation Arrows */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-5 bg-brand rounded-full" />
          <h2 className="text-base md:text-lg font-extrabold uppercase tracking-wider text-neutral-900">
            You May Also Like
          </h2>
        </div>

        {/* Show navigation arrows only if there are enough products to scroll */}
        {products.length > 4 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-brand hover:border-brand transition-all shadow-2xs"
              aria-label="Previous items"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-brand hover:border-brand transition-all shadow-2xs"
              aria-label="Next items"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Responsive Slider / Grid Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-none py-2 px-1 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={product.productUrl}
            className="group shrink-0 w-[170px] sm:w-[200px] md:w-[240px] snap-start flex flex-col bg-white rounded-xl border border-neutral-200/70 p-3 shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all duration-300"
          >
            {/* Image Box */}
            <div className="relative aspect-square w-full bg-neutral-50/50 rounded-lg overflow-hidden mb-3 border border-neutral-100">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-300 ease-out"
                sizes="(max-width: 640px) 170px, (max-width: 768px) 200px, 240px"
              />
              <div className="absolute top-2 right-2 bg-neutral-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-xs">
                FEATURED
              </div>
            </div>

            {/* Product Meta */}
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  {product.category}
                </span>
                <h3 className="text-xs md:text-sm font-bold text-neutral-900 font-sans line-clamp-2 leading-snug group-hover:text-brand transition-colors mt-0.5">
                  {product.name}
                </h3>
              </div>
              <span className="text-xs md:text-sm font-extrabold text-brand font-sans mt-2">
                {product.priceFormatted}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
