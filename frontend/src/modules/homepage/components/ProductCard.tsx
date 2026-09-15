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
  imagePosition = "left",
  className = "",
}) => {
  const isImageLeft = imagePosition === "left";

  const imageSection = (
    <div className="w-1/2 relative bg-neutral-100 min-h-[140px] overflow-hidden flex items-center justify-center p-2">
      <Image
        src={product.imageUrl}
        alt={product.title}
        fill
        sizes="(max-width: 768px) 150px, 200px"
        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
      />
    </div>
  );

  const contentSection = (
    <div className="w-1/2 p-5 flex flex-col justify-between text-neutral-800 bg-white">
      <div>
        <h3 className="font-serif text-base md:text-lg font-normal tracking-wide text-neutral-900 leading-snug">
          {product.title}
        </h3>
        <p className="text-xs text-neutral-500 font-sans mt-2 tracking-wider">
          {product.priceFormatted}
        </p>
      </div>

      <div className="mt-4">
        <Link
          href={product.ctaUrl}
          className="inline-block text-xs font-semibold text-neutral-900 uppercase tracking-widest border-b border-neutral-900 pb-0.5 hover:text-amber-800 hover:border-amber-800 transition-colors"
        >
          {product.ctaText}
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white shadow-xl rounded-none overflow-hidden flex w-[320px] md:w-[360px] group transition-all duration-300 hover:shadow-2xl ${className}`}
    >
      {isImageLeft ? (
        <>
          {imageSection}
          {contentSection}
        </>
      ) : (
        <>
          {contentSection}
          {imageSection}
        </>
      )}
    </div>
  );
};

export default ProductCard;
