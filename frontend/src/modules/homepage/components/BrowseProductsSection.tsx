import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BrowseProductData } from "../types/homepage.types";

export interface BrowseProductsSectionProps {
  title: string;
  products: BrowseProductData[];
  showSeeMore?: boolean;
  mobileLayout?: "scroll" | "grid";
}

/**
 * GridProductCard Component
 */
const GridProductCard: React.FC<{ product: BrowseProductData; layout?: "scroll" | "grid" }> = ({ 
  product, 
  layout = "scroll" 
}) => {
  // Use fixed width for scrolling carousel, but full width for grid layout
  const containerClass = layout === "scroll" 
    ? "w-[140px] sm:w-[180px] lg:w-auto flex-shrink-0 sm:flex-shrink" 
    : "w-full";

  return (
    <div className={`flex flex-col group cursor-pointer ${containerClass}`}>
      {/* Edge-to-edge Image Container */}
      <div className="relative aspect-[4/5] w-full bg-white overflow-hidden mb-2 md:mb-3 group/image flex items-center justify-center">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform p-2"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* Solid Orange Rating Badge */}
        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-[#FF5429] text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10 shadow-sm">
          <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-white fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {product.rating.toFixed(2).replace(/\.?0+$/, '')}
        </div>

        {/* Hover "Add to Cart" Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto bg-black/5 z-20 hidden lg:flex">
          <button className="bg-white/95 hover:bg-white text-neutral-900 w-[85%] py-2.5 rounded flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out">
            ADD TO CART
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col space-y-0.5 md:space-y-1 mt-1">
        <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-neutral-400 font-sans font-bold">
          {product.category || "PRODUCT CATEGORY"}
        </span>
        <h3 className="font-sans font-bold text-[12px] md:text-[15px] text-neutral-900 line-clamp-1 leading-tight">
          {product.name}
        </h3>
        <span className="text-[10px] md:text-xs text-neutral-500 font-sans font-semibold tracking-wide">
          {product.priceFormatted}
        </span>
      </div>
    </div>
  );
};

/**
 * BrowseProductsSection Component
 */
export const BrowseProductsSection: React.FC<BrowseProductsSectionProps> = ({
  title,
  products,
  showSeeMore = false,
  mobileLayout = "scroll"
}) => {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-16 bg-white overflow-hidden">
      {/* Title */}
      <div className="text-center mb-5 md:mb-12 px-2">
        <h2 className="font-sans text-[16px] min-[375px]:text-[18px] sm:text-2xl md:text-3xl lg:text-[40px] font-extrabold text-neutral-900 uppercase tracking-wide md:tracking-wider leading-tight">
          {title}
        </h2>
        <div className="w-10 md:w-16 h-1 bg-banner mx-auto mt-2 md:mt-4 rounded-full"></div>
      </div>

      {/* Products Row/Grid */}
      <div className={mobileLayout === "scroll" ? "-mx-4 px-4 sm:mx-0 sm:px-0" : ""}>
        <div className={
          mobileLayout === "scroll" 
            ? "flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 hide-scrollbar"
            : "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
        }>
          {products.map((product) => (
            <Link key={product.id} href={product.productUrl} className={mobileLayout === "scroll" ? "block snap-start" : "block"}>
              <GridProductCard product={product} layout={mobileLayout} />
            </Link>
          ))}
        </div>
      </div>

      {/* Conditional See More Button */}
      {showSeeMore && (
        <div className="mt-8 md:mt-12 flex justify-center">
          <Link
            href="/products?q=touring"
            className="bg-banner text-white px-8 md:px-12 py-3 md:py-3.5 text-xs sm:text-sm font-semibold tracking-[0.2em] shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-300 rounded-sm"
          >
            SEE MORE
          </Link>
        </div>
      )}

      {/* Add custom CSS to hide scrollbar but keep functionality */}
      {mobileLayout === "scroll" && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `
        }} />
      )}
    </section>
  );
};

export default BrowseProductsSection;
