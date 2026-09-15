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
      <div className="relative aspect-[3/4] w-full bg-neutral-50 overflow-hidden mb-4 group/image">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain p-3 group-hover:scale-105 transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-banner text-banner-text text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm z-10">
          <span className="text-white text-[9px]">★</span>
          {product.rating.toFixed(2)}
        </div>

        {/* Hover "Add to Cart" Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none group-hover:pointer-events-auto bg-black/20 z-20 backdrop-blur-[2px]">
          <button className="bg-banner hover:bg-orange-600 text-white w-[85%] py-3.5 rounded-md flex items-center justify-center gap-2 text-xs md:text-sm font-semibold tracking-wider shadow-xl translate-y-6 group-hover:translate-y-0 transition-all duration-400 ease-out">
            ADD TO CART <ShoppingCartIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col space-y-1">
        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-sans">
          {product.category}
        </span>
        <h3 className="font-serif text-lg md:text-xl text-neutral-900 group-hover:text-amber-800 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <span className="text-[10px] text-neutral-400 font-sans tracking-wide">
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
      <div className="text-center mb-12 md:mb-16">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-neutral-800 uppercase tracking-wide">
          {title}
        </h2>
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
