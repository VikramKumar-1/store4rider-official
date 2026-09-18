"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BrowseProductData } from "../types/homepage.types";

export interface BrowseProductsSectionProps {
  title: string;
  products: BrowseProductData[];
}

import { ShoppingCartIcon } from "@heroicons/react/24/solid";

/**
 * GridProductCard Component
 * Internal component to render individual product cards within the grid.
 * Features a hover effect that reveals the "ADD TO CART" button.
 */
const GridProductCard: React.FC<{ product: BrowseProductData }> = ({ product }) => {
  return (
    <div className="flex flex-col group cursor-pointer h-full">
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-white rounded-xl overflow-hidden mb-2 group/image border border-neutral-100 p-2">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform p-4"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Sleek Liquid Glassmorphism Rating Badge */}
        <div className="absolute top-2 right-2 bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-neutral-900 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10 transition-transform hover:scale-105">
          <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {product.rating.toFixed(1)}
        </div>

        {/* Hover "Add to Cart" Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto bg-black/5 z-20">
          <button className="bg-neutral-900/90 backdrop-blur-sm hover:bg-banner text-white w-[85%] py-2.5 rounded-full flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold tracking-[0.15em] shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out">
            ADD TO CART <ShoppingCartIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Details - Tighter Spacing */}
      <div className="flex flex-col space-y-0.5 px-0.5">
        <span className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-bold font-sans">
          {product.category}
        </span>
        <h3 className="font-sans font-semibold text-[13px] md:text-[14px] text-neutral-900 group-hover:text-banner transition-colors line-clamp-1 leading-tight">
          {product.name}
        </h3>
        <span className="text-xs md:text-[13px] text-brand font-extrabold tracking-wide mt-0.5">
          {product.priceFormatted}
        </span>
      </div>
    </div>
  );
};

/**
 * BrowseProductsSection Component
 * 
 * Renders a 4-column grid of products with a large serif heading.
 * The "SEE MORE" button appears dynamically when hovering over an individual product card.
 */
export const BrowseProductsSection: React.FC<BrowseProductsSectionProps> = ({
  title,
  products,
}) => {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-10 bg-white">
      {/* Title */}
      <div className="text-center mb-10 md:mb-14">
        <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 uppercase tracking-wide">
          {title}
        </h2>
        <div className="w-16 h-1 bg-banner mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-8">
        {products.map((product) => (
          <Link key={product.id} href={product.productUrl} className="block">
            <GridProductCard product={product} />
          </Link>
        ))}
      </div>

      {/* See More / View All Button */}
      <div className="mt-12 flex justify-center">
        <button className="bg-banner text-white px-10 py-3.5 text-sm font-semibold tracking-[0.2em] shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-300 rounded-sm">
          SEE MORE
        </button>
      </div>
    </section>
  );
};

export default BrowseProductsSection;
