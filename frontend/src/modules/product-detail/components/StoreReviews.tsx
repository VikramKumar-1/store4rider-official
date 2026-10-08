"use client";

import React, { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "@heroicons/react/24/solid";
import { ReviewData } from "../types/product-detail.types";

const ReviewCard: React.FC<{ review: ReviewData }> = ({ review }) => {
  const isLong = review.text.length > 70;

  return (
    <a 
      href={review.link || "#"} 
      target={review.link ? "_blank" : "_self"} 
      className="group shrink-0 w-[180px] md:w-[200px] border border-neutral-200/70 p-3 rounded-xl flex flex-col justify-between bg-white h-[110px] hover:border-neutral-300 relative cursor-pointer block"
    >
      <div>
        {/* Top: Stars + Verified tag */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-0 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className={`w-2.5 h-2.5 ${i < review.rating ? "text-amber-400" : "text-neutral-200"}`} />
            ))}
          </div>
        </div>
        
        {/* Review text */}
        <p className="text-[10px] text-neutral-600 leading-snug font-normal line-clamp-3">
          "{review.text}"
        </p>
        {isLong && (
          <span className="text-[8px] font-bold text-brand mt-0.5 uppercase tracking-wider group-hover:underline inline-block">
            Read More
          </span>
        )}
      </div>

      {/* Bottom author info */}
      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 mt-1.5">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <svg className="w-2.5 h-2.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold text-neutral-900 leading-tight truncate max-w-[100px]">{review.author}</span>
          </div>
          <span className="text-[9px] text-neutral-400">{review.date}</span>
        </div>
        <div className="w-5 h-5 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0 shadow-sm" title="Google Review">
          <svg className="w-3 h-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
      </div>
    </a>
  );
};

import { useStoreReviews } from "@/core/hooks/useStoreReviews";

export const StoreReviews: React.FC<{ reviews?: ReviewData[] }> = ({ reviews: propReviews }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useStoreReviews();
  const fetchedReviews = data?.pages.flatMap(p => p.data) || [];
  
  // Use fetched reviews if available, fallback to props
  const reviews = fetchedReviews.length > 0 ? fetchedReviews : (propReviews || []);

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
    <div className="w-full relative flex flex-col">
      {/* Header with Google Badge and See All */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-neutral-900">
            Store Reviews
          </h3>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-white border border-neutral-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-neutral-800 shadow-xs ml-2">
            <span className="text-amber-500">★ 4.8</span>
          </span>
        </div>
        <a 
          href="https://www.google.com/maps/search/?api=1&query=Store4Riders" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] sm:text-xs font-bold text-brand hover:text-orange-700 hover:underline uppercase tracking-wider flex items-center gap-1 transition-colors"
        >
          SEE ALL
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
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
          className="flex gap-3 overflow-x-auto scrollbar-none py-1 items-start"
        >
          {reviews.map((review, index) => (
            <ReviewCard key={review._id || review.id || `review-${index}`} review={review} />
          ))}
          {hasNextPage && (
            <div className="shrink-0 w-[120px] flex items-center justify-center h-[130px]">
              <button 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="flex flex-col items-center justify-center gap-2 text-brand hover:text-orange-700 transition-colors disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Load More</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
