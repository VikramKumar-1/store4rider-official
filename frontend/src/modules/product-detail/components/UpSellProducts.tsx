"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { KitProduct } from "../types/product-detail.types";

export const UpSellProducts: React.FC<{ products: KitProduct[] }> = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="w-full mt-10 md:mt-12 mb-32 md:mb-40 border-t-2 border-neutral-100 pt-8 md:pt-10">
      <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-800 mb-8 px-4 md:px-0">
        UP SELL PRODUCTS
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={product.productUrl}
            className="group flex flex-col gap-3"
          >
            <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden rounded-sm">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute top-2 right-2 bg-banner text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
                NEW
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] text-neutral-400 uppercase tracking-widest">{product.category}</span>
              <span className="text-sm md:text-base font-serif text-neutral-800 line-clamp-1">{product.name}</span>
              <span className="text-[10px] md:text-xs font-semibold text-neutral-500">{product.priceFormatted}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
