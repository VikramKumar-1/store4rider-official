"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { HeroSectionProps } from "../types/homepage.types";
import ProductCard from "./ProductCard";

/**
 * HeroSection Component
 *
 * DESKTOP (lg+) — UNCHANGED from original:
 *   Left: subtitle + big H1 title text
 *   Right: two floating ProductCards
 *
 * MOBILE ONLY changes (< lg):
 *   - Text moves to bottom-left over image (was stacked awkwardly)
 *   - Product cards hidden (too cramped on small screen)
 *   - "Shop Now" CTA button shown instead
 *   - Gradient overlay stronger so text is readable
 *   - Slide indicator dots at bottom
 *
 * To edit DESKTOP → change classes with lg: prefix
 * To edit MOBILE  → change classes without prefix (or sm:)
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  subtitle,
  title,
  bgImageUrl,
  bgImageUrls,
  featuredProducts,
}) => {
  const topProduct = featuredProducts[0];
  const bottomProduct = featuredProducts[1] || featuredProducts[0];

  const images = bgImageUrls && bgImageUrls.length > 0 ? bgImageUrls : [bgImageUrl];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative w-full h-[320px] lg:h-[100svh] lg:min-h-[600px] flex flex-col justify-between overflow-hidden bg-neutral-900">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        {images.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt={`Hero background ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-[center_30%] lg:object-center"
            />
          </div>
        ))}

        {/* Mobile: stronger gradient for text legibility | Desktop: light overlay (original) */}
        <div className="absolute inset-0 pointer-events-none z-10
          bg-gradient-to-t from-black/65 via-black/20 to-transparent
          lg:bg-black/15 lg:mix-blend-multiply"
        />
      </div>

      {/* ── Hero Body — row on desktop, column on mobile ── */}
      <div className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-12
        flex flex-col lg:flex-row items-start lg:items-center justify-end lg:justify-between
        pb-5 pt-20 lg:pt-40 lg:pb-24 gap-4 lg:gap-6"
      >
        {/* Left: Text */}
        <div className="flex-1 min-w-0 flex flex-col h-full justify-end">
          
          {/* Desktop Text (Hidden on mobile) */}
          <div className="hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-2 drop-shadow-sm">
              {subtitle}
            </p>
            <h1 className="font-sans text-5xl md:text-6xl font-black uppercase tracking-wide leading-[1.12] text-white drop-shadow-md">
              RIDING GEAR THAT<br />
              KEEPS YOU SAFE
            </h1>
          </div>

          {/* Desktop Button (Hidden on mobile) */}
          <Link
            href="/products"
            className="hidden lg:inline-flex mt-5 items-center gap-2 bg-banner text-white text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors self-start"
          >
            Shop Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Mobile Button: Glassmorphism, small, left-aligned, pushed to bottom (Hidden on desktop) */}
          <Link
            href="/products"
            className="lg:hidden mt-auto inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg hover:bg-white/30 transition-colors self-start"
          >
            Shop Now
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Right: Floating Cards — desktop only */}
        <div className="hidden lg:flex flex-col gap-5 items-end flex-shrink-0">
          {topProduct && <ProductCard product={topProduct} className="origin-bottom" />}
          {bottomProduct && <ProductCard product={bottomProduct} className="origin-top" />}
        </div>
      </div>


      {/* Slide indicator dots (mobile + desktop) */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
