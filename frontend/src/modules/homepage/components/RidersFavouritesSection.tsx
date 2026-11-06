"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  RidersFavouritesProductData,
  RidersFavouritesSectionProps,
} from "../types/homepage.types";

/**
 * Default placeholder items matching the exact 4 cards in the design.
 */
const DEFAULT_PLACEHOLDER_PRODUCTS: RidersFavouritesProductData[] = [
  {
    id: "fav-placeholder-1",
    name: "[PRODUCT NAME]",
    brand: "[BRAND]",
    priceFormatted: "[PRICE]",
    productUrl: "/products",
  },
  {
    id: "fav-placeholder-2",
    name: "[PRODUCT NAME]",
    brand: "[BRAND]",
    priceFormatted: "[PRICE]",
    productUrl: "/products",
  },
  {
    id: "fav-placeholder-3",
    name: "[PRODUCT NAME]",
    brand: "[BRAND]",
    priceFormatted: "[PRICE]",
    productUrl: "/products",
  },
  {
    id: "fav-placeholder-4",
    name: "[PRODUCT NAME]",
    brand: "[BRAND]",
    priceFormatted: "[PRICE]",
    productUrl: "/products",
  },
];

/**
 * RidersFavouritesSection Component
 *
 * Renders exactly 4 real best-seller products:
 * - 2by2 grid on mobile (grid-cols-2), 4 columns on desktop (lg:grid-cols-4).
 * - Exact same card size, aspect ratio, badges, and layout as BrowseProductsSection.
 * - Store4Riders brand & banner theme colors.
 */
export const RidersFavouritesSection: React.FC<RidersFavouritesSectionProps> = ({
  title = "RIDERS' FAVOURITES",
  subtitle = "",
  products,
  className = "",
}) => {
  const displayProducts =
    products && products.length > 0
      ? products.slice(0, 4)
      : DEFAULT_PLACEHOLDER_PRODUCTS;

  return (
    <section className={`w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-14 bg-white ${className}`}>
      {/* Section Header matching other sections */}
      <div className="text-center mb-6 md:mb-12 px-0 sm:px-4">
        <h2 className="font-sans text-[14px] min-[360px]:text-[15.5px] min-[390px]:text-[17px] sm:text-2xl md:text-3xl lg:text-[38px] xl:text-[40px] font-extrabold text-neutral-900 uppercase tracking-tight sm:tracking-wide md:tracking-wider leading-tight">
          {title}
        </h2>
        <div className="w-10 sm:w-12 md:w-16 h-0.5 sm:h-1 bg-banner mx-auto mt-2 sm:mt-2.5 md:mt-4 rounded-full" />
        {subtitle && (
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-neutral-600 font-medium max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* 2by2 on mobile (grid-cols-2), 4 columns on desktop (lg:grid-cols-4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {displayProducts.map((product) => {
          const isPlaceholder = product.name === "[PRODUCT NAME]";

          return (
            <Link
              key={product.id}
              href={product.productUrl || "/products"}
              className="flex flex-col group cursor-pointer w-full h-full"
            >
              {/* Image Container matching exact site card size */}
              <div className="relative aspect-square w-full bg-[#f4f4f4] overflow-hidden mb-2 md:mb-3 group/image flex items-center justify-center rounded-lg">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center px-3 text-center"
                    style={{
                      background:
                        "repeating-linear-gradient(-45deg, #e5e0d7, #e5e0d7 12px, #f3efe8 12px, #f3efe8 24px)",
                    }}
                  >
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#797267] uppercase select-none drop-shadow-sm">
                      PRODUCT PHOTO
                    </span>
                  </div>
                )}

                {/* Solid Orange Rating Badge */}
                <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-banner text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10 shadow-sm">
                  <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-white fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>4.8</span>
                </div>

                {/* Hover "Add to Cart" Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto bg-black/5 z-20 hidden lg:flex">
                  <span className="bg-banner hover:bg-orange-600 text-white w-[85%] py-2.5 rounded flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out select-none">
                    ADD TO CART
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="flex flex-col space-y-0.5 md:space-y-1 mt-1">
                {product.brand && (
                  <span className="text-[10px] md:text-xs font-bold text-banner uppercase tracking-wider">
                    {product.brand}
                  </span>
                )}
                <h3
                  className={`font-sans font-bold text-[12px] md:text-[14px] text-neutral-900 line-clamp-1 leading-tight group-hover:text-banner transition-colors ${
                    isPlaceholder ? "tracking-widest" : ""
                  }`}
                >
                  {product.name}
                </h3>
                <span className="text-[11px] md:text-sm text-neutral-900 font-sans font-bold tracking-wide">
                  {product.priceFormatted}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default RidersFavouritesSection;
