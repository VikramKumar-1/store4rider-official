"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { BrowseProductData } from "../types/homepage.types";

export interface BrowseProductsSectionProps {
  title: string;
  products: BrowseProductData[];
  showSeeMore?: boolean;
  seeMoreText?: string;
  seeMoreLink?: string;
  mobileLayout?: "scroll" | "grid";
}

/**
 * GridProductCard Component
 */
const GridProductCard: React.FC<{ product: BrowseProductData }> = ({ 
  product, 
}) => {
  return (
    <div className="flex flex-col group cursor-pointer w-full h-full">
      {/* Edge-to-edge Image Container */}
      <div className="relative aspect-square w-full bg-[#f4f4f4] overflow-hidden mb-2 md:mb-3 group/image flex items-center justify-center rounded-lg">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* Solid Orange Rating Badge */}
        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-[#FF5429] text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10 shadow-sm">
          <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-white fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {(Number(product.rating) || 4.8).toFixed(1)}
        </div>

        {/* Hover "Add to Cart" Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto bg-black/5 z-20 hidden lg:flex">
          <span className="bg-white hover:bg-[#FF5429] text-neutral-900 hover:text-white w-[85%] py-2.5 rounded flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out select-none">
            ADD TO CART
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col space-y-0.5 md:space-y-1 mt-1">
        <h3 className="font-sans font-bold text-[12px] md:text-[14px] text-neutral-900 line-clamp-1 leading-tight">
          {product.name}
        </h3>
        <span className="text-[11px] md:text-sm text-neutral-600 font-sans font-semibold tracking-wide">
          {product.priceFormatted}
        </span>
      </div>
    </div>
  );
};

/**
 * BrowseProductsSection Component
 */
export const BrowseProductsSection: React.FC<BrowseProductsSectionProps> = ({
  title,
  products,
  showSeeMore = false,
  seeMoreText = "SEE MORE",
  seeMoreLink = "/products?q=touring",
  mobileLayout = "grid"
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    if (mobileLayout !== "scroll") return;
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, mobileLayout, products]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-14 bg-white">
      {/* Section Title */}
      <div className="text-center mb-6 md:mb-12 px-0 sm:px-4">
        <h2 className="font-sans text-[14px] min-[360px]:text-[15.5px] min-[390px]:text-[17px] sm:text-2xl md:text-3xl lg:text-[38px] xl:text-[40px] font-extrabold text-neutral-900 uppercase tracking-tight sm:tracking-wide md:tracking-wider leading-tight">
          {title}
        </h2>
        <div className="w-10 sm:w-12 md:w-16 h-0.5 sm:h-1 bg-banner mx-auto mt-2 sm:mt-2.5 md:mt-4 rounded-full" />
      </div>

      {/* Carousel / Grid Container */}
      <div className="relative">
        {/* Left Scroll Arrow */}
        {mobileLayout === "scroll" && (
          <button
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous products"
            className={`absolute -left-2 sm:-left-4 md:-left-5 lg:-left-6 top-[42%] -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-neutral-200/90 backdrop-blur-md border border-neutral-300/90 shadow-lg flex items-center justify-center transition-all duration-300 ease-out text-neutral-900 hover:bg-neutral-900 hover:text-white hover:scale-110 hover:shadow-xl ${
              canScrollLeft
                ? "cursor-pointer opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </button>
        )}

        {/* Products Row / Grid */}
        <div
          ref={scrollContainerRef}
          className={
            mobileLayout === "scroll"
              ? "flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 hide-scrollbar"
              : "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          }
        >
          {products.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`prod-skeleton-${i}`}
                className={
                  mobileLayout === "scroll"
                    ? "w-[165px] min-[375px]:w-[185px] sm:w-[220px] md:w-[260px] lg:w-[calc((100%-3*1.5rem)/4)] flex-shrink-0"
                    : "w-full"
                }
              >
                <div className="relative aspect-square w-full bg-neutral-100 rounded-lg animate-pulse mb-2 md:mb-3" />
                <div className="h-3.5 bg-neutral-200 rounded w-3/4 animate-pulse mb-1.5" />
                <div className="h-3 bg-neutral-200 rounded w-1/3 animate-pulse" />
              </div>
            ))
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                href={product.productUrl}
                className={mobileLayout === "scroll" ? "block snap-start shrink-0 w-[165px] min-[375px]:w-[185px] sm:w-[220px] md:w-[260px] lg:w-[calc((100%-3*1.5rem)/4)]" : "block w-full"}
              >
                <GridProductCard product={product} />
              </Link>
            ))
          )}
        </div>

        {/* Right Scroll Arrow */}
        {mobileLayout === "scroll" && (
          <button
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Next products"
            className={`absolute -right-2 sm:-right-4 md:-right-5 lg:-right-6 top-[42%] -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-neutral-200/90 backdrop-blur-md border border-neutral-300/90 shadow-lg flex items-center justify-center transition-all duration-300 ease-out text-neutral-900 hover:bg-neutral-900 hover:text-white hover:scale-110 hover:shadow-xl ${
              canScrollRight
                ? "cursor-pointer opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </button>
        )}
      </div>

      {/* Conditional See More Button */}
      {showSeeMore && (
        <div className="mt-8 md:mt-12 flex justify-center">
          <Link
            href={seeMoreLink || "/products?q=touring"}
            className="bg-banner text-white px-8 md:px-12 py-3 md:py-3.5 text-xs sm:text-sm font-semibold tracking-[0.2em] shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-300 rounded-sm"
          >
            {seeMoreText || "SEE MORE"}
          </Link>
        </div>
      )}
    </section>
  );
};

export default BrowseProductsSection;
