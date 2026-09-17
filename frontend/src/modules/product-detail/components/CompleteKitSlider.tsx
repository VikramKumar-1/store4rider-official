"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { KitProduct } from "../types/product-detail.types";

export const CompleteKitSlider: React.FC<{ products: KitProduct[] }> = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-neutral-800 mb-5">
        COMPLETE YOUR KIT ( 1 PRODUCT FROM EACH RIDING GEAR CATEGORY )
      </h3>
      
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={product.productUrl}
            className="group shrink-0 w-[140px] md:w-[160px] snap-start flex flex-col gap-2"
          >
            <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden rounded-sm">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 140px, 160px"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-400 uppercase tracking-widest">{product.category}</span>
              <span className="text-xs font-serif text-neutral-800 truncate">{product.name}</span>
              <span className="text-[10px] text-neutral-500">{product.priceFormatted}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
