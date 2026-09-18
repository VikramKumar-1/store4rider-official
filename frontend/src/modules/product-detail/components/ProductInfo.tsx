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
  return (
    <div className="flex flex-col gap-4">
      {/* Header: Category & Rating */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
          {category}
        </span>
        <div className="flex items-center gap-1 bg-yellow-100/50 px-2 py-0.5 rounded-sm">
          <StarIcon className="w-4 h-4 text-[#FFD700]" />
          <span className="text-sm font-bold text-neutral-700">{rating}</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="font-sans font-extrabold text-2xl md:text-4xl uppercase tracking-tight text-neutral-900 leading-tight">
        {name}
      </h1>

      {/* Pricing */}
      <div className="flex flex-col gap-1 mt-1">
        {originalPriceFormatted && discountBadge && (
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 line-through text-lg font-medium">
              {originalPriceFormatted}
            </span>
            <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
              {discountBadge} OFF
            </span>
          </div>
        )}
        <span className="font-sans font-extrabold text-brand text-2xl md:text-3xl">
          {priceFormatted}
        </span>
      </div>

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

      {/* Short Description */}
      {shortDescription && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <p className="text-neutral-600 text-sm leading-relaxed md:text-[14.5px] font-sans">
            {shortDescription}
          </p>
        </div>
      )}
    </div>
  );
};
