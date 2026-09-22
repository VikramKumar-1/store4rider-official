"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { HeroSectionProps } from "../types/homepage.types";
import ProductCard from "./ProductCard";

/**
 * HeroSection Component
 * 
 * Presentational Hero section matching the Figma design layout.
 * Features full background image slider, main title text on left, and two floating product cards on right.
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
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] flex flex-col justify-between overflow-hidden bg-neutral-900">
      {/* Background Image Slider with subtle warm overlay */}
      <div className="absolute inset-0 z-0">
        {images.map((src, index) => (
          <div 
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src={src}
              alt={`Hero background ${index + 1}`}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-[center_30%] md:object-center"
            />
          </div>
        ))}
        {/* Soft gradient overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-black/15 mix-blend-multiply pointer-events-none z-10" />
      </div>

      {/* Hero Body Content matching Figma */}
      <div className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between pb-16 pt-24 md:pt-32 lg:pt-40 lg:pb-24 gap-8 lg:gap-4">
        
        {/* Left Side Main Typography */}
        <div className="w-full text-center lg:text-left pt-4 lg:pt-0">
          <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] text-white/90 mb-3 drop-shadow-sm">
            {subtitle}
          </p>
          <h1 className="font-sans text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wide leading-[1.12] text-white drop-shadow-md max-w-xl mx-auto lg:mx-0">
            RIDING GEAR THAT<br />
            KEEPS YOU SAFE
          </h1>
        </div>

        {/* Right Side Floating Product Cards */}
        <div className="w-full lg:w-auto flex flex-col gap-3 lg:gap-5 items-center lg:items-end lg:justify-center">
          {topProduct && (
            <ProductCard
              product={topProduct}
              className="lg:mr-0 scale-90 sm:scale-100 origin-bottom"
            />
          )}

          {bottomProduct && (
            <ProductCard
              product={bottomProduct}
              className="lg:mr-0 scale-90 sm:scale-100 origin-top" 
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
