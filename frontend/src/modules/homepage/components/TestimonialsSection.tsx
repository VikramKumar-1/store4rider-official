"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { TestimonialData } from "../types/homepage.types";

export interface TestimonialsSectionProps {
  title?: string;
  testimonials: TestimonialData[];
}

/**
 * Extracts clean 1-2 character initials from an author name.
 */
function getInitials(name?: string): string {
  if (!name || !name.trim()) return "R";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * TestimonialCard Component
 * Pure, high-performance Claymorphism:
 * - Static 3D dual-shadow clay depth (zero hover transform to prevent scroll lag)
 * - Pristine porcelain base with subtle inner lighting
 * - Instant, zero-jitter rendering during fast scrolling
 */
const TestimonialCard: React.FC<{ data: TestimonialData }> = ({ data }) => {
  return (
    <a 
      href={data.link || "#"} 
      target="_blank" 
      rel="noopener noreferrer"
      className="relative bg-gradient-to-b from-white via-[#FCFCFD] to-[#F7F8FA] border border-white/90 ring-1 ring-black/[0.04] p-4 min-[375px]:p-5 sm:p-6 md:p-6.5 w-[265px] min-[375px]:w-[285px] sm:w-[340px] md:w-[390px] shrink-0 flex flex-col justify-between rounded-2xl sm:rounded-3xl select-none h-full shadow-[0_6px_20px_rgba(15,23,42,0.05),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.03)] block overflow-hidden"
    >
      {/* Decorative Clay Quote Watermark in Background */}
      <svg 
        className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-100/80 absolute top-3.5 right-4 pointer-events-none -scale-x-100"
        fill="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>

      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2.5 mb-3 sm:mb-4 relative z-10">
          
          {/* Left: Avatar + Name / Date */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Clay-framed Avatar */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full p-0.5 bg-gradient-to-tr from-brand/20 via-white to-banner/30 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_6px_rgba(0,0,0,0.06)] shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-950 text-white flex items-center justify-center relative shadow-inner">
                {data.avatarUrl ? (
                  <Image src={data.avatarUrl} alt={data.authorName} fill className="object-cover" />
                ) : (
                  <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white/95">
                    {getInitials(data.authorName)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-[13px] md:text-sm font-bold text-neutral-900 tracking-tight truncate max-w-[120px] sm:max-w-[150px]">
                  {data.authorName}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 px-1.5 py-0.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] shrink-0">
                  <svg className="w-2.5 h-2.5 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Verified
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-600 font-medium mt-0.5">
                {data.date}
              </span>
            </div>
          </div>

          {/* Right: Claymorphic Rating Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-b from-amber-50/90 to-amber-100/50 border border-amber-200/60 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_4px_rgba(245,158,11,0.08)] shrink-0">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    i < Math.floor(data.rating || 5) ? "text-amber-400 fill-amber-400" : "text-neutral-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] sm:text-xs font-black text-amber-700 ml-0.5">
              {(data.rating || 5).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Review Text */}
        <p className="text-xs sm:text-[13px] md:text-sm text-neutral-700 leading-relaxed font-sans line-clamp-4 sm:line-clamp-5 my-2.5 sm:my-3.5 relative z-10">
          &ldquo;{data.content}&rdquo;
        </p>
      </div>

      {/* Bottom Footer Row with Google Verified Tag & Link */}
      <div className="mt-3 pt-3 border-t border-neutral-100/90 flex items-center justify-between text-neutral-600 text-[11px] sm:text-xs font-medium relative z-10">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-neutral-600 font-medium text-[11px] sm:text-xs">Google Verified</span>
        </div>
        
        <span className="text-neutral-600 hover:text-brand font-semibold text-[10.5px] sm:text-[11px] flex items-center gap-0.5">
          Read Review
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </span>
      </div>

    </a>
  );
};

/**
 * TestimonialsSection Component
 */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  title = "WHAT CUSTOMERS SAY ABOUT US",
  testimonials,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse drag state
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  // Return null when no reviews exist - Zero Mock Compliance
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const displayTestimonials = testimonials;

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Drag Handlers - pure direct motion without snap or animations
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDownRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDownRef.current = false;
  };

  // Prevent accidental click when dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasMovedRef.current = false;
    }
  };

  return (
    <section className="w-full bg-gradient-to-b from-[#F5F6F9] via-[#F3F4F7] to-[#EDEFF4] py-10 sm:py-14 md:py-16 overflow-hidden relative">
      {/* Subtle ambient lighting for claymorphic depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/70 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        
        {/* Centered Clean Header */}
        <div className="text-center mb-6 md:mb-10 px-0 sm:px-4">
          <h2 className="font-sans text-[15px] min-[360px]:text-[16.5px] min-[390px]:text-[18px] sm:text-2xl md:text-3xl lg:text-[38px] xl:text-[40px] font-extrabold uppercase tracking-tight sm:tracking-wide md:tracking-wider text-neutral-900 leading-tight">
            {title}
          </h2>
          <div className="w-10 sm:w-12 md:w-16 h-0.5 sm:h-1 bg-banner mx-auto mt-2 sm:mt-2.5 md:mt-3.5 rounded-full" />
        </div>

        {/* Carousel Container with dedicated side gutters */}
        <div className="relative group/carousel px-0 md:px-12 lg:px-14">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous Reviews"
            className={`hidden md:flex absolute left-0 lg:left-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 lg:w-12 lg:h-12 rounded-full items-center justify-center ${
              canScrollLeft
                ? "bg-white text-neutral-800 border border-white/90 shadow-md hover:bg-neutral-900 hover:text-white cursor-pointer opacity-100"
                : "bg-white/60 text-neutral-300 border-neutral-100 cursor-not-allowed opacity-0 group-hover/carousel:opacity-40"
            }`}
          >
            <ChevronLeftIcon className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Next Reviews"
            className={`hidden md:flex absolute right-0 lg:right-1 top-1/2 -translate-y-1/2 z-20 w-11 h-11 lg:w-12 lg:h-12 rounded-full items-center justify-center ${
              canScrollRight
                ? "bg-white text-neutral-800 border border-white/90 shadow-md hover:bg-neutral-900 hover:text-white cursor-pointer opacity-100"
                : "bg-white/60 text-neutral-300 border-neutral-100 cursor-not-allowed opacity-0 group-hover/carousel:opacity-40"
            }`}
          >
            <ChevronRightIcon className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Horizontal Review Cards Scroll Container - Zero Lag, Zero Jitter, No Snap Animation */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onClickCapture={handleClickCapture}
            className="flex overflow-x-auto gap-4 sm:gap-5 md:gap-6 pb-6 sm:pb-8 pt-2.5 px-1 cursor-grab active:cursor-grabbing hide-scrollbar select-none"
            style={{ 
              scrollbarWidth: "none", 
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {displayTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="shrink-0 py-1">
                <TestimonialCard data={testimonial} />
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
