"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon, ShoppingBagIcon, CheckIcon } from "@heroicons/react/24/solid";
import { CatalogProduct } from "../types/catalog.types";
import { useCartStore } from "@/stores/useCartStore";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";

export const CatalogProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => {
  const [imgSrc, setImgSrc] = useState(product.imageUrl);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

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
        selectedColor: "Standard",
        selectedSize: "Standard",
      } as any,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <Link 
      href={product.productUrl} 
      className="group w-full relative select-none"
      prefetch={false}
    >
      {/* 1. MOBILE CARD (Exact Wireframe Match: Portrait Aspect with Bottom Gradient Overlay & Orange Rating Badge) */}
      <div className="sm:hidden relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden rounded-lg border border-neutral-200/70 shadow-xs">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-cover group-active:scale-95 transition-transform duration-300"
          sizes="50vw"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {/* Orange Rating Badge (Top Right as in Wireframe) */}
        <div className="absolute top-2 right-2 bg-[#FF5429] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-xs z-10">
          <StarIcon className="w-2.5 h-2.5 text-white" />
          <span>{product.rating || "4.95"}</span>
        </div>

        {/* Bottom Dark Gradient Overlay with Product Name & Price */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-8 z-10 flex flex-col justify-end">
          <p className="text-[11px] font-bold text-white line-clamp-1 leading-snug drop-shadow-xs">
            {product.name}
          </p>
          <p className="text-xs font-black text-white/95 mt-0.5 drop-shadow-xs">
            {product.priceFormatted}
          </p>
        </div>
      </div>

      {/* 2. DESKTOP CARD (Standard E-Commerce Clean Layout with Hover Quick-Add) */}
      <div className="hidden sm:flex flex-col gap-3 w-full">
        <div className="relative aspect-square w-full bg-white overflow-hidden rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-100 p-2">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500 ease-in-out will-change-transform p-4"
            sizes="(max-width: 768px) 50vw, 33vw"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          
          {/* Liquid Glassmorphism Rating Badge */}
          <div className="absolute top-2.5 right-2.5 bg-white/70 backdrop-blur-md border border-white/50 shadow-xs text-neutral-900 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <StarIcon className="w-2.5 h-2.5 text-amber-500" />
            <span>{product.rating}</span>
          </div>

          {/* Hover Quick Add to Cart Button */}
          <div className="absolute inset-x-2.5 bottom-2.5 z-20 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleQuickAdd}
              aria-label="Quick add to cart"
              className={`w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                isAdded 
                  ? "bg-banner text-white" 
                  : "bg-neutral-900/90 hover:bg-banner text-white backdrop-blur-md"
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
          <span className="text-[9px] text-neutral-400 uppercase tracking-[0.15em] font-bold">
            {product.category}
          </span>
          <span className="text-[13px] md:text-[14px] font-sans font-semibold text-neutral-900 line-clamp-1 leading-tight group-hover:text-banner transition-colors">
            {product.name}
          </span>
          <span className="text-xs md:text-[13px] font-extrabold text-brand mt-0.5">
            {product.priceFormatted}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CatalogProductCard;
