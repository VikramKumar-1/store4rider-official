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
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
  rating?: number;
  reviewCount?: number;
  onAddToCart: (color: string, size: string) => void;
}

export const StickyFooterBar: React.FC<StickyFooterBarProps> = ({
  productName,
  priceFormatted,
  colors,
  sizes,
  selectedColor: propColor,
  selectedSize: propSize,
  onColorChange,
  onSizeChange,
  rating = 4.8,
  reviewCount = 0,
  onAddToCart
}) => {
  const router = useRouter();
  const [internalColor, setInternalColor] = useState(colors[0]?.name || "");
  const [internalSize, setInternalSize] = useState(sizes[0] || "");

  const activeColor = propColor !== undefined ? propColor : internalColor;
  const activeSize = propSize !== undefined ? propSize : internalSize;

  const handleColorClick = (colorName: string) => {
    setInternalColor(colorName);
    if (onColorChange) onColorChange(colorName);
  };

  const handleSizeClick = (sizeName: string) => {
    setInternalSize(sizeName);
    if (onSizeChange) onSizeChange(sizeName);
  };

  const [hasAdded, setHasAdded] = useState(false);

  const handleAddToCartClick = () => {
    onAddToCart(activeColor, activeSize);
    setHasAdded(true);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-neutral-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-30 transition-transform duration-300">
      
      {/* Top Floating Mini-Bar (Mobile mostly) */}
      <div className="w-full bg-white border-b border-neutral-200 py-1.5 px-4 flex justify-between items-center text-[10px] md:hidden">
        <span className="font-semibold text-neutral-700">
          REVIEWS: {reviewCount > 0 ? `${reviewCount} REVIEWS` : "VERIFIED GEAR"} : {rating}★
        </span>
        <span className="text-banner underline underline-offset-2 font-bold cursor-pointer">SIZE CHART</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-2 md:py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Product Name & Price */}
        <div className="hidden md:flex flex-col">
          <span className="font-serif text-lg font-bold text-neutral-800">{productName}</span>
          <span className="text-banner font-bold">{priceFormatted}</span>
        </div>

        {/* Right/Mobile Full: Selectors & CTA */}
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          
          {/* Mobile: Show selected color & size as text only */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full border-2 border-neutral-300" style={{ background: colors.find(c => c.name === activeColor)?.background || '#000' }} />
              <span className="text-[10px] font-bold text-neutral-700 uppercase">{activeColor}</span>
            </div>
            <span className="text-neutral-300">|</span>
            <span className="text-[10px] font-bold text-neutral-700">EU {activeSize}</span>
            <span className="text-neutral-300">|</span>
            <span className="text-xs font-extrabold text-banner">{priceFormatted}</span>
          </div>

          {/* Desktop: Full Color Selector */}
          <div className="hidden md:flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[9px] uppercase font-semibold text-neutral-500">
              <span>COLOR:</span>
              <span className="text-neutral-900 font-bold">{activeColor || "Select"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {colors.map((colorObj, idx) => {
                const isSelected = activeColor === colorObj.name;
                return (
                  <button
                    key={`color-${idx}-${colorObj.name}`}
                    onClick={() => handleColorClick(colorObj.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                      isSelected
                        ? "border-orange-600 scale-110 ring-2 ring-orange-400/40 ring-offset-1 z-10"
                        : "border-neutral-300 hover:border-neutral-500 opacity-85 hover:opacity-100"
                    }`}
                    style={{ background: colorObj.background }}
                    title={colorObj.name}
                    aria-label={colorObj.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Desktop: Full Size Selector */}
          <div className="hidden md:flex flex-col gap-1 border-l border-neutral-200 pl-4">
            <span className="text-[8px] uppercase font-semibold text-neutral-400">SIZE</span>
            <div className="flex items-center gap-1">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeClick(size)}
                  className={`w-9 h-9 text-sm font-semibold border ${activeSize === size ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 bg-white hover:border-neutral-400'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons: ADD TO CART and/or VIEW CART */}
          <div className="flex items-center gap-2 ml-auto md:ml-4">
            {hasAdded ? (
              <div className="flex items-center gap-1.5 md:gap-2 animate-in zoom-in-95 duration-200">
                <button
                  onClick={handleAddToCartClick}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2 md:px-4 py-2.5 md:py-3 rounded-sm font-bold text-[10px] md:text-xs uppercase tracking-wider border border-neutral-300 transition-colors"
                  title="Add another unit"
                >
                  +1
                </button>
                <button
                  onClick={() => router.push("/cart")}
                  className="bg-[#0C831F] hover:bg-[#0A721B] text-white px-3 md:px-7 py-2.5 md:py-3 rounded-sm font-black tracking-widest text-[11px] md:text-sm flex items-center gap-1.5 md:gap-2 shadow-[0_4px_14px_rgba(12,131,31,0.4)] transition-all whitespace-nowrap active:scale-95"
                >
                  <CheckIcon className="w-4 h-4 stroke-[3]" />
                  <span className="hidden md:inline">VIEW CART</span>
                  <span className="md:hidden">CART</span>
                  <ArrowRightIcon className="w-3 h-3 hidden md:block" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleAddToCartClick}
                className="bg-banner hover:bg-orange-600 text-white px-3 md:px-8 py-2.5 md:py-3 rounded-sm font-bold tracking-wider md:tracking-widest text-[11px] md:text-sm flex items-center gap-1.5 md:gap-2 shadow-md transition-all whitespace-nowrap active:scale-95"
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
};
