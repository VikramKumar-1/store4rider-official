"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ShoppingCartIcon, ShoppingBagIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { ColorOption } from "../types/product-detail.types";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";

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
  sizeChart?: string;
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
  sizeChart,
  onAddToCart
}) => {
  const router = useRouter();
  const [hasAdded, setHasAdded] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"color" | "size" | null>(null);
  
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const setIsBottomModalOpen = useUIStore((state) => state.setIsBottomModalOpen);

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setIsBottomModalOpen(openDropdown !== null || showSizeChart);
    // Cleanup on unmount just in case
    return () => setIsBottomModalOpen(false);
  }, [openDropdown, showSizeChart, setIsBottomModalOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const isOutOfStock = disabledColors.includes(activeColor) || disabledSizes.includes(activeSize);

  return (
    <div className={`fixed bottom-0 left-0 w-full z-40 bg-white/95 supports-[backdrop-filter]:bg-white/90 backdrop-blur-2xl border-t border-neutral-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transform-gpu will-change-transform transition-all duration-300 pb-safe ${
      openDropdown || showSizeChart ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
    }`}>
      
      {/* Top Floating Mini-Bar (Mobile Size Guide & Rating) */}
      <div className="w-full bg-white/50 backdrop-blur-md border-b border-neutral-200/50 py-1.5 px-4 grid grid-cols-3 items-center text-[10px] md:hidden relative">
        <div /> {/* Left Spacer */}
        
        {/* CENTER: Rating */}
        <div className="flex justify-center items-center gap-1 text-neutral-600 font-bold">
          <span className="text-neutral-400 text-[9px] uppercase tracking-wider mr-0.5">Review</span>
          <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="leading-none">{rating > 0 ? rating : "4.8"}</span>
          <span className="text-neutral-400 font-medium leading-none">({reviewCount > 0 ? reviewCount : 800}+)</span>
        </div>

        {/* RIGHT: Size Chart */}
        <div className="flex justify-end">
          {sizeChart && (
            <span 
              onClick={() => setShowSizeChart(true)}
              className="text-brand font-bold uppercase tracking-wider cursor-pointer hover:underline flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                <rect x="2" y="8" width="20" height="8" rx="1" />
                <line x1="6" y1="16" x2="6" y2="12" />
                <line x1="10" y1="16" x2="10" y2="12" />
                <line x1="14" y1="16" x2="14" y2="12" />
                <line x1="18" y1="16" x2="18" y2="12" />
              </svg>
              Size Chart
            </span>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 lg:px-6 pt-2 pb-5 md:py-3 relative" ref={dropdownRef}>
        
        {/* MOBILE LAYOUT (Exactly as requested by client) */}
        <div className="flex md:hidden flex-col gap-2 w-full">
          {/* Top Row: Name and Price */}
          <div className="flex justify-between items-start w-full gap-2">
             <span className="font-sans font-bold text-xs uppercase text-neutral-800 line-clamp-2 leading-tight flex-1 pt-0.5">
               {productName}
             </span>
             <div className="flex flex-col items-end shrink-0">
               <span className="text-sm font-black text-neutral-900">{priceFormatted}</span>
               <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-tight leading-none mt-0.5">MRP inclusive of all taxes</span>
             </div>
          </div>

          {/* Bottom Row: Size/Color Dropdowns & Add to Cart */}
          <div className="flex items-center justify-between w-full gap-2 relative">
            
            {/* Clean Solid Mobile Bottom Sheet Modal for Variant Selection */}
            {openDropdown && typeof document !== "undefined" && createPortal(
              <div className="fixed inset-0 z-[100] flex items-end">
                {/* Dark Backdrop Overlay */}
                <div 
                  className="fixed inset-0 bg-black/60 animate-in fade-in duration-200"
                  onClick={() => setOpenDropdown(null)}
                />

                {/* Solid Bottom Sheet Drawer */}
                <div 
                  className="relative w-full z-[110] bg-white rounded-t-3xl shadow-[0_-12px_50px_rgba(0,0,0,0.3)] p-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto mt-auto"
                >
                  {/* Pull indicator */}
                  <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-4" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                    <div>
                      <h4 className="font-sans font-extrabold text-xs uppercase tracking-wider text-neutral-900">
                        {openDropdown === "color" ? "Select Color" : "Select Size (EU)"}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-500 font-medium line-clamp-1 max-w-[200px]">{productName}</span>
                        <span className="text-xs font-bold text-brand shrink-0">{priceFormatted}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setOpenDropdown(null)} 
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 active:bg-neutral-200 transition-colors"
                      aria-label="Close"
                    >
                      <XMarkIcon className="w-4 h-4 stroke-2" />
                    </button>
                  </div>

                  {/* Color Swatches - ONLY shown when openDropdown === 'color' */}
                  {openDropdown === "color" && colors && colors.length > 0 && (
                    <div className="flex flex-col gap-2.5 mb-5">
                      <div className="flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider text-neutral-500">
                        <span>SELECTED COLOR:</span>
                        <span className="text-neutral-900 font-black">{activeColor}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap py-1">
                        {colors.map((colorObj, idx) => {
                          const isSelected = activeColor === colorObj.name;
                          const isDisabled = disabledColors.includes(colorObj.name);
                          return (
                            <button
                              key={`sheet-color-${idx}-${colorObj.name}`}
                              onClick={() => handleColorClick(colorObj.name)}
                              disabled={isDisabled}
                              className={`w-11 h-11 rounded-full border-2 transition-all relative flex items-center justify-center ${
                                isSelected
                                  ? "border-brand scale-110 ring-3 ring-brand/25 ring-offset-2 z-10 shadow-sm"
                                  : "border-neutral-300 hover:border-neutral-500 opacity-90 hover:opacity-100"
                              } ${isDisabled ? "opacity-30 cursor-not-allowed hover:border-neutral-300" : ""}`}
                              style={{ background: colorObj.background }}
                              title={isDisabled ? `${colorObj.name} - Out of Stock` : colorObj.name}
                            >
                              {isSelected && (
                                <CheckIcon className={`w-4 h-4 ${colorObj.name.toLowerCase() === 'white' ? 'text-black' : 'text-white'} drop-shadow-xs`} />
                              )}
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

                  {/* Size Swatches - ONLY shown when openDropdown === 'size' */}
                  {openDropdown === "size" && sizes && sizes.length > 0 && (
                    <div className="flex flex-col gap-2.5 mb-5">
                      <div className="flex items-center justify-between text-[11px] uppercase font-bold tracking-wider">
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <span>SELECTED SIZE:</span>
                          <span className="text-neutral-900 font-black">{activeSize}</span>
                        </div>
                        {sizeChart && (
                          <span 
                            onClick={() => {
                              setOpenDropdown(null);
                              setShowSizeChart(true);
                            }}
                            className="text-brand font-bold uppercase tracking-wider cursor-pointer hover:underline text-[10px]"
                          >
                            Size Guide
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2.5 py-1">
                        {sizes.map((size) => {
                          const isSelected = activeSize === size;
                          const isDisabled = disabledSizes.includes(size);
                          return (
                            <button
                              key={`sheet-size-${size}`}
                              onClick={() => handleSizeClick(size)}
                              disabled={isDisabled}
                              className={`h-11 px-2 text-xs font-extrabold rounded-xl border transition-all duration-150 flex items-center justify-center ${
                                isDisabled
                                  ? "border-neutral-200 text-neutral-400 bg-neutral-100/50 cursor-not-allowed line-through"
                                  : isSelected
                                  ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                                  : "border-neutral-200 text-neutral-800 bg-white hover:bg-neutral-50 active:bg-neutral-100"
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Done / Confirm button */}
                  <button
                    onClick={() => setOpenDropdown(null)}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md active:scale-98 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>,
              document.body
            )}

            {/* Triggers in bottom bar */}
            <div className="flex flex-1 items-center gap-2 h-[40px] sm:h-[44px]">
              {/* SIZE BUTTON */}
              <button 
                onClick={() => setOpenDropdown(openDropdown === "size" ? null : "size")}
                className={`border rounded-md px-2 flex flex-col flex-1 items-start justify-center shadow-2xs transition-all h-full ${
                  openDropdown === "size" ? "border-brand bg-orange-50/50 ring-1 ring-brand" : "border-neutral-300 bg-white active:bg-neutral-50"
                }`}
              >
                <div className="flex items-center justify-between w-full text-[8.5px] sm:text-[9px] font-bold text-neutral-500 uppercase leading-none mb-1">
                  <span>SIZE</span>
                  <ChevronDownIcon className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                </div>
                <div className="w-full flex justify-center items-center leading-none">
                  <span className="text-[12px] sm:text-[13px] font-black text-neutral-900 leading-none">{activeSize || "--"}</span>
                </div>
              </button>

              {/* COLOR BUTTON */}
              <button 
                onClick={() => setOpenDropdown(openDropdown === "color" ? null : "color")}
                className={`border rounded-md px-2 flex flex-col flex-1 items-start justify-center shadow-2xs transition-all h-full ${
                  openDropdown === "color" ? "border-brand bg-orange-50/50 ring-1 ring-brand" : "border-neutral-300 bg-white active:bg-neutral-50"
                }`}
              >
                <div className="flex items-center justify-between w-full text-[8.5px] sm:text-[9px] font-bold text-neutral-500 uppercase leading-none mb-1">
                  <span>COLOR</span>
                  <ChevronDownIcon className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                </div>
                <div className="flex items-center justify-center gap-1.5 leading-none w-full">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-neutral-300 shrink-0" style={{ background: colors.find(c => c.name === activeColor)?.background || '#111' }} />
                  <span className="text-[12px] sm:text-[13px] font-black text-neutral-900 truncate leading-none mt-0.5">{activeColor || "--"}</span>
                </div>
              </button>
            </div>

            {/* ACTION BUTTON */}
            <div className="w-[38%] shrink-0 h-[40px] sm:h-[44px]">
              {hasAdded ? (
                <div className="flex items-center gap-1.5 animate-in zoom-in duration-200 w-full h-full">
                  <button onClick={handleAddToCartClick} className="bg-white text-brand px-3 rounded-md font-black text-[13px] border-2 border-brand/20 shadow-sm active:scale-95 transition-all h-full">
                    +1
                  </button>
                  <button onClick={() => router.push("/cart")} className="flex-1 bg-emerald-600 text-white px-2 rounded-md font-black tracking-wider text-[11px] flex justify-center items-center gap-1.5 shadow-md transition-all active:scale-95 h-full">
                    <ShoppingBagIcon className="w-4 h-4 shrink-0" />
                    <span className="leading-none mt-0.5">{cartCount} ITEM{cartCount !== 1 ? 'S' : ''}</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAddToCartClick}
                  disabled={isOutOfStock}
                  className={`w-full h-full flex items-center justify-center gap-1 rounded-md font-black uppercase tracking-tighter sm:tracking-wider text-[11px] sm:text-xs shadow-sm active:scale-95 transition-all ${
                    isOutOfStock 
                      ? 'bg-[#c5e84f] text-neutral-900 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-banner to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                  }`}
                >
                  {isOutOfStock ? "SOLD OUT" : "ADD TO CART"}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* DESKTOP LAYOUT (Preserved Exactly As Before) */}
        <div className="hidden md:flex justify-between items-center w-full">
          {/* Left: Product Name & Price (Desktop) */}
          <div className="flex flex-col min-w-0 max-w-[280px] lg:max-w-md">
            <span className="font-sans text-xs md:text-sm font-bold text-neutral-900 truncate leading-tight">
              {productName}
            </span>
            <span className="text-brand font-extrabold text-base md:text-lg leading-tight mt-0.5">
              {priceFormatted}
            </span>
          </div>

          {/* Right: Selectors & CTA */}
          <div className="flex items-center gap-4 justify-end">
            {/* Desktop: Full Color Selector */}
            <div className="flex flex-col gap-1">
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
            <div className="flex flex-col gap-1 border-l border-neutral-200/80 pl-4 min-w-[150px]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500">SIZE (EU)</span>
                {sizeChart && (
                  <button 
                    onClick={() => setShowSizeChart(true)}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                      <rect x="2" y="8" width="20" height="8" rx="1" />
                      <line x1="6" y1="16" x2="6" y2="12" />
                      <line x1="10" y1="16" x2="10" y2="12" />
                      <line x1="14" y1="16" x2="14" y2="12" />
                      <line x1="18" y1="16" x2="18" y2="12" />
                    </svg>
                    <span className="text-[9px] font-black uppercase text-neutral-900 underline underline-offset-2 tracking-wider">SIZE CHART</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {sizes.map(size => {
                  const isSelected = activeSize === size;
                  const isDisabled = disabledSizes.includes(size);
                  return (
                    <button
                      key={`sticky-size-${size}`}
                      onClick={() => handleSizeClick(size)}
                      disabled={isDisabled}
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

            {/* Desktop CTA */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {hasAdded ? (
                <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                  <button onClick={handleAddToCartClick} className="bg-white/80 hover:bg-white text-neutral-800 px-3 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-neutral-300 shadow-xs active:scale-95 transition-all">
                    +1
                  </button>
                  <button onClick={() => router.push("/cart")} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-7 py-3 rounded-xl font-black tracking-wider text-sm flex items-center gap-2 shadow-md transition-all whitespace-nowrap active:scale-95">
                    <CheckIcon className="w-4 h-4 stroke-[3]" />
                    <span>VIEW CART</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAddToCartClick}
                  disabled={isOutOfStock}
                  className={`${
                    isOutOfStock 
                      ? 'bg-[#c5e84f] text-neutral-900 hover:bg-[#b0d146]' 
                      : 'bg-gradient-to-r from-banner to-orange-600 hover:from-orange-600 hover:to-brand text-white'
                  } px-8 py-3 rounded-xl font-extrabold tracking-widest text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all whitespace-nowrap`}
                >
                  {!isOutOfStock && <ShoppingCartIcon className="w-4 h-4" />}
                  <span>{isOutOfStock ? "RESTOCKING SOON" : "ADD TO CART"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Size Chart Modal */}
      {showSizeChart && sizeChart && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full relative flex flex-col max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50 shrink-0">
              <h3 className="font-extrabold text-lg uppercase tracking-wide text-neutral-900">Size Guide</h3>
              <button onClick={() => setShowSizeChart(false)} className="text-neutral-400 hover:text-red-500 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto min-h-0">
              {sizeChart.includes('<') ? (
                <div 
                  className="w-full overflow-x-auto text-sm text-neutral-800 [&_table]:min-w-[600px] [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-neutral-300 [&_th]:p-3 [&_th]:bg-neutral-100 [&_th]:whitespace-nowrap [&_td]:border [&_td]:border-neutral-300 [&_td]:p-3 [&_td]:text-center [&_img]:w-full [&_img]:max-h-[70vh] [&_img]:object-contain [&_img]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: sizeChart.replace(/""/g, '"') }} 
                />
              ) : (
                <img src={sizeChart} alt="Size Chart" className="w-full max-h-[70vh] object-contain rounded-md mx-auto" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

StickyFooterBar.displayName = "StickyFooterBar";
