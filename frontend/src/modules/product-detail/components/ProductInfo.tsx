"use client";

import React, { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { ColorOption } from "../types/product-detail.types";

interface ProductInfoProps {
  category: string;
  rating: number;
  name: string;
  originalPriceFormatted?: string;
  discountBadge?: string;
  priceFormatted: string;
  shortDescription: string;
  colors?: ColorOption[];
  sizes?: string[];
  selectedColor?: string;
  selectedSize?: string;
  disabledColors?: string[];
  disabledSizes?: string[];
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  category,
  rating,
  name,
  originalPriceFormatted,
  discountBadge,
  priceFormatted,
  shortDescription,
  colors,
  sizes,
  selectedColor,
  selectedSize,
  disabledColors = [],
  disabledSizes = [],
  onColorChange,
  onSizeChange,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const descRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    if (descRef.current) {
      // Check if the scrollHeight (total text height) is greater than clientHeight (visible height clamped to 3 lines)
      if (descRef.current.scrollHeight > descRef.current.clientHeight) {
        setShowReadMore(true);
      }
    }
  }, [shortDescription]);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header: Rating Only */}
      <div className="flex items-center justify-end">
        {rating > 0 ? (
          <div className="flex items-center gap-1 bg-yellow-100/50 px-1.5 py-0.5 rounded-sm">
            <StarIcon className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="text-[11px] font-bold text-neutral-700">{rating.toFixed(1)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-widest cursor-pointer hover:text-brand transition-colors group">
            <StarIcon className="w-3 h-3 text-neutral-300 group-hover:text-amber-400 transition-colors" />
            <span>Be the first to review</span>
          </div>
        )}
      </div>

      {/* Title (Max 3 lines, shows full on hover) */}
      <h1 
        title={name} 
        className="font-sans font-extrabold text-lg md:text-2xl uppercase tracking-tight text-neutral-900 leading-tight line-clamp-3 cursor-help"
      >
        {name}
      </h1>

      {/* Pricing (Side by Side) */}
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="font-sans font-extrabold text-brand text-xl">
          {priceFormatted}
        </span>
        {originalPriceFormatted && discountBadge && (
          <>
            <span className="text-neutral-400 line-through text-sm font-medium">
              {originalPriceFormatted}
            </span>
            <span className="bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm relative -top-0.5">
              {discountBadge} OFF
            </span>
          </>
        )}
      </div>

      {/* Trust Badges - Inline directly beneath Price as per client request */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 mb-1">
        {/* 100% Genuine */}
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-bold text-neutral-600">100% Genuine</span>
        </div>

        {/* EMI Available */}
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-500">
            <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15Z" />
            <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5Zm-18 3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-bold text-neutral-600">EMI available</span>
        </div>

        {/* Easy Exchange */}
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-600">
            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-bold text-neutral-600">Easy exchange</span>
        </div>

        {/* Free Shipping */}
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 256 256" fill="currentColor" className="w-4 h-4 text-emerald-600">
            <path d="M244.8,111.37l-25-35.75A15.91,15.91,0,0,0,206.67,69.5H176V56a16,16,0,0,0-16-16H24A16,16,0,0,0,8,56V184a16,16,0,0,0,16,16H42.79a32,32,0,1,0,58.42,0h53.58a32,32,0,1,0,58.42,0H232a16,16,0,0,0,16-16V117.8A16,16,0,0,0,244.8,111.37ZM72,216a16,16,0,1,1,16-16A16,16,0,0,1,72,216Zm112,0a16,16,0,1,1,16-16A16,16,0,0,1,184,216Zm48-32H213.21a32,32,0,1,0-58.42,0H176V85.5h30.67l25.33,36.19Z"/>
          </svg>
          <span className="text-[10px] font-bold text-neutral-600">Free shipping</span>
        </div>
      </div>

      {/* Short Description (Collapsible) */}
      {shortDescription && (
        <div className="mt-2 relative">
          <p 
            ref={descRef}
            className={`text-neutral-500 text-xs md:text-sm leading-relaxed font-sans ${isDescExpanded ? "" : "line-clamp-3"}`}
          >
            {shortDescription}
          </p>
          {showReadMore && (
            <button 
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="mt-1 text-[10px] font-extrabold text-neutral-900 uppercase tracking-wide hover:text-brand transition-colors flex items-center gap-1"
            >
              {isDescExpanded ? "READ LESS" : "READ MORE"}
            </button>
          )}
        </div>
      )}

      {/* Color Selector (Mobile only, hidden on desktop since it's in the sticky bar) */}
      {colors && colors.length > 0 && (
        <div className="flex md:hidden flex-col gap-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
            <span>Color:</span>
            <span className="text-neutral-900 font-extrabold">{selectedColor || colors[0].name}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {colors.map((colorObj, idx) => {
              const isSelected = selectedColor === colorObj.name;
              const isDisabled = disabledColors.includes(colorObj.name);
              return (
                <button
                  key={`info-color-${idx}-${colorObj.name}`}
                  onClick={() => !isDisabled && onColorChange && onColorChange(colorObj.name)}
                  disabled={isDisabled}
                  className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                    isSelected
                      ? "border-orange-600 scale-110 ring-2 ring-orange-400/40 ring-offset-2 z-10"
                      : "border-neutral-300 hover:border-neutral-500 opacity-80 hover:opacity-100"
                  } ${isDisabled ? "opacity-30 cursor-not-allowed hover:border-neutral-300 hover:opacity-30" : ""}`}
                  style={{ background: colorObj.background }}
                  title={isDisabled ? `${colorObj.name} - Out of Stock` : colorObj.name}
                  aria-label={colorObj.name}
                >
                  {isDisabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-neutral-400 rotate-45 transform origin-center" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selector (Mobile only, hidden on desktop since it's in the sticky bar) */}
      {sizes && sizes.length > 0 && sizes[0] !== "One Size" && (
        <div className="flex md:hidden flex-col gap-2 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-600">
            <div className="flex items-center gap-2">
              <span>Size (EU):</span>
              <span className="text-neutral-900 font-extrabold">{selectedSize || sizes[0]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              const isDisabled = disabledSizes.includes(size);
              return (
                <button
                  key={`info-size-${size}`}
                  onClick={() => !isDisabled && onSizeChange && onSizeChange(size)}
                  disabled={isDisabled}
                  title={isDisabled ? "Out of stock for this color" : ""}
                  className={`min-w-[40px] h-9 px-3 text-xs font-bold rounded-sm border transition-all ${
                    isDisabled 
                      ? "border-neutral-200 text-neutral-400 bg-neutral-100/50 cursor-not-allowed line-through"
                      : isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                      : "border-neutral-200 text-neutral-700 bg-white hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
