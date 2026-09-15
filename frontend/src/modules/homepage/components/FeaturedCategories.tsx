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
        className="object-cover object-center group-hover:scale-105 group-hover:opacity-90 transition-all duration-700 ease-in-out"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {/* Subtle overlay gradient to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
      
      {/* Category Text matching Figma design (center-left alignment, large serif font) */}
      <div className="absolute inset-0 flex items-center p-8 md:p-12">
        <h2 className="font-serif text-3xl md:text-5xl text-white drop-shadow-md tracking-wider">
          {data.title}
        </h2>
      </div>
    </Link>
  );
};

/**
 * FeaturedCategories Component
 * 
 * Presentational component matching the asymmetrical masonry grid layout from Figma.
 * - Left column contains two stacked rectangles (Helmets, Gloves).
 * - Right column contains one tall rectangle spanning full height (Jackets).
 */
export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ categories }) => {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-h-[600px] md:min-h-[700px]">
        
        {/* Left Column (Two Stacked Items) */}
        <div className="flex flex-col gap-4 md:gap-6 h-full">
          <CategoryCard
            data={categories.helmets}
            className="flex-1 min-h-[300px]"
          />
          <CategoryCard
            data={categories.gloves}
            className="flex-1 min-h-[300px]"
          />
        </div>

        {/* Right Column (One Tall Item) */}
        <div className="h-full">
          <CategoryCard
            data={categories.jackets}
            className="h-full min-h-[400px]"
          />
        </div>

      </div>

      {/* See More / View All Button */}
      <div className="mt-12 flex justify-center">
        <button className="bg-banner text-white px-10 py-3.5 text-sm font-semibold tracking-[0.2em] shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-300 rounded-sm">
          SEE ALL CATEGORIES
        </button>
      </div>
    </section>
  );
};

export default FeaturedCategories;
