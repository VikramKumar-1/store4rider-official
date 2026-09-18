"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { StarIcon, ChevronLeftIcon, ChevronRightIcon, CheckBadgeIcon } from "@heroicons/react/24/solid";
import { TestimonialData } from "../types/homepage.types";

export interface TestimonialsSectionProps {
  testimonials: TestimonialData[];
}

/**
 * TestimonialCard Component
 * Modern, high-trust rider review card with verified badge and riding info.
 */
const TestimonialCard: React.FC<{ data: TestimonialData }> = ({ data }) => {
  return (
    <div className="bg-white p-6 md:p-7 shadow-xs hover:shadow-md transition-all duration-300 w-[300px] sm:w-[340px] md:w-[380px] shrink-0 flex flex-col justify-between rounded-2xl border border-neutral-200/80 select-none">
      
      {/* Top: Author Info, Rating, Verified Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar / Initials */}
            <div className="w-11 h-11 rounded-full bg-neutral-900 text-white overflow-hidden relative shrink-0 flex items-center justify-center font-black text-sm border-2 border-banner/20">
              {data.avatarUrl ? (
                <Image src={data.avatarUrl} alt={data.authorName} fill className="object-cover" />
              ) : (
                <span>{data.authorName.split(" ").map(n => n[0]).slice(0, 2).join("")}</span>
              )}
            </div>

            {/* Name + Bike/City */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-extrabold text-neutral-900 uppercase tracking-tight truncate">
                  {data.authorName}
                </span>
                {data.verified !== false && (
                  <CheckBadgeIcon className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Buyer" />
                )}
              </div>
              <span className="text-[11px] font-medium text-neutral-500 truncate">
                {data.bikeModel ? `${data.bikeModel}${data.location ? ` • ${data.location}` : ""}` : data.date}
              </span>
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5 shrink-0">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  i < Math.floor(data.rating) ? "text-amber-400" : "text-neutral-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Product Tag (if available) */}
        {data.purchasedProduct && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wider mb-3.5">
            <span className="text-banner">Gear:</span> {data.purchasedProduct}
          </div>
        )}

        {/* Review Text */}
        <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-sans line-clamp-4">
          &ldquo;{data.content}&rdquo;
        </p>
      </div>

      {/* Bottom Footer: Date & Verified purchase note */}
      <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
        <span>{data.date}</span>
        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
          ✓ Verified Rider
        </span>
      </div>

    </div>
  );
};

/**
 * TestimonialsSection Component
 * 
 * Features:
 * - Smooth desktop horizontal buttons (Prev/Next) with disabled states
 * - Mouse drag-to-scroll support without text selection
 * - Smooth mouse wheel horizontal scroll translation
 * - Interactive pagination dots
 * - Soft responsive design with zero jitter
 */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Mouse drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Approximate active index
    const cardWidth = 340 + 24; // Card width + gap
    const idx = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, testimonials.length - 1));
  }, [testimonials.length]);

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

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleDotClick = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const cardWidth = 340 + 24;
    el.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4; // Scroll multiplier
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Horizontal Wheel Support (allows smooth mouse wheel scroll without holding Shift)
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 10) {
      // Check if carousel can scroll further in that direction
      const canScrollDown = el.scrollLeft < el.scrollWidth - el.clientWidth - 5;
      const canScrollUp = el.scrollLeft > 5;

      if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
        e.preventDefault();
        el.scrollBy({
          left: e.deltaY * 1.5,
          behavior: "auto",
        });
      }
    }
  };

  return (
    <section className="w-full bg-[#f9f9f9] py-12 md:py-20 overflow-hidden border-t border-b border-neutral-200/70">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        
        {/* Header with Title & Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-banner animate-pulse"></span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-banner">
                Rider Community
              </span>
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-wide text-neutral-900 leading-tight">
              WHAT CUSTOMERS SAY ABOUT US
            </h2>
            <div className="w-16 h-1 bg-banner mt-3 rounded-full"></div>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-3 max-w-xl">
              Authentic feedback from verified riders across India who rely on Store4Riders for premium safety, genuine gear, and express delivery.
            </p>
          </div>

          {/* Prev / Next Controls */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous Reviews"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                canScrollLeft
                  ? "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 shadow-xs active:scale-95"
                  : "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5 stroke-[2]" />
            </button>

            <button
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Next Reviews"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                canScrollRight
                  ? "bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 shadow-xs active:scale-95"
                  : "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed opacity-50"
              }`}
            >
              <ChevronRightIcon className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Silky Smooth Horizontal Review Cards Container */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
          className="flex overflow-x-auto gap-5 md:gap-6 pb-6 pt-2 scroll-smooth cursor-grab active:cursor-grabbing hide-scrollbar select-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="shrink-0 transition-transform duration-200 hover:-translate-y-1">
              <TestimonialCard data={testimonial} />
            </div>
          ))}
        </div>

        {/* Interactive Bottom Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              aria-label={`Jump to review ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                activeIndex === idx
                  ? "w-8 h-2 bg-banner"
                  : "w-2 h-2 bg-neutral-300 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>

      </div>

      {/* Global CSS to suppress scrollbars cleanly */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
