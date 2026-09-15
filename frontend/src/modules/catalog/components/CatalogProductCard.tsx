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
      className="group flex flex-col gap-3 w-full relative"
      prefetch={false}
    >
      {/* Image Container with Hover Quick-Add Action */}
      <div className="relative aspect-[3/4] w-full bg-neutral-50 overflow-hidden rounded-sm shadow-sm">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-700 ease-in-out"
          sizes="(max-width: 768px) 50vw, 33vw"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        
        {/* Floating Rating Badge (Top Right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-banner/90 backdrop-blur-sm px-2 py-1 rounded-sm shadow-md z-10">
          <StarIcon className="w-3 h-3 text-[#FFD700]" />
          <span className="text-[10px] font-bold text-white tracking-widest">{product.rating}</span>
        </div>

        {/* Hover Quick Add to Cart Button */}
        <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleQuickAdd}
            aria-label="Quick add to cart"
            className={`w-full py-2.5 px-3 rounded-sm font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 ${
              isAdded 
                ? "bg-[#0C831F] text-white" 
                : "bg-neutral-900/95 hover:bg-banner text-white backdrop-blur-md"
            }`}
          >
            {isAdded ? (
              <>
                <CheckIcon className="w-4 h-4 stroke-[3]" />
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
      <div className="flex flex-col space-y-1">
        <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-semibold">
          {product.category}
        </span>
        <span className="text-base md:text-lg font-serif text-neutral-800 line-clamp-2 leading-tight group-hover:text-banner transition-colors">
          {product.name}
        </span>
        <span className="text-xs font-semibold text-neutral-500 mt-1">
          {product.priceFormatted}
        </span>
      </div>
    </Link>
  );
};

export default CatalogProductCard;
