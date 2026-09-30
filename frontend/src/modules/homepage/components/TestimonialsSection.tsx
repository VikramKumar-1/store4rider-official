"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { StarIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon } from "@heroicons/react/24/solid";
import { TestimonialData } from "../types/homepage.types";

export interface TestimonialsSectionProps {
  testimonials: TestimonialData[];
}

/**
 * TestimonialCard Component
 * Matches the user's wireframe layout exactly: 
 * Left: Avatar (circle) + Name (top) / Date (bottom)
 * Right: 5 Stars
 * Below: Review text
 */
const TestimonialCard: React.FC<{ data: TestimonialData }> = ({ data }) => {
  return (
    <a 
      href={data.link || "#"} 
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-[#FFF5F0] border border-[#FFE8DD] p-3.5 sm:p-5 md:p-6 w-[230px] min-[375px]:w-[245px] sm:w-[320px] md:w-[380px] shrink-0 flex flex-col rounded-sm select-none h-full transition-colors duration-300 hover:bg-[#FFF0E5] block"
    >
      
      {/* Top Header Row */}
      <div className="flex items-start justify-between mb-2.5 sm:mb-4">
        
        {/* Left: Avatar + Name/Date */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar (Dark brownish-red circle with UserIcon fallback) */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-[#4a1c1c] overflow-hidden relative shrink-0 flex items-center justify-center">
            {data.avatarUrl ? (
              <Image src={data.avatarUrl} alt={data.authorName} fill className="object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white/80" />
            )}
          </div>
          
          <div className="flex flex-col">
            <span className="text-[9px] min-[375px]:text-[10px] md:text-[11px] font-bold text-neutral-900 uppercase tracking-wide">
              {data.authorName}
            </span>
            <span className="text-[8px] md:text-[10px] text-neutral-500 mt-0.5">
              {data.date}
            </span>
          </div>
        </div>

        {/* Right: Stars */}
        <div className="flex items-center gap-0.5 shrink-0">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                i < Math.floor(data.rating) ? "text-[#FFD700]" : "text-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Review Text */}
      <p className="text-[10px] sm:text-xs text-neutral-500 leading-normal sm:leading-relaxed font-sans line-clamp-4 sm:line-clamp-5">
        {data.content}
      </p>

    </a>
  );
};

/**
 * TestimonialsSection Component
 */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse drag state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);

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

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <section className="w-full bg-[#f4f4f4] py-12 md:py-20 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 relative">
        
        {/* Centered Header (Matching Wireframe) */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-sans text-[16px] min-[375px]:text-[18px] sm:text-2xl md:text-3xl lg:text-[40px] font-extrabold uppercase tracking-wide md:tracking-wider text-neutral-900 leading-tight whitespace-nowrap">
            WHAT CUSTOMERS SAY ABOUT US
          </h2>
          <div className="w-10 md:w-16 h-1 bg-banner mx-auto mt-2 md:mt-4 rounded-full"></div>
        </div>

        {/* Prev / Next Desktop Controls (Hidden on mobile to keep layout clean like wireframe) */}
        <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between px-2 md:px-4 pointer-events-none z-10">
          <button
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            className={`pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
              canScrollLeft
                ? "bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white"
                : "bg-white/50 text-neutral-400 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronLeftIcon className="w-6 h-6 stroke-[2]" />
          </button>

          <button
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            className={`pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
              canScrollRight
                ? "bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white"
                : "bg-white/50 text-neutral-400 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronRightIcon className="w-6 h-6 stroke-[2]" />
          </button>
        </div>

        {/* Horizontal Review Cards Container */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-6 pb-4 sm:pb-6 pt-2 scroll-smooth cursor-grab active:cursor-grabbing hide-scrollbar select-none snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="shrink-0 snap-center md:snap-start">
                <TestimonialCard data={testimonial} />
              </div>
            ))}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `
      }} />
    </section>
  );
};

export default TestimonialsSection;
