"use client";

import React from "react";
import Image from "next/image";
import { HeroSectionProps } from "../types/homepage.types";
import ProductCard from "./ProductCard";

/**
 * HeroSection Component
 * 
 * Presentational Hero section matching the Figma design layout.
 * Features full background image, main title text on left, and two floating product cards on right.
 * 
 * @param {HeroSectionProps} props Props containing title, subtitle, background image, and products data.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  subtitle,
  title,
  bgImageUrl,
  featuredProducts,
}) => {
  const topProduct = featuredProducts[0];
  const bottomProduct = featuredProducts[1] || featuredProducts[0];

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex flex-col justify-between overflow-hidden bg-neutral-200">
      {/* Background Image with subtle warm overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImageUrl}
          alt="Hero background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Soft gradient overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-black/15 mix-blend-multiply pointer-events-none" />
      </div>

      {/* Hero Body Content */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between pb-16 pt-28 lg:pt-32 lg:pb-24">
        {/* Left Side Main Typography */}
        <div className="w-full lg:w-1/2 max-w-2xl text-white my-auto pt-8 lg:pt-0">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-white/90 mb-4 drop-shadow-sm">
            {subtitle}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] text-white drop-shadow-md">
            {title}
          </h1>
        </div>

        {/* Right Side Floating Product Cards matching Figma layout */}
        <div className="w-full lg:w-auto flex flex-col gap-6 lg:gap-8 items-end justify-center my-auto pt-10 lg:pt-0">
          {topProduct && (
            <ProductCard
              product={topProduct}
              imagePosition="left"
              className="lg:transform lg:translate-x-4 hover:translate-x-0"
            />
          )}

          {bottomProduct && (
            <ProductCard
              product={bottomProduct}
              imagePosition="right"
              className="lg:transform lg:-translate-x-4 hover:translate-x-0"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
