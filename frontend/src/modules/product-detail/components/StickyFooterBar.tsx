"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCartIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { ColorOption } from "../types/product-detail.types";

interface StickyFooterBarProps {
  productName: string;
  priceFormatted: string;
  colors: ColorOption[];
  sizes: string[];
  selectedColor?: string;
  selectedSize?: string;
  disabledColors?: string[];
  disabledSizes?: string[];
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
  rating?: number;
  reviewCount?: number;
  onAddToCart: (color: string, size: string) => void;
}

export const StickyFooterBar: React.FC<StickyFooterBarProps> = React.memo(({
  productName,
  priceFormatted,
  colors,
  sizes,
  selectedColor,
  selectedSize,
  disabledColors = [],
  disabledSizes = [],
  onColorChange,
  onSizeChange,
  rating = 4.8,
  reviewCount = 0,
  onAddToCart
}) => {
  const router = useRouter();
  const [hasAdded, setHasAdded] = useState(false);

  // Controlled active selections (zero redundant state = zero re-render lag)
  const activeColor = selectedColor || colors[0]?.name || "";
  const activeSize = selectedSize || sizes[0] || "";

  const handleColorClick = React.useCallback((colorName: string) => {
    if (disabledColors.includes(colorName)) return;
    if (onColorChange) onColorChange(colorName);
  }, [disabledColors, onColorChange]);

  const handleSizeClick = React.useCallback((sizeName: string) => {
    if (disabledSizes.includes(sizeName)) return;
    if (onSizeChange) onSizeChange(sizeName);
  }, [disabledSizes, onSizeChange]);

  const handleAddToCartClick = React.useCallback(() => {
    onAddToCart(activeColor, activeSize);
    setHasAdded(true);
  }, [onAddToCart, activeColor, activeSize]);

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 bg-white/80 supports-[backdrop-filter]:bg-white/75 backdrop-blur-xl border-t border-neutral-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transform-gpu will-change-transform transition-all duration-200">
      
      {/* Top Floating Mini-Bar (Mobile mostly) */}
      <div className="w-full bg-white/50 backdrop-blur-md border-b border-neutral-200/50 py-1 px-4 flex justify-between items-center text-[10px] md:hidden">
        <span className="font-semibold text-neutral-600 flex items-center gap-1">
          <span className="text-amber-500">★</span>
          <span>{rating}</span>
          <span className="text-neutral-300">·</span>
          <span>{reviewCount > 0 ? `${reviewCount} REVIEWS` : "VERIFIED GEAR"}</span>
        </span>
        <span className="text-brand font-bold uppercase tracking-wider cursor-pointer hover:underline">
          Size Guide
        </span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-2 md:py-3 flex items-center justify-between gap-3">
        
        {/* Left: Product Name & Price (Desktop) */}
        <div className="hidden md:flex flex-col min-w-0 max-w-[280px] lg:max-w-md">
          <span className="font-sans text-xs md:text-sm font-bold text-neutral-900 truncate leading-tight">
            {productName}
          </span>
          <span className="text-brand font-extrabold text-base md:text-lg leading-tight mt-0.5">
            {priceFormatted}
          </span>
        </div>

        {/* Right/Mobile Full: Selectors & CTA */}
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          
          {/* Mobile: Sleek Frosted Summary Pill */}
          <div className="flex items-center gap-2 bg-neutral-100/90 backdrop-blur-xs border border-neutral-200/70 rounded-full px-2.5 py-1 md:hidden">
            <div 
              className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-2xs" 
              style={{ background: colors.find(c => c.name === activeColor)?.background || '#000' }} 
            />
            <span className="text-[10px] font-extrabold text-neutral-800 uppercase tracking-wider">{activeColor}</span>
            <span className="text-neutral-300">|</span>
            <span className="text-[10px] font-bold text-neutral-700">EU {activeSize}</span>
            <span className="text-neutral-300">|</span>
            <span className="text-[11px] font-black text-brand">{priceFormatted}</span>
          </div>

          {/* Desktop: Full Color Selector */}
          <div className="hidden md:flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-neutral-500">
              <span>COLOR:</span>
              <span className="text-neutral-900 font-extrabold">{activeColor || "Select"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {colors.map((colorObj, idx) => {
                const isSelected = activeColor === colorObj.name;
                const isDisabled = disabledColors.includes(colorObj.name);
                return (
                  <button
                    key={`sticky-color-${idx}-${colorObj.name}`}
                    onClick={() => handleColorClick(colorObj.name)}
                    disabled={isDisabled}
                    className={`w-7 h-7 rounded-full border-2 transition-all duration-150 relative ${
                      isSelected
                        ? "border-brand scale-110 ring-2 ring-brand/30 ring-offset-1 z-10"
                        : "border-neutral-300/90 hover:border-neutral-500 opacity-85 hover:opacity-100"
                    } ${isDisabled ? "opacity-30 cursor-not-allowed hover:border-neutral-300" : ""}`}
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

          {/* Desktop: Full Size Selector */}
          <div className="hidden md:flex flex-col gap-1 border-l border-neutral-200/80 pl-4">
            <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500">SIZE (EU)</span>
            <div className="flex items-center gap-1">
              {sizes.map(size => {
                const isSelected = activeSize === size;
                const isDisabled = disabledSizes.includes(size);
                return (
                  <button
                    key={`sticky-size-${size}`}
                    onClick={() => handleSizeClick(size)}
                    disabled={isDisabled}
                    title={isDisabled ? "Out of stock for this color" : ""}
                    className={`min-w-[32px] h-8 px-2 text-xs font-bold rounded-lg border transition-all duration-150 ${
                      isDisabled 
                        ? "border-neutral-200 text-neutral-400 bg-neutral-100/50 cursor-not-allowed line-through" 
                        : isSelected 
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-xs" 
                        : "border-neutral-200/90 text-neutral-700 bg-white/70 hover:bg-white hover:border-neutral-400"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Buttons: ADD TO CART and/or VIEW CART */}
          <div className="flex items-center gap-2 ml-auto md:ml-4 shrink-0">
            {hasAdded ? (
              <div className="flex items-center gap-1.5 md:gap-2 animate-in zoom-in-95 duration-200">
                <button
                  onClick={handleAddToCartClick}
                  className="bg-white/80 hover:bg-white text-neutral-800 px-3 py-2.5 md:py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-neutral-300 shadow-xs active:scale-95 transition-all"
                  title="Add another unit"
                >
                  +1
                </button>
                <button
                  onClick={() => router.push("/cart")}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 md:px-7 py-2.5 md:py-3 rounded-xl font-black tracking-wider text-xs md:text-sm flex items-center gap-1.5 md:gap-2 shadow-md shadow-emerald-600/25 transition-all whitespace-nowrap active:scale-95"
                >
                  <CheckIcon className="w-4 h-4 stroke-[3]" />
                  <span className="hidden md:inline">VIEW CART</span>
                  <span className="md:hidden">CART</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 hidden md:block" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleAddToCartClick}
                className="bg-gradient-to-r from-banner to-orange-600 hover:from-orange-600 hover:to-brand text-white px-4 md:px-8 py-2.5 md:py-3 rounded-xl font-extrabold tracking-wider md:tracking-widest text-xs md:text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all whitespace-nowrap"
              >
                <ShoppingCartIcon className="w-4 h-4" />
                <span className="hidden md:inline">ADD TO CART</span>
                <span className="md:hidden">ADD</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
});

StickyFooterBar.displayName = "StickyFooterBar";
