"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

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
  if (slug === "touring-gear") {
    return "/riding-gear/touring-gear";
  }
  if (slug === "monsoon-gear" || slug === "monsoon-gear-for-riders") {
    return "/riding-gear/monsoon-gear-for-riders";
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
  if (slug === "crash-bar-bags" || slug === "crash-bar-bag") {
    return "/motorcycle-bags-bike-luggage/crash-bar-bags";
  }
  if (slug === "thigh-bags" || slug === "thigh-bag") {
    return "/motorcycle-bags-bike-luggage/thigh-bags";
  }
  if (slug === "helmet-bags" || slug === "helmet-bag") {
    return "/motorcycle-bags-bike-luggage/helmet-bags";
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

const BRAND_LOGOS: Record<string, string> = {
  rynox: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/new-rynox-logo-black.png",
  ls2: "/brands/ls2.svg",
  axor: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/axor-logo_bw_100x51.png",
  smk: "/brands/smk.svg",
  agv: "/brands/agv.svg",
  alpinestars: "/brands/alpinestars.svg",
  bluarmor: "/brands/bluarmor.svg",
  dsg: "/brands/dsg.svg",
  hjc: "/brands/hjc.svg",
  mt: "/brands/mt.svg",
  shima: "/brands/shima.svg",
  raida: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Raida.png",
  furygan: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Furygan.png",
  mototech: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MotoTech.png",
  scala: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/scala.png",
  invictus: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Invictus.png",
  "lone-ranger": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Lone-Ranger.png",
  "fly-racing": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Flyracing-logo_1_.png",
  forma: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Forma.png",
  falco: "https://www.store4riders.com/media/codazon_cache/brand/120x120/Background.png",
  "safe-tech": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Safe-tech.jpg",
  "sas-tec": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/SAS-TEC-Logo-.jpg",
  maddog: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/maddog-logo-2.png",
  parani: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/PARANI-LOGO.png",
  "moto-fusion": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/mf.png",
  motospunk: "/brands/motospunk.svg",
  quipco: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Quipco.jpg",
  shoerella: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Shoerella-logo.jpg",
  motul: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Motul-logo.png",
  "k-n": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/K_N-Logo.png",
  bmc: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BMC_Air_filter_logo.png",
  ngk: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/NGK.png",
  rolon: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/rolon.jpg",
  "barrel-exhaust": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Barrel-Exhaust.png",
  "moto-torque": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MOTO-TORQUE-LOGO.jpg",
  "pro-spec": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Pro-Spec-logo.png",
  "race-dynamics": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/RaceDynamics_Logohi-res_Primary.png",
  carberry: "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Carberry.png",
};

/**
 * Resolves the display image for a category card:
 * 1. Admin uploaded image on category (highest priority)
 * 2. Brand logo if category matches a known brand
 * 3. Relevant category apparel fallback image from public store assets
 */
function resolveItemImage(item: SubcategoryItem): string | null {
  const directImage = item.image || item.imageUrl || item.thumbnailUrl || item.bannerImage;
  if (directImage && directImage.trim() !== "") {
    return directImage.trim();
  }

  const slug = (item.slug || "").toLowerCase();
  const name = (item.name || "").toLowerCase();

  for (const [brandKey, logoUrl] of Object.entries(BRAND_LOGOS)) {
    if (slug.includes(brandKey) || name.includes(brandKey.replace(/-/g, " "))) {
      return logoUrl;
    }
  }

  if (slug.includes("glove") || name.includes("glove")) {
    return "/glovescat.jpg";
  }
  if (slug.includes("helmet") || name.includes("helmet") || slug.includes("visor") || name.includes("visor")) {
    return "/helmetcat.jpg";
  }
  if (slug.includes("jacket") || name.includes("jacket") || slug.includes("suit") || name.includes("suit")) {
    return "/jacketcat.jpg";
  }

  return null;
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

  // Render up to 12 featured cards for mobile hero section
  const displayItems = subcategories.slice(0, 12);
  const count = displayItems.length;
  const gridLayoutClass =
    count > 5
      ? "grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-5 gap-2 min-[380px]:gap-2.5 sm:gap-3 max-w-2xl"
      : count === 5
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
          const resolvedImage = resolveItemImage(item);

          return (
            <Link
              key={item.id || item._id || item.slug || index}
              href={href}
              className="group flex flex-col items-center select-none text-center min-w-0 w-full"
            >
              {/* Tile Image Card */}
              <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#f5f5f5] border border-slate-200/80 shadow-2xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-slate-300 will-change-transform flex items-center justify-center p-1.5 sm:p-2">
                {resolvedImage ? (
                  <Image
                    src={resolvedImage}
                    alt={item.name}
                    fill
                    className={`object-contain ${count >= 4 ? "p-1.5 min-[380px]:p-2" : "p-2"} mix-blend-multiply transition-transform duration-500 group-hover:scale-110`}
                    sizes={count === 5 ? "(max-width: 768px) 20vw, 160px" : count === 4 ? "(max-width: 768px) 25vw, 160px" : "(max-width: 768px) 33vw, 160px"}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-slate-400 bg-gradient-to-b from-slate-50 to-slate-100/80">
                    <Shield size={count === 5 ? 22 : 28} className="text-slate-300 transition-transform group-hover:scale-110" />
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

              {/* Authoritative Category Name Label below Tile (Rendered once cleanly) */}
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
