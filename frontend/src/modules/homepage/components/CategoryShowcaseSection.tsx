"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CategoryShowcaseCardData,
  CategoryShowcaseSectionProps,
} from "../types/homepage.types";

/**
 * Default Category Showcase cards matching the store catalog structure.
 */
const DEFAULT_CARDS: CategoryShowcaseCardData[] = [
  {
    id: "boots",
    title: "RIDING BOOTS",
    description:
      "Short biking boots, sports riding shoes and off-road boots with ankle and shin protection.",
    linkUrl: "/riding-gear/riding-boots",
    placeholderText: "PHOTO: RIDING BOOTS",
  },
  {
    id: "pants",
    title: "RIDING PANTS",
    description:
      "Riding pants, riding jeans and touring pants with removable knee and hip armour.",
    linkUrl: "/riding-gear/riding-pants",
    placeholderText: "PHOTO: RIDING PANTS WITH KNEE ARMOUR",
  },
  {
    id: "luggage",
    title: "MOTORCYCLE LUGGAGE",
    description:
      "Tank bags, saddle bags, tail bags and top boxes for weekend rides and long tours.",
    linkUrl: "/luggage",
    placeholderText: "PHOTO: TAIL BAG ON A TOURING BIKE",
  },
  {
    id: "accessories-spares",
    title: "BIKE ACCESSORIES AND SPARES",
    description:
      "Auxiliary lights, spark plugs, performance air filters, chains and chain care. New to chain maintenance? Start with our ",
    linkUrl: "/bike-accessories",
    placeholderText: "PHOTO: AUXILIARY LIGHTS AND CHAIN CARE",
    guideLinkText: "chain lubing guide.",
    guideLinkUrl: "/products?q=chain+lube",
  },
];

/**
 * CategoryShowcaseSection Component
 *
 * Sized and styled identically to other homepage sections (BrowseProductsSection).
 * - Horizontally scrollable on mobile (flex overflow-x-auto snap-x), 4 columns on desktop (lg:grid-cols-4).
 * - Standard aspect-square image container matching the site's card dimensions.
 * - Store4Riders brand & banner color theme (no external blue colors).
 */
export const CategoryShowcaseSection: React.FC<CategoryShowcaseSectionProps> = ({
  title = "RIDER'S ESSENTIAL GEAR",
  subtitle,
  cards = DEFAULT_CARDS,
  bottomNoteText = "Looking for motocross kit? Browse ",
  bottomNoteLinkText = "off-road and motocross gear.",
  bottomNoteLinkUrl = "/products?q=motocross",
  className = "",
}) => {
  return (
    <section className={`w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-14 bg-white ${className}`}>
      {/* Section Header matching other sections */}
      {title && (
        <div className="text-center mb-6 md:mb-12 px-0 sm:px-4">
          <h2 className="font-sans text-[14px] min-[360px]:text-[15.5px] min-[390px]:text-[17px] sm:text-2xl md:text-3xl lg:text-[38px] xl:text-[40px] font-extrabold text-neutral-900 uppercase tracking-tight sm:tracking-wide md:tracking-wider leading-tight">
            {title}
          </h2>
          <div className="w-10 sm:w-12 md:w-16 h-0.5 sm:h-1 bg-banner mx-auto mt-2 sm:mt-2.5 md:mt-4 rounded-full" />
          {subtitle && (
            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-neutral-600 font-medium max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Horizontally scrollable on Mobile, 4 columns on Desktop */}
      <div className="flex lg:grid lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 overflow-x-auto lg:overflow-visible scroll-smooth snap-x snap-mandatory pb-3 lg:pb-0 hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
        {cards.map((card) => {
          return (
            <div
              key={card.id}
              className="snap-start shrink-0 w-[210px] min-[360px]:w-[230px] min-[390px]:w-[250px] sm:w-[270px] md:w-[290px] lg:w-full flex flex-col group cursor-pointer h-full"
            >
              {/* Image Container matching exact site card size */}
              <Link
                href={card.linkUrl}
                className="relative aspect-square w-full bg-[#f4f4f4] overflow-hidden mb-2 md:mb-3 group/image flex items-center justify-center rounded-lg block"
              >
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.title}
                    fill
                    className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center px-3 text-center"
                    style={{
                      background:
                        "repeating-linear-gradient(-45deg, #e5e0d7, #e5e0d7 12px, #f3efe8 12px, #f3efe8 24px)",
                    }}
                  >
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#797267] uppercase select-none drop-shadow-sm leading-snug">
                      {card.placeholderText}
                    </span>
                  </div>
                )}

                {/* Rating / Category Badge */}
                <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-banner text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10 shadow-sm">
                  <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-white fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>TOP</span>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto bg-black/5 z-20 hidden lg:flex">
                  <span className="bg-banner hover:bg-orange-600 text-white w-[85%] py-2.5 rounded flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out select-none">
                    EXPLORE NOW
                  </span>
                </div>
              </Link>

              {/* Card Details with Store Theme */}
              <div className="flex flex-col space-y-0.5 md:space-y-1 mt-1">
                <Link href={card.linkUrl} className="block">
                  <h3 className="font-sans font-bold text-[12px] md:text-[14px] text-neutral-900 line-clamp-1 leading-tight group-hover:text-banner transition-colors uppercase">
                    {card.title}
                  </h3>
                </Link>

                <p className="text-[11px] md:text-xs text-neutral-600 font-sans line-clamp-2 leading-relaxed">
                  {card.description}
                  {card.guideLinkText && (
                    <Link
                      href={card.guideLinkUrl || "/products"}
                      className="text-banner font-bold hover:underline ml-0.5 inline"
                    >
                      {card.guideLinkText}
                    </Link>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Motocross Note */}
      <div className="mt-8 md:mt-10 text-center text-neutral-700 text-xs sm:text-sm font-medium">
        <span>{bottomNoteText}</span>
        <Link
          href={bottomNoteLinkUrl}
          className="text-banner font-bold hover:underline transition-colors ml-1"
        >
          {bottomNoteLinkText}
        </Link>
      </div>
    </section>
  );
};

export default CategoryShowcaseSection;
