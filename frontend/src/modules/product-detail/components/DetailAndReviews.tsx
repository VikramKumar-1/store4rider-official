"use client";

import React from "react";
import { ReviewData } from "../types/product-detail.types";

/**
 * DetailAndReviews Component
 * 
 * Renders a 2-column layout matching client's mockup:
 * - Left: "PRODUCT DETAIL DESCRIPTION" with full HTML content
 * - Right: "PRODUCT REVIEWS" with review cards (placeholder boxes if empty)
 */
export const DetailAndReviews: React.FC<{ fullDescription: string; reviews: ReviewData[] }> = ({ fullDescription, reviews }) => {
  // Parse Magento media URLs to S3 URLs
  const parsedDescription = fullDescription
    ? fullDescription.replace(
        /\{\{media\s+url="([^"]+)"\}\}/g,
        (match, p1) => `https://store4riders.s3.ap-south-2.amazonaws.com/${encodeURI(p1.trim())}`
      )
    : "";

  return (
    <div className="w-full mt-10 md:mt-14 border-t border-neutral-200 pt-8 md:pt-10 px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16">
        
        {/* Left Column: Product Detail Description */}
        <div className="flex flex-col gap-5">
          <h2 className="font-sans text-lg md:text-xl font-extrabold uppercase tracking-widest text-neutral-900">
            Product Detail Description
          </h2>
          
          <div 
            className="magento-layout text-neutral-600 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parsedDescription || "<p class='text-neutral-400 italic'>No description available.</p>" }}
          />
        </div>

        {/* Right Column: Product Reviews */}
        <div className="flex flex-col gap-5">
          <h2 className="font-sans text-lg md:text-xl font-extrabold uppercase tracking-widest text-neutral-900">
            Product Reviews
          </h2>
          
          <div className="flex flex-col gap-4">
            {reviews && reviews.length > 0 ? (
              reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="border border-neutral-200 rounded-sm p-4 md:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-neutral-800 text-sm">{review.author}</span>
                    <span className="text-xs text-neutral-400">{review.date}</span>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {review.text}
                  </p>
                </div>
              ))
            ) : (
              /* Empty review placeholders matching mockup wireframe boxes */
              <>
                <div className="border border-neutral-200 rounded-sm aspect-[3/1] flex items-center justify-center">
                  <span className="text-xs text-neutral-300 italic">No reviews yet</span>
                </div>
                <div className="border border-neutral-200 rounded-sm aspect-[3/1] flex items-center justify-center">
                  <span className="text-xs text-neutral-300 italic"></span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
