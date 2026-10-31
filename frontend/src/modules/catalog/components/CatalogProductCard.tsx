"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StarIcon, ShoppingBagIcon, CheckIcon } from "@heroicons/react/24/solid";
import { CatalogProduct } from "../types/catalog.types";
import { useCartStore } from "@/stores/useCartStore";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";

const FALLBACK_IMAGE = "/no-image.svg";

export const CatalogProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState(product.imageUrl);
  const [fadeKey, setFadeKey] = useState(0);
  React.useEffect(() => { 
    setImgSrc(product.imageUrl); 
    setFadeKey(prev => prev + 1);
  }, [product.imageUrl]);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);

  const updateImage = (newUrl: string) => {
    if (newUrl && newUrl !== imgSrc) {
      setImgSrc(newUrl);
      setFadeKey(prev => prev + 1);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const numericPrice = parseFloat(product.priceFormatted.replace(/[^0-9.]/g, "")) || 0;

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity: 1,
      variantId: "default",
      product: {
        _id: product.id,
        id: product.id,
        name: product.name,
        basePrice: numericPrice,
        price: numericPrice,
        images: [{ url: product.imageUrl, altText: product.name }],
        slug: product.productUrl.replace("/products/", ""),
        selectedColor: selectedColorName || "Standard",
        selectedSize: "Standard",
      } as any,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const dynamicHref = selectedColorName 
    ? `/${product.rawSlug || product.productUrl.split("?")[0].split("/").pop()}?color=${encodeURIComponent(selectedColorName)}`
    : product.productUrl;

  return (
    <div className="group w-full relative select-none">
      {/* Absolute Link covering the entire card to handle routing without wrapping interactive elements */}
      <Link 
        href={dynamicHref} 
        className="absolute inset-0 z-0"
        prefetch={false}
        aria-label={`View ${product.name}`}
      />

      {/* 1. MOBILE CARD (Exact Wireframe Match: Portrait Aspect with Bottom Gradient Overlay & Orange Rating Badge) */}
      <div className="sm:hidden relative aspect-[4/5] w-full bg-[#f4f4f4] overflow-hidden rounded-lg border border-neutral-200/70 shadow-xs pointer-events-none z-10">
        <img
          key={`mob-${fadeKey}`}
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full absolute inset-0 object-contain pb-8 group-active:scale-95 transition-opacity duration-200 mix-blend-multiply"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {/* Optional Featured Badge (Top Left - only if explicitly enabled) */}
        {product.showFeaturedBadge && (
          <div className="absolute top-2 left-2 bg-neutral-900/90 backdrop-blur-xs text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-xs z-10 tracking-wider uppercase">
            <span>★ FEATURED</span>
          </div>
        )}

        {/* Solid Orange Rating Badge (Top Right as in Wireframe) */}
        <div className="absolute top-2 right-2 bg-banner text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-xs z-10">
          <StarIcon className="w-2.5 h-2.5 text-white" />
          <span>{product.rating || "4.95"}</span>
        </div>

        {/* Bottom Dark Gradient Overlay with Product Name & Price */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-10 z-10 flex flex-col justify-end">
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5 pointer-events-auto w-fit bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-neutral-200/90 shadow-xs">
              {product.colors.slice(0, 4).map((colorObj, idx) => (
                <button
                  key={`${idx}-${colorObj.name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColorName(colorObj.name);
                    updateImage(colorObj.imageUrl || product.imageUrl);
                  }}
                  className={`w-4 h-4 rounded-[3px] border border-black/15 shadow-2xs transition-all ${
                    selectedColorName === colorObj.name
                      ? "ring-2 ring-neutral-900 ring-offset-1 ring-offset-white scale-110 z-10"
                      : "hover:scale-105"
                  }`}
                  style={{ background: colorObj.background || parseColorToBackground(colorObj.name) }}
                  title={colorObj.name}
                  aria-label={`View ${colorObj.name} variant`}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[9px] text-neutral-700 font-bold ml-0.5">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
          <p className="text-[11px] font-bold text-white line-clamp-1 leading-snug drop-shadow-xs">
            {product.name}
          </p>
          <p className="text-xs font-black text-white/95 mt-0.5 drop-shadow-xs">
            {product.priceFormatted}
          </p>
        </div>
      </div>

      {/* 2. DESKTOP CARD (Standard E-Commerce Clean Layout with Hover Quick-Add) */}
      <div className="hidden sm:flex flex-col gap-3 w-full pointer-events-none relative z-10">
        <div className="relative aspect-square w-full bg-[#f4f4f4] overflow-hidden rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-100">
          <img
            key={`desk-${fadeKey}`}
            src={imgSrc}
            alt={product.name}
            loading="lazy"
          decoding="async"
          className="w-full h-full absolute inset-0 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          
          {/* Optional Featured Badge (Top Left - only if explicitly enabled) */}
          {product.showFeaturedBadge && (
            <div className="absolute top-2.5 left-2.5 bg-neutral-900/90 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10 shadow-xs tracking-wider uppercase">
              <span>★ FEATURED</span>
            </div>
          )}

          {/* Liquid Glassmorphism Rating Badge */}
          <div className="absolute top-2.5 right-2.5 bg-white/70 backdrop-blur-md border border-white/50 shadow-xs text-neutral-900 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <StarIcon className="w-2.5 h-2.5 text-amber-500" />
            <span>{product.rating}</span>
          </div>

          {/* Hover Overlay: Swatches + Quick Add */}
          <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex flex-col gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto">
            {/* Color Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex w-fit mx-auto items-center justify-center gap-1.5 bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-2.5 py-1.5 rounded-full transition-colors">
                {product.colors.slice(0, 5).map((colorObj, idx) => (
                  <div key={`${idx}-${colorObj.name}`} className="relative group/swatch">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColorName(colorObj.name);
                        updateImage(colorObj.imageUrl || product.imageUrl);
                      }}
                      className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-[4px] border border-black/15 shadow-2xs transition-all duration-150 hover:scale-115 ${
                        selectedColorName === colorObj.name
                          ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-white scale-110 z-10 shadow-xs"
                          : "hover:border-neutral-500"
                      }`}
                      style={{ background: colorObj.background || parseColorToBackground(colorObj.name) }}
                      aria-label={`View ${colorObj.name} variant`}
                    />
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/swatch:flex flex-col items-center bg-white shadow-xl rounded-md p-1.5 z-50 border border-neutral-200 min-w-[95px] animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-full aspect-square mb-1.5 rounded-sm border border-neutral-200 shadow-2xs" style={{ background: colorObj.background || parseColorToBackground(colorObj.name) }} />
                      <span className="text-[10px] text-center font-semibold text-neutral-800 truncate w-full px-1">{colorObj.name}</span>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-neutral-200 rotate-45" />
                    </div>
                  </div>
                ))}
                {product.colors.length > 5 && (
                  <span className="text-[10px] text-neutral-700 font-bold bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded-full shadow-2xs">
                    +{product.colors.length - 5}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleQuickAdd}
              aria-label="Quick add to cart"
              className={`w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                isAdded 
                  ? "bg-emerald-600 text-white" 
                  : "bg-banner hover:bg-orange-600 text-white"
              }`}
            >
              {isAdded ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                  <span>ADDED!</span>
                </>
              ) : (
                <>
                  <ShoppingBagIcon className="w-3.5 h-3.5" />
                  <span>QUICK ADD</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Text Content */}
        <div className="flex flex-col space-y-0.5 px-0.5">
          {product.category && !product.category.toLowerCase().includes('root test') && (
            <span className="text-[9px] text-neutral-400 uppercase tracking-[0.15em] font-bold">
              {product.category}
            </span>
          )}
          <h3 className="product-title text-[13px] md:text-[14px] font-heading font-medium text-neutral-900 line-clamp-1 leading-tight group-hover:text-banner transition-colors pointer-events-auto m-0">
            {product.name}
          </h3>
          <span className="text-xs md:text-[13px] font-extrabold text-brand mt-0.5">
            {product.priceFormatted}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CatalogProductCard;
