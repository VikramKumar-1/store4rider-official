"use client";

import React from "react";
import { CatalogProductCard } from "./CatalogProductCard";
import { CatalogProduct } from "../types/catalog.types";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

interface CatalogGridProps {
  products: CatalogProduct[];
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ products }) => {
  return (
    <div className="flex flex-col w-full">
      
      {/* 3-Column Product Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {products.map((product) => (
          <CatalogProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination Container matching Figma design */}
      <div className="mt-16 flex justify-end">
        <div className="flex items-center gap-1 text-xs font-semibold text-neutral-400">
          <button className="w-8 h-8 flex items-center justify-center hover:text-banner transition-colors">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          
          <button className="w-6 h-6 flex items-center justify-center border border-neutral-800 text-neutral-800 bg-white">1</button>
          <button className="w-6 h-6 flex items-center justify-center border border-transparent hover:border-neutral-200 transition-colors">2</button>
          <button className="w-6 h-6 flex items-center justify-center border border-transparent hover:border-neutral-200 transition-colors">3</button>
          <button className="w-6 h-6 flex items-center justify-center border border-transparent hover:border-neutral-200 transition-colors">4</button>
          <button className="w-6 h-6 flex items-center justify-center border border-transparent hover:border-neutral-200 transition-colors">5</button>
          <span className="px-1">...</span>
          <button className="w-6 h-6 flex items-center justify-center border border-transparent hover:border-neutral-200 transition-colors">10</button>

          <button className="w-8 h-8 flex items-center justify-center hover:text-banner transition-colors">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
    </div>
  );
};
