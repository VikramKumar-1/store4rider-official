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
  const helmetSlugs = [
    "full-face-helmets", "modular-helmets", "off-road-helmets", "half-face-helmets",
    "helmet-visors", "balaclava", "bluetooth-intercoms", "helmet-cleaners", "helmet-accessories"
  ];
  if (helmetSlugs.includes(slug) || slug.includes("helmet")) {
    return `/motorcycle-helmets/${slug}`;
  }

  // Riding gear subcategories
  const gearSlugs = [
    "riding-jacket", "protectors-armour", "riding-pants", "riding-jeans", "touring-pants",
    "knee-guards", "motorcycle-riding-gloves", "full-gauntlet-gloves", "semi-gauntlet-gloves",
    "short-motorbike-gloves", "motorcycle-riding-boots", "short-biking-boots", "sports-riding-shoes"
  ];
  if (gearSlugs.includes(slug)) {
    return `/riding-gear/${slug}`;
  }

  // Luggage subcategories
  const luggageSlugs = ["tank-bags", "saddle-bags", "tail-bags", "backpacks", "top-box"];
  if (luggageSlugs.includes(slug) || slug.includes("bag") || slug.includes("luggage")) {
    return `/luggage-touring/${slug}`;
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

  // Render top 3 featured / sibling cards as requested for mobile hero section
  const displayItems = subcategories.slice(0, 3);

  return (
    <section className="w-full my-3 sm:my-5" aria-label="Category Navigation Cards">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-xl mx-auto">
        {displayItems.map((item, index) => {
          const href = resolveCategoryHref(item, pathname);
          const rawImage = item.image || item.imageUrl || item.thumbnailUrl || item.bannerImage;

          return (
            <Link
              key={item.id || item._id || item.slug || index}
              href={href}
              className="group flex flex-col items-center select-none text-center"
            >
              {/* Tile Image Card */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f5f5f5] border border-slate-200/80 shadow-2xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-slate-300 will-change-transform flex items-center justify-center">
                {rawImage ? (
                  <Image
                    src={rawImage}
                    alt={item.name}
                    fill
                    className="object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 33vw, 160px"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-slate-400 bg-gradient-to-b from-slate-50 to-slate-100">
                    <Folder size={28} className="text-slate-300 mb-1 transition-transform group-hover:scale-110" />
                    <span className="text-[8px] font-semibold text-slate-400 tracking-tight leading-tight">
                      {item.name}
                    </span>
                  </div>
                )}

                {/* Optional Badge inside Tile */}
                {item.badge && (
                  <div className="absolute inset-x-1 bottom-1.5 z-10">
                    <span className={`block truncate text-center text-[7px] min-[375px]:text-[8px] font-black uppercase tracking-wider text-white px-1 py-0.5 rounded shadow-xs ${item.badgeColor || "bg-brand"}`}>
                      {item.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Category Name Label below Tile */}
              <span className="mt-2 text-[10px] min-[375px]:text-[11px] sm:text-xs font-bold text-slate-900 text-center leading-tight line-clamp-2 w-full group-hover:text-brand transition-colors">
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
