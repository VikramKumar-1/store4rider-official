"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HeroProductCardData } from "../types/homepage.types";

export interface ProductCardProps {
  /** Product data model */
  product: HeroProductCardData;
  /** Image positioning: left or right side of the card (matches Figma layout) */
  imagePosition?: "left" | "right";
  /** Optional custom CSS classes for positioning */
  className?: string;
}

/**
 * ProductCard Component
 * 
 * Floating hero product card matching the exact Figma design.
 * Features a split layout with product image on one side and product details (Title, Price, SHOP NOW) on the other.
 * 
 * @param {ProductCardProps} props Component properties
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = "",
}) => {
  return (
    <Link
      href={product.ctaUrl}
      className={`bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 flex items-center gap-4 w-[260px] md:w-[300px] group transition-transform duration-300 hover:-translate-y-1 will-change-transform border border-white/60 ${className}`}
    >
      {/* Clean Square Image Thumbnail */}
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-inner">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="100px"
          className="object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 py-1">
        <h3 className="font-sans font-bold text-sm md:text-[15px] text-neutral-900 leading-tight line-clamp-2">
          {product.title}
        </h3>
        <p className="text-banner font-extrabold text-xs md:text-sm mt-1.5">
          {product.priceFormatted}
        </p>
        
        <div className="mt-2 flex items-center gap-1 text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-wider group-hover:text-neutral-900 transition-colors">
          <span>{product.ctaText}</span>
          <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
