"use client";

import React, { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "@heroicons/react/24/solid";
import { ReviewData } from "../types/product-detail.types";

const ReviewCard: React.FC<{ review: ReviewData }> = ({ review }) => {
  const [isExpanded, React_setIsExpanded] = React.useState(false);
  const isLong = review.text.length > 80;

  return (
    <div className="shrink-0 w-[240px] snap-center border border-neutral-200 p-4 rounded-sm flex flex-col gap-2.5 shadow-sm bg-white h-max">
      <div className="flex items-center gap-1 text-[#FFD700]">
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "" : "text-neutral-200"}`} />
        ))}
      </div>
      <div className="flex flex-col">
        <p className={`text-xs text-neutral-600 leading-relaxed transition-all duration-300 ${isExpanded ? "" : "line-clamp-3"}`}>
          "{review.text}"
        </p>
        {isLong && (
          <button 
            onClick={() => React_setIsExpanded(!isExpanded)}
            className="text-[10px] font-bold text-[#ab1509] mt-1.5 uppercase tracking-wider hover:underline text-left w-max"
          >
            {isExpanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>
      <div className="flex flex-col mt-auto pt-2 border-t border-neutral-100">
        <span className="text-[11px] font-semibold text-neutral-800">{review.author}</span>
        <span className="text-[9px] text-neutral-400">{review.date}</span>
      </div>
    </div>
  );
};

export const StoreReviews: React.FC<{ reviews: ReviewData[] }> = ({ reviews }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!reviews || reviews.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 260; // adjusted for smaller cards
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="w-full relative">
      <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-800 mb-6 px-4 md:px-0">
        STORE REVIEW GOOGLE
      </h3>

      <div className="relative group/reviews">
        {/* Navigation Arrows */}
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 z-10 text-[#ab1509] hover:text-orange-600 transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 z-10 text-[#ab1509] hover:text-orange-600 transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Scroll Container */}
        <div 
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar px-10 py-2 items-start snap-x snap-mandatory"
        >
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </div>
  );
};
