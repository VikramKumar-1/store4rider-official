"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  badge?: string;
  badgeColor?: string;
}

interface SubcategoryTilesProps {
  categorySlug?: string;
  categoryName?: string;
  subcategories?: SubcategoryItem[];
}

/**
 * Default fallback subcategories for demonstration matching wireframe
 */
const DEFAULT_GLOVES_SUBCATS: SubcategoryItem[] = [
  {
    id: "sub-1",
    name: "Full Gauntlet Gloves",
    slug: "full-gauntlet-gloves",
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80",
    badge: "Full Gauntlet Gloves",
    badgeColor: "bg-[#E63920]",
  },
  {
    id: "sub-2",
    name: "Semi Gauntlet Gloves",
    slug: "semi-gauntlet-gloves",
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=500&q=80",
    badge: "Semi Gauntlet Gloves",
    badgeColor: "bg-[#2563EB]",
  },
  {
    id: "sub-3",
    name: "Short Motorbike Gloves",
    slug: "short-motorbike-gloves",
    imageUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=500&q=80",
    badge: "Short Motorbike Gloves",
    badgeColor: "bg-neutral-900/80",
  },
];

export const SubcategoryTiles: React.FC<SubcategoryTilesProps> = ({
  categorySlug = "gloves",
  categoryName = "Riding Gloves | Biker Gloves",
  subcategories,
}) => {
  // Use provided subcategories, or smart wireframe defaults
  const items = (subcategories && subcategories.length > 0) 
    ? subcategories 
    : DEFAULT_GLOVES_SUBCATS;

  return (
    <section className="w-full my-4">
      {/* 3 Tiles in a row on mobile, matching wireframe exact layout */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {items.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            href={`/products?category=${item.slug}`}
            className="group flex flex-col items-center select-none"
          >
            {/* Tile Image Card */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs transition-transform duration-300 group-hover:scale-105 will-change-transform">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 33vw, 150px"
              />

              {/* Bottom Badge inside Tile (as in wireframe) */}
              {item.badge && (
                <div className="absolute inset-x-1 bottom-1 z-10">
                  <span className={`block truncate text-center text-[7px] min-[375px]:text-[8px] font-black uppercase tracking-wider text-white px-1 py-0.5 rounded-sm ${item.badgeColor || "bg-banner"} shadow-xs`}>
                    {item.badge}
                  </span>
                </div>
              )}

              {/* Subtle top-to-bottom dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            </div>

            {/* Label below Tile */}
            <span className="mt-1.5 text-[9px] min-[375px]:text-[10px] sm:text-xs font-bold text-neutral-800 text-center truncate w-full group-hover:text-banner transition-colors">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SubcategoryTiles;
