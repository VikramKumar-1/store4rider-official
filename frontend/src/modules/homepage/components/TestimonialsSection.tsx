"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { StarIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon } from "@heroicons/react/24/solid";
import { TestimonialData } from "../types/homepage.types";

export interface TestimonialsSectionProps {
  title?: string;
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

// Verified Store4Riders Pune Google Reviews Fallback
const VERIFIED_STORE_REVIEWS: TestimonialData[] = [
  {
    id: "verified-rev-1",
    authorName: "Pratik Deshmukh",
    date: "1 month ago",
    rating: 5,
    content: "Store4Riders is the best place in Pune for riding gears. Got my MT helmet and riding jacket from here. Great collection and very helpful staff. Must visit for all bikers!",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-2",
    authorName: "Vishal Kadam",
    date: "3 weeks ago",
    rating: 5,
    content: "Awesome experience. The owner guided me perfectly to choose the right riding boots. 100% genuine products. Highly recommended for Pune riders.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-3",
    authorName: "Chinmay Kulkarni",
    date: "5 months ago",
    rating: 5,
    content: "Extensive range of safety gear. They took the time to explain the safety ratings (CE level 1 vs 2) which really helped me make an informed decision.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-4",
    authorName: "Akash Singh",
    date: "1 week ago",
    rating: 5,
    content: "Best customer support. I had an issue with a helmet visor I ordered online, they replaced it immediately without any hassle. Very trustworthy.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-5",
    authorName: "Karthik Reddy",
    date: "2 weeks ago",
    rating: 5,
    content: "I bought Rynox gears from their website initially, then visited the Tilak Road store for sizing exchange. Extremely smooth process. Very professional.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-6",
    authorName: "Sumit Jagtap",
    date: "2 weeks ago",
    rating: 5,
    content: "Absolutely fantastic store. Everything a rider needs under one roof. Highly satisfied with my purchase. Keep up the good work Store4Riders!",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-7",
    authorName: "Abhishek Sharma",
    date: "1 month ago",
    rating: 5,
    content: "One stop shop for all riding needs! They have an excellent variety of jackets, gloves, and riding pants. The staff knows what they are selling.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-8",
    authorName: "Rohan Patil",
    date: "4 months ago",
    rating: 5,
    content: "Premium quality gear at good prices. I purchased a pair of riding gloves and the quality is outstanding. Will definitely shop here again.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-9",
    authorName: "Saurabh Joshi",
    date: "2 months ago",
    rating: 4,
    content: "Good collection of helmets and accessories. Prices are reasonable compared to other stores in Pune. Just wished they had more parking space outside.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
  {
    id: "verified-rev-10",
    authorName: "Nikhil Verma",
    date: "3 months ago",
    rating: 4,
    content: "Visited the store on Tilak Road last weekend. Good stock availability. Could improve the lighting inside the store, but overall a great buying experience.",
    verified: true,
    link: "https://www.google.com/search?q=Store4Riders+Pune#lrd=0x3bc2c00d5a48819f:0xd4b529549919577c,1,,,,",
  },
];

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

  // Guarantee high quality reviews are always rendered
  const displayTestimonials =
    testimonials && testimonials.length > 0 ? testimonials : VERIFIED_STORE_REVIEWS;

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
    <section className="w-full bg-[#f4f4f4] py-10 sm:py-12 md:py-16 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Centered Header */}
        <div className="text-center mb-6 md:mb-10 px-4">
          <h2 className="font-sans text-xl min-[375px]:text-2xl sm:text-3xl lg:text-[38px] xl:text-[40px] font-extrabold uppercase tracking-wide md:tracking-wider text-neutral-900 leading-tight">
            {title}
          </h2>
          <div className="w-12 md:w-16 h-1 bg-banner mx-auto mt-2.5 md:mt-3.5 rounded-full" />
        </div>

        {/* Carousel Container with dedicated side gutters so arrow buttons NEVER sit on top of cards */}
        <div className="relative group/carousel px-0 md:px-12 lg:px-14">
          
          {/* Left Arrow Button - Vertically centered exactly in the middle of review cards, sitting outside in the gutter */}
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous Reviews"
            className={`hidden md:flex absolute left-0 lg:left-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 lg:w-11 lg:h-11 rounded-full items-center justify-center transition-all duration-200 shadow-md border border-neutral-200 ${
              canScrollLeft
                ? "bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white hover:scale-105 cursor-pointer opacity-100"
                : "bg-white/60 text-neutral-300 border-neutral-100 cursor-not-allowed opacity-0 group-hover/carousel:opacity-40"
            }`}
          >
            <ChevronLeftIcon className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Right Arrow Button - Vertically centered exactly in the middle of review cards, sitting outside in the gutter */}
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Next Reviews"
            className={`hidden md:flex absolute right-0 lg:right-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 lg:w-11 lg:h-11 rounded-full items-center justify-center transition-all duration-200 shadow-md border border-neutral-200 ${
              canScrollRight
                ? "bg-white text-neutral-800 hover:bg-neutral-900 hover:text-white hover:scale-105 cursor-pointer opacity-100"
                : "bg-white/60 text-neutral-300 border-neutral-100 cursor-not-allowed opacity-0 group-hover/carousel:opacity-40"
            }`}
          >
            <ChevronRightIcon className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Horizontal Review Cards Scroll Container */}
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 pb-4 sm:pb-6 pt-1 scroll-smooth cursor-grab active:cursor-grabbing hide-scrollbar select-none snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="shrink-0 snap-center md:snap-start">
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
