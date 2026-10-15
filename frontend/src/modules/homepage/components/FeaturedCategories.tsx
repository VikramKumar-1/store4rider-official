"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CategoryCardData } from "../types/homepage.types";

export interface FeaturedCategoriesProps {
  title?: string;
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
      className={`group relative overflow-hidden block w-full bg-neutral-900 rounded-lg ${className}`}
    >
      <Image
        src={data.imageUrl}
        alt={data.title}
        fill
        className="object-cover object-center scale-100 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700 ease-in-out"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />

      {/* Glassmorphism Title Badge */}
      <div className="absolute bottom-2 left-2 md:bottom-5 md:left-5 right-2 md:right-auto flex items-center justify-start pointer-events-none">
        <div className="bg-neutral-900/40 backdrop-blur-md border border-white/30 shadow-lg rounded-md md:rounded-xl px-2 py-1 md:px-5 md:py-2.5 flex items-center gap-1.5 md:gap-3 group-hover:bg-neutral-900/60 group-hover:border-white/50 transition-all duration-300">
          <h3 className="font-sans font-bold text-[9px] min-[375px]:text-[10px] sm:text-xs md:text-sm lg:text-base text-white tracking-[0.08em] uppercase drop-shadow-md">
            {data.title}
          </h3>
          <div className="w-3.5 h-3.5 md:w-6 md:h-6 rounded-full bg-white/30 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors duration-300">
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
 * Asymmetric masonry grid (Helmets + Gloves stacked left, Jackets full-height right)
 * Sized comfortably with clean unzoomed aspect.
 */
export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ title = "SHOP BY CATEGORY", categories }) => {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-14 bg-white overflow-hidden">
      {/* Section Title */}
      <div className="text-center mb-6 md:mb-12 px-4">
        <h2 className="font-sans text-xl min-[375px]:text-2xl sm:text-3xl lg:text-[38px] xl:text-[40px] font-extrabold text-neutral-900 uppercase tracking-wide md:tracking-wider leading-tight">
          {title}
        </h2>
        <div className="w-12 md:w-16 h-1 bg-banner mx-auto mt-2.5 md:mt-4 rounded-full" />
      </div>

      {/* Asymmetric masonry grid — compact and unzoomed */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 h-[220px] min-[375px]:h-[240px] sm:h-[340px] md:h-[440px] lg:h-[480px]">
        {/* Left Column: two stacked */}
        <div className="flex flex-col gap-2 sm:gap-4 md:gap-6 h-full">
          <CategoryCard data={categories.helmets} className="flex-1 min-h-0 rounded-lg" />
          <CategoryCard data={categories.gloves} className="flex-1 min-h-0 rounded-lg" />
        </div>
        {/* Right Column: one tall */}
        <div className="h-full">
          <CategoryCard data={categories.jackets} className="h-full min-h-0 rounded-lg" />
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
