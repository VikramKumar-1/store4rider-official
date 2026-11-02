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
  slides,
  showOverlay = true,
  featuredProducts,
  ctaText = "Shop Now",
  ctaLink = "/products",
}) => {
  const topProduct = featuredProducts[0];
  const bottomProduct = featuredProducts[1] || featuredProducts[0];

  // Resolve slides: use slides if available, else derive from bgImageUrls or bgImageUrl
  const resolvedSlides = React.useMemo(() => {
    const isGlobalOverlayOn = showOverlay !== false;

    if (slides && slides.length > 0) {
      return slides.map((s, idx) => ({
        ...s,
        id: s.id || `slide-${idx + 1}`,
        showOverlay: isGlobalOverlayOn && s.showOverlay !== false,
      }));
    }
    const imgs = bgImageUrls && bgImageUrls.length > 0 ? bgImageUrls : [bgImageUrl];
    return imgs.map((src, idx) => ({
      id: `slide-${idx + 1}`,
      imageUrl: src,
      title: title || "RIDING GEAR THAT KEEPS YOU SAFE",
      subtitle: subtitle || "BROWSE THE COLLECTION",
      ctaText: ctaText || "Shop Now",
      ctaLink: ctaLink || "/products",
      showOverlay: isGlobalOverlayOn,
    }));
  }, [slides, bgImageUrls, bgImageUrl, title, subtitle, ctaText, ctaLink, showOverlay]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (resolvedSlides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % resolvedSlides.length);
    }, 6000); // 6 seconds - balanced speed
    return () => clearInterval(interval);
  }, [resolvedSlides.length, isPaused]);

  const handlePrevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + resolvedSlides.length) % resolvedSlides.length);
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % resolvedSlides.length);
  };

  const currentSlide = resolvedSlides[currentImageIndex] || resolvedSlides[0];
  const isOverlayVisible = Boolean(currentSlide?.showOverlay);
  const activeSubtitle = currentSlide?.subtitle !== undefined ? currentSlide.subtitle : subtitle;
  const activeTitle = currentSlide?.title || title || "RIDING GEAR THAT KEEPS YOU SAFE";
  const activeCtaText = currentSlide?.ctaText || ctaText || "Shop Now";
  const activeCtaLink = currentSlide?.ctaLink || ctaLink || "/products";

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[320px] lg:h-[100svh] lg:min-h-[600px] flex flex-col justify-between overflow-hidden bg-neutral-900"
    >
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        {resolvedSlides.map((slide, index) => {
          if (index > 0 && !hasMounted) return null;

          const slideHref = slide.ctaLink || activeCtaLink || "/products";

          return (
            <Link
              key={slide.imageUrl + index}
              href={slideHref}
              aria-label={slide.title || `Hero banner ${index + 1}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out block ${
                index === currentImageIndex ? "opacity-100 pointer-events-auto cursor-pointer" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.title ? `Hero background: ${slide.title}` : `Hero background ${index + 1}`}
                fill
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "low"}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1400px"
                className="object-cover object-[center_30%] lg:object-center"
              />
            </Link>
          );
        })}

        {/* Mobile: stronger gradient for text legibility | Desktop: light overlay */}
        <div className="absolute inset-0 pointer-events-none z-10
          bg-gradient-to-t from-black/65 via-black/20 to-transparent
          lg:bg-black/15 lg:mix-blend-multiply"
        />
      </div>

      {/* ── Hero Body — row on desktop, column on mobile (pointer-events-none allows clicks through to background link) ── */}
      <div className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-12
        flex flex-col lg:flex-row items-start lg:items-center justify-end lg:justify-between
        pb-5 pt-20 lg:pt-36 lg:pb-24 gap-4 lg:gap-6 pointer-events-none"
      >
        {/* Left: Text */}
        <div className="flex-1 min-w-0 flex flex-col h-full justify-end pointer-events-none">
          
          {/* Modern Compact Glassmorphic Hero Text Card (Desktop) */}
          {isOverlayVisible ? (
            <div className="hidden lg:flex flex-col max-w-sm xl:max-w-md w-fit bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 shadow-xl ring-1 ring-white/10 transition-all duration-300 pointer-events-auto">
              {activeSubtitle && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-white/90 mb-2 self-start transition-opacity duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-banner shadow-[0_0_6px_rgba(255,84,41,0.8)]" />
                  <span>{activeSubtitle}</span>
                </div>
              )}
              <h1 className="font-sans text-lg sm:text-xl xl:text-2xl font-bold uppercase tracking-tight leading-snug text-white transition-opacity duration-300">
                {activeTitle}
              </h1>

              {/* Desktop Button */}
              <Link
                href={activeCtaLink}
                className="mt-3.5 inline-flex items-center gap-1.5 bg-banner hover:bg-orange-600 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 group self-start"
              >
                <span>{activeCtaText}</span>
                <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : null}

          {/* Mobile Button: small, left-aligned, pushed to bottom (Hidden on desktop) */}
          {isOverlayVisible && (
            <Link
              href={activeCtaLink}
              className="lg:hidden mt-auto inline-flex items-center gap-1.5 bg-banner hover:bg-orange-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg transition-colors self-start pointer-events-auto"
            >
              {activeCtaText}
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Right: Floating Cards — desktop only */}
        <div className="hidden lg:flex flex-col gap-5 items-end flex-shrink-0 pointer-events-auto">
          {topProduct && <ProductCard product={topProduct} className="origin-bottom" />}
          {bottomProduct && <ProductCard product={bottomProduct} className="origin-top" />}
        </div>
      </div>


      {/* Navigation Arrows (Prev / Next) */}
      {resolvedSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous slide"
            className="absolute left-2.5 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg cursor-pointer group focus:outline-hidden"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next slide"
            className="absolute right-2.5 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white border border-white/25 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg cursor-pointer group focus:outline-hidden"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide indicator dots (mobile + desktop) — tap target padded to 44px for accessibility */}
      {resolvedSlides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-0.5 items-center pointer-events-auto">
          {resolvedSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              suppressHydrationWarning
              onClick={() => setCurrentImageIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="py-3 px-1.5 flex items-center justify-center cursor-pointer focus:outline-hidden"
            >
              <span
                className={`h-1.5 rounded-full transition-all duration-300 block ${
                  idx === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
