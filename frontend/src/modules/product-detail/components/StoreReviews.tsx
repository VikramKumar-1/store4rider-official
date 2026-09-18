"use client";

import React, { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "@heroicons/react/24/solid";
import { ReviewData } from "../types/product-detail.types";

const ReviewCard: React.FC<{ review: ReviewData }> = ({ review }) => {
  const [isExpanded, React_setIsExpanded] = React.useState(false);
  const isLong = review.text.length > 90;

  return (
    <div className="shrink-0 w-[220px] snap-center border border-neutral-200/70 p-3.5 rounded-xl flex flex-col justify-between shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] bg-white h-[160px] transition-all hover:shadow-md hover:border-neutral-300 relative">
      <div>
        {/* Top: Stars + Verified tag */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-400" : "text-neutral-200"}`} />
            ))}
          </div>
          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Verified
          </span>
        </div>
        
        {/* Review text */}
        <p className={`text-[11px] text-neutral-700 leading-relaxed font-normal ${isExpanded ? "" : "line-clamp-3"}`}>
          "{review.text}"
        </p>
        {isLong && (
          <button 
            onClick={() => React_setIsExpanded(!isExpanded)}
            className="text-[9px] font-bold text-brand mt-1 uppercase tracking-wider hover:underline"
          >
            {isExpanded ? "Less" : "More"}
          </button>
        )}
      </div>

      {/* Bottom author info */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-neutral-900 leading-tight truncate max-w-[120px]">{review.author}</span>
          <span className="text-[9px] text-neutral-400">{review.date}</span>
        </div>
        <div className="w-4 h-4 shrink-0 opacity-80" title="Google Review">
          <svg viewBox="0 0 24 24" className="w-full h-full"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        </div>
      </div>
    </div>
  );
};

export const StoreReviews: React.FC<{ reviews: ReviewData[] }> = ({ reviews }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!reviews || reviews.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 230;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="w-full relative flex flex-col justify-between h-full">
      {/* Header with Google Badge */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-neutral-900">
            Store Reviews
          </h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-neutral-200/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-neutral-800 shadow-xs">
          <span className="text-amber-500">★ 4.9</span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-600 font-semibold">Google Verified</span>
        </div>
      </div>

      {/* Slider Area */}
      <div className="relative group/reviews">
        {/* Navigation Arrows */}
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-neutral-200 shadow-md rounded-full text-neutral-700 hover:text-brand transition-all p-1.5 opacity-0 group-hover/reviews:opacity-100"
          aria-label="Previous review"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-neutral-200 shadow-md rounded-full text-neutral-700 hover:text-brand transition-all p-1.5 opacity-0 group-hover/reviews:opacity-100"
          aria-label="Next review"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Scroll Container */}
        <div 
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto scrollbar-none py-1 items-start snap-x snap-mandatory"
        >
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </div>
  );
};
