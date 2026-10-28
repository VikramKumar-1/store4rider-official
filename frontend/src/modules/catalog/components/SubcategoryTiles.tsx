"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Folder } from "lucide-react";

export interface SubcategoryItem {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  bannerImage?: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  parentSlug?: string;
}

interface SubcategoryTilesProps {
  categorySlug?: string;
  categoryName?: string;
  subcategories?: SubcategoryItem[];
}

/**
 * Resolves canonical category URL safely without creating recursive paths
 */
function resolveCategoryHref(item: SubcategoryItem, currentPathname: string): string {
  if (item.href) return item.href;
  if (!item.slug) return "#";
  if (item.slug.startsWith("/")) return item.slug;

  const slug = item.slug.toLowerCase().trim();

  // Helmet subcategories
  if (slug === "half-face-helmets") return "/motorcycle-helmets/open-face-helmets";
  if (slug === "helmet-visors") return "/motorcycle-helmets/helmet-accessories";
  const helmetSlugs = [
    "full-face-helmets", "modular-helmets", "off-road-helmets", "open-face-helmets", "half-face-helmets",
    "helmet-visors", "balaclava", "bluetooth-intercoms", "helmet-cleaners", "helmet-accessories"
  ];
  if (helmetSlugs.includes(slug) || slug.includes("helmet")) {
    return `/motorcycle-helmets/${slug}`;
  }

  // Specialized riding gear root URLs
  if (slug === "women-riding-gear" || slug === "riding-gear-for-women") {
    return "/riding-gear-for-women";
  }

  // Riding gear subcategories
  if (slug === "riding-jacket" || slug === "riding-jackets") {
    return "/riding-gear/riding-jackets";
  }
  if (slug === "protectors-armour") {
    return "/riding-gear/riding-jackets/protectors-armour";
  }
  if (slug === "motorcycle-riding-jeans" || slug === "riding-jeans" || slug === "riding-jean") {
    return "/riding-gear/riding-pants/motorcycle-riding-jeans";
  }
  if (slug === "touring-pants" || slug === "touring-pant") {
    return "/riding-gear/riding-pants/touring-pants";
  }
  if (slug === "knee-guards-bikers" || slug === "knee-guards" || slug === "knee-guard") {
    return "/riding-gear/riding-pants/knee-guards-bikers";
  }
  if (slug === "riding-pants") {
    return "/riding-gear/riding-pants";
  }
  if (slug === "full-gauntlet-gloves") {
    return "/riding-gear/riding-gloves/full-gauntlet-gloves";
  }
  if (slug === "semi-gauntlet-gloves") {
    return "/riding-gear/riding-gloves/semi-gauntlet-gloves";
  }
  if (slug === "short-motorbike-gloves" || slug === "short-cuff-biker-gloves") {
    return "/riding-gear/riding-gloves/short-motorbike-gloves";
  }
  if (slug === "riding-gloves" || slug === "motorcycle-riding-gloves") {
    return "/riding-gear/riding-gloves";
  }
  if (slug === "short-biking-boots") {
    return "/riding-gear/motorcycle-riding-boots/short-biking-boots";
  }
  if (slug === "sports-riding-shoes") {
    return "/riding-gear/motorcycle-riding-boots/sports-riding-shoes";
  }
  if (slug === "off-road-riding-boots" || slug === "off-road-boots") {
    return "/riding-gear/motorcycle-riding-boots/off-road-riding-boots";
  }
  if (slug === "motorcycle-riding-boots") {
    return "/riding-gear/motorcycle-riding-boots";
  }
  if (slug === "off-road-motocross" || slug === "off-road-motocross-riding-gear") {
    return "/riding-gear/off-road-motocross-riding-gear";
  }

  // Luggage subcategories
  if (slug === "tank-bags-bikes" || slug === "tank-bags") {
    return "/motorcycle-bags-bike-luggage/tank-bags-bikes";
  }
  if (slug === "saddle-bags-bikes" || slug === "saddle-bags") {
    return "/motorcycle-bags-bike-luggage/saddle-bags-bikes";
  }
  if (slug === "motorcycle-tail-bags" || slug === "tail-bags") {
    return "/motorcycle-bags-bike-luggage/motorcycle-tail-bags";
  }
  if (slug === "bike-top-box" || slug === "top-box") {
    return "/motorcycle-bags-bike-luggage/bike-top-box";
  }
  if (slug === "hydration-bag" || slug === "hydration-bags") {
    return "/motorcycle-bags-bike-luggage/hydration-bag";
  }
  if (slug === "motorcycle-other-luggage" || slug === "other-luggage") {
    return "/motorcycle-bags-bike-luggage/motorcycle-other-luggage";
  }
  if (slug === "motorcycle-bags-bike-luggage" || slug.includes("bag") || slug.includes("luggage")) {
    return "/motorcycle-bags-bike-luggage";
  }

  if (item.parentSlug) {
    return `/${item.parentSlug}/${slug}`;
  }

  // Default query or root path
  return `/products?category=${slug}`;
}

