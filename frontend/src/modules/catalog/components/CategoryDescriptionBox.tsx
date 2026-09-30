"use client";

import React, { useState } from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/solid";

interface CategoryDescriptionBoxProps {
  categoryName?: string;
  description?: string;
}

const DEFAULT_DESCRIPTION =
  "Explore premium motorcycle riding gloves engineered for ultimate road grip, impact protection, and all-weather comfort. Featuring CE-certified knuckle armor (D3O, TPU & Carbon Fiber), genuine goatskin leather, and high-abrasion SuperFabric palms. (Dummy).";

/**
 * CategoryDescriptionBox
 * 
 * 100% Googlebot & SEO Crawl Optimized:
 * 1. Full text is ALWAYS rendered in SSR initial HTML (never truncated on server).
 * 2. Uses CSS line-clamp on mobile with smooth transition.
 * 3. Orange "+ MORE VIEW" button smoothly expands full content.
 */
export const CategoryDescriptionBox: React.FC<CategoryDescriptionBoxProps> = ({
  categoryName = "Riding Gloves",
  description = DEFAULT_DESCRIPTION,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="w-full my-3 sm:my-4" aria-label={`About ${categoryName}`}>
      <div className="bg-[#f2f2f2] px-4 py-5 sm:px-10 sm:py-10 flex flex-col items-center justify-center w-full">
        {/* Category Description Text (SSR Rendered for Googlebot) */}
        <div className="max-w-4xl w-full mx-auto text-center">
          <p
            className={`text-[12px] sm:text-[15px] text-neutral-800 leading-relaxed font-sans transition-all duration-300 ${
              isExpanded ? "line-clamp-none" : "line-clamp-3"
            }`}
          >
            {description}
          </p>
        </div>

        {/* Orange MORE VIEW / LESS VIEW Action Button */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="mt-3 sm:mt-4 inline-flex items-center justify-center bg-[#E44B23] hover:bg-[#c93f1b] active:scale-95 text-white font-bold text-[10px] sm:text-[12px] uppercase tracking-wide px-3 py-1.5 sm:px-4 sm:py-2 rounded-[2px] transition-all cursor-pointer"
        >
          {isExpanded ? (
            <span>- LESS VIEW</span>
          ) : (
            <span>+ MORE VIEW</span>
          )}
        </button>
      </div>
    </section>
  );
};

export default CategoryDescriptionBox;
