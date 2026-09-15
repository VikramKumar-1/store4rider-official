"use client";

import React, { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "@heroicons/react/24/solid";
import { ReviewData } from "../types/product-detail.types";

export const StoreReviews: React.FC<{ reviews: ReviewData[] }> = ({ reviews }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!reviews || reviews.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 300;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="mt-12 relative">
      <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-800 mb-6 text-center">
        STORE REVIEW GOOGLE
      </h3>

      <div className="relative group/reviews">
        {/* Navigation Arrows */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-banner opacity-70 hover:opacity-100 bg-white/80 rounded-full shadow-sm p-1"
        >
          <ChevronLeftIcon className="w-8 h-8 font-light" />
        </button>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-banner opacity-70 hover:opacity-100 bg-white/80 rounded-full shadow-sm p-1"
        >
          <ChevronRightIcon className="w-8 h-8 font-light" />
        </button>

        {/* Scroll Container */}
        <div 
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar px-10 py-2 snap-x snap-mandatory"
        >
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="shrink-0 w-[280px] snap-center border border-neutral-200 p-5 rounded-sm flex flex-col gap-3 shadow-sm bg-white"
            >
              <div className="flex items-center gap-1 text-[#FFD700]">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? "" : "text-neutral-200"}`} />
                ))}
              </div>
              <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
                "{review.text}"
              </p>
              <div className="flex flex-col mt-auto pt-2 border-t border-neutral-100">
                <span className="text-xs font-semibold text-neutral-800">{review.author}</span>
                <span className="text-[10px] text-neutral-400">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