export const SubcategoryTiles: React.FC<SubcategoryTilesProps> = ({
  categorySlug = "",
  categoryName = "",
  subcategories = [],
}) => {
  const pathname = usePathname();

  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  // Render up to 5 featured / sibling cards as requested for mobile hero section
  const displayItems = subcategories.slice(0, 5);
  const count = displayItems.length;
  const gridLayoutClass =
    count === 5
      ? "grid-cols-5 gap-1.5 min-[380px]:gap-2 sm:gap-3 max-w-2xl"
      : count === 4
      ? "grid-cols-4 gap-2 min-[380px]:gap-2.5 sm:gap-3.5 max-w-xl"
      : count === 2
      ? "grid-cols-2 gap-3 sm:gap-4 max-w-sm"
      : count === 1
      ? "grid-cols-1 max-w-[140px]"
      : "grid-cols-3 gap-2.5 sm:gap-4 max-w-xl";

  return (
    <section className="w-full my-3 sm:my-5" aria-label="Category Navigation Cards">
      <div className={`grid ${gridLayoutClass} mx-auto w-full`}>
        {displayItems.map((item, index) => {
          const href = resolveCategoryHref(item, pathname);
          const rawImage = item.image || item.imageUrl || item.thumbnailUrl || item.bannerImage;

          return (
            <Link
              key={item.id || item._id || item.slug || index}
              href={href}
              className="group flex flex-col items-center select-none text-center min-w-0 w-full"
            >
              {/* Tile Image Card */}
              <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#f5f5f5] border border-slate-200/80 shadow-2xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-slate-300 will-change-transform flex items-center justify-center">
                {rawImage ? (
                  <Image
                    src={rawImage}
                    alt={item.name}
                    fill
                    className={`object-contain ${count >= 4 ? "p-1.5 min-[380px]:p-2" : "p-2"} mix-blend-multiply transition-transform duration-500 group-hover:scale-110`}
                    sizes={count === 5 ? "(max-width: 768px) 20vw, 160px" : count === 4 ? "(max-width: 768px) 25vw, 160px" : "(max-width: 768px) 33vw, 160px"}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-slate-400 bg-gradient-to-b from-slate-50 to-slate-100">
                    <Folder size={count === 5 ? 20 : 28} className="text-slate-300 mb-0.5 sm:mb-1 transition-transform group-hover:scale-110" />
                    <span className="text-[8px] font-semibold text-slate-400 tracking-tight leading-tight">
                      {item.name}
                    </span>
                  </div>
                )}

                {/* Optional Badge inside Tile */}
                {item.badge && (
                  <div className="absolute inset-x-1 bottom-1.5 z-10">
                    <span className={`block truncate text-center text-[6px] min-[375px]:text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-white px-0.5 min-[375px]:px-1 py-0.5 rounded shadow-xs ${item.badgeColor || "bg-brand"}`}>
                      {item.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Category Name Label below Tile */}
              <span className={`mt-1.5 sm:mt-2 ${count === 5 ? "text-[9px] min-[380px]:text-[10px]" : count === 4 ? "text-[9.5px] min-[380px]:text-[10.5px]" : "text-[10px] min-[375px]:text-[11px]"} sm:text-xs font-bold text-slate-900 text-center leading-tight line-clamp-2 w-full group-hover:text-brand transition-colors`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SubcategoryTiles;
