"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CategoryCardData } from "../types/homepage.types";

export interface FeaturedCategoriesProps {
  categories: {
    helmets: CategoryCardData;
    gloves: CategoryCardData;
    jackets: CategoryCardData;
  };
}

/**
 * CategoryCard Internal Component
 * Renders an individual category image block with text overlay.
 */
const CategoryCard: React.FC<{ data: CategoryCardData; className?: string }> = ({
  data,
  className = "",
}) => {
  return (
    <Link
      href={data.linkUrl}
      className={`group relative overflow-hidden block w-full bg-neutral-900 ${className}`}
    >
      <Image
        src={data.imageUrl}
        alt={data.title}
        fill
        className="object-cover object-center scale-[1.05] group-hover:scale-[1.10] group-hover:opacity-90 transition-all duration-700 ease-in-out"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {/* Removing full gradient overlay, keeping image clean */}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />

      {/* Glassmorphism Title Badge */}
      <div className="absolute bottom-2 left-2 md:bottom-6 md:left-6 right-2 md:right-auto flex items-center justify-start pointer-events-none">
        <div className="bg-white/10 backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg md:rounded-xl px-2 py-1 md:px-6 md:py-3 flex items-center gap-1.5 md:gap-3 group-hover:bg-white/20 group-hover:border-white/50 transition-all duration-300">
          <h2 className="font-sans font-bold text-[8px] min-[375px]:text-[9px] sm:text-xs md:text-base text-white tracking-[0.1em] uppercase drop-shadow-md">
            {data.title}
          </h2>
          <div className="w-3 h-3 md:w-7 md:h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white transition-colors duration-300">
            <svg className="w-2 h-2 md:w-3 md:h-3 text-white group-hover:text-black transform group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * FeaturedCategories Component
 *
 * MOBILE & DESKTOP — Asymmetric masonry grid (Figma layout)
 * - Left column has Helmets + Gloves stacked
 * - Right column has Jackets full height
 */
export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ categories }) => {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Section Title */}
      <div className="text-center mb-6 md:mb-14">
        <h2 className="font-sans text-[16px] min-[375px]:text-[18px] sm:text-2xl md:text-3xl lg:text-[40px] font-extrabold text-neutral-900 uppercase tracking-wide md:tracking-wider whitespace-nowrap">
          SHOP BY CATEGORY
        </h2>
        <div className="w-10 md:w-16 h-1 bg-banner mx-auto mt-2 md:mt-4 rounded-full" />
      </div>

      {/* Asymmetric masonry grid — both Mobile & Desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 h-[260px] sm:h-[400px] md:h-[620px]">
        {/* Left Column: two stacked */}
        <div className="flex flex-col gap-2 sm:gap-4 md:gap-6 h-full">
          <CategoryCard data={categories.helmets} className="flex-1 min-h-0 rounded-sm md:rounded-none" />
          <CategoryCard data={categories.gloves} className="flex-1 min-h-0 rounded-sm md:rounded-none" />
        </div>
        {/* Right Column: one tall */}
        <div className="h-full">
          <CategoryCard data={categories.jackets} className="h-full min-h-0 rounded-sm md:rounded-none" />
        </div>
      </div>

    </section>
  );
};

export default FeaturedCategories;
