"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { NavItem } from "../../types/homepage.types";

interface NavDesktopLinksProps {
  items: NavItem[];
  isLight: boolean;
  hoveredNavId: string | null;
  hoveredMenuId: string | null;
  onNavEnter: (id: string, hasMega: boolean) => void;
  onNavLeave: () => void;
}

/**
 * Desktop navigation links with animated mega menu dropdowns.
 * Rendered only on lg+ screens (hidden on mobile).
 */
export const NavDesktopLinks: React.FC<NavDesktopLinksProps> = ({
  items,
  isLight,
  hoveredNavId,
  hoveredMenuId,
  onNavEnter,
  onNavLeave,
}) => {
  return (
    <div
      className="hidden lg:flex flex-1 items-center justify-start lg:pl-4 xl:justify-center gap-0 px-0.5 xl:px-2.5 pointer-events-auto whitespace-nowrap static lg:relative"
      onMouseLeave={onNavLeave}
    >
      {items.map((item, idx) => {
        const isHovered = hoveredNavId === item.id;

        return (
          <div
            key={item.id}
            className="group"
            onMouseEnter={() => onNavEnter(item.id, !!item.megaMenuItems)}
          >
            <Link
              href={item.href}
              className={`relative flex items-center gap-1 xl:gap-1.5 text-[9px] lg:text-[10px] xl:text-[11px] 2xl:text-[12px] font-sans font-bold tracking-wider xl:tracking-widest uppercase px-1.5 lg:px-1.5 xl:px-3 py-2 rounded-full transition-colors duration-200 z-10 ${
                isLight
                  ? isHovered ? "text-neutral-950" : "text-neutral-700 hover:text-neutral-950"
                  : isHovered ? "text-white" : "text-white/90 hover:text-white drop-shadow-sm"
              }`}
            >
              {isHovered && (
                <motion.span
                  layoutId="nav-liquid-pill"
                  className={`absolute inset-0 rounded-full -z-10 pointer-events-none ${
                    isLight
                      ? "bg-gradient-to-b from-neutral-900/[0.06] to-neutral-900/[0.09] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_3px_10px_-2px_rgba(0,0,0,0.06)] border border-neutral-900/[0.07]"
                      : "bg-gradient-to-b from-white/[0.18] to-white/[0.10] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_14px_rgba(0,0,0,0.25)] border border-white/20"
                  }`}
                  transition={{ type: "spring", stiffness: 380, damping: 20, mass: 0.5 }}
                />
              )}

              <motion.span
                animate={{ y: isHovered ? -1.5 : 0, scale: isHovered ? 1.03 : 1 }}
                transition={{ type: "spring", stiffness: 450, damping: 22, mass: 0.4 }}
                className="relative z-10 flex items-center gap-1.5"
              >
                <span>{item.label}</span>
                {item.hasDropdown && (
                  <ChevronDownIcon
                    className={`w-3 h-3 transition-transform duration-300 stroke-[2.5] ${
                      hoveredMenuId === item.id ? "rotate-180 text-neutral-900" : isLight ? "text-neutral-400" : "text-white/70"
                    }`}
                  />
                )}
              </motion.span>
            </Link>

            {/* Mega Menu Dropdown */}
            {item.hasDropdown && (item.megaMenuItems || item.megaMenuFeatured) && (
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50 ${
                  hoveredMenuId === item.id ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                <div
                  className={`${
                    item.megaMenuFeatured
                      ? ((item.megaMenuItems?.length ?? 0) >= 3 ? "w-[980px] xl:w-[1120px]" : "w-[860px] xl:w-[980px]")
                      : item.megaMenuItems?.length === 4
                      ? "w-[940px] xl:w-[1080px]" // 4 columns need wider space (landscape)
                      : item.megaMenuItems?.length === 3
                      ? "w-[720px] xl:w-[840px]" // 3 columns
                      : item.megaMenuItems?.length === 2
                      ? "w-[540px] xl:w-[620px]" // 2 columns
                      : "w-[280px]" // 1 column
                  } bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] border border-neutral-200/80 transition-all duration-300 ease-out overflow-hidden transform ring-1 ring-black/[0.04] ${
                    hoveredMenuId === item.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className={`flex ${item.megaMenuFeatured ? "flex-row" : "flex-col"}`}>
                    {/* Left Side: Links */}
                    {item.megaMenuItems && (
                      <div className={`grid ${
                        item.megaMenuItems.length === 1 ? "grid-cols-1" :
                        item.megaMenuItems.length === 2 ? "grid-cols-2" :
                        item.megaMenuItems.length === 3 ? "grid-cols-3" :
                        item.megaMenuItems.length === 4 ? "grid-cols-4" :
                        "grid-cols-3" // For 5+ use 3 columns
                      } gap-x-8 gap-y-8 p-8 ${item.megaMenuFeatured ? "w-[65%] border-r border-neutral-200/60" : "w-full"}`}>
                        {item.megaMenuItems.map((menuGroup, idx) => (
                          <div key={idx} className="min-w-0 w-full">
                            {menuGroup.groupHref ? (
                              <Link href={menuGroup.groupHref} className="mb-4 block">
                                <h4 className="text-[13px] font-bold text-neutral-900 uppercase tracking-widest border-b border-neutral-200/60 pb-2.5 flex items-start gap-2 leading-snug hover:text-brand transition-colors">
                                  <span className="w-1.5 h-1.5 rounded-full bg-banner shadow-[0_0_8px_rgba(255,84,41,0.6)] shrink-0 mt-1.5" />
                                  <span className="flex-1 min-w-0 break-words whitespace-normal">{menuGroup.group}</span>
                                </h4>
                              </Link>
                            ) : (
                              <h4 className="text-[13px] font-bold text-neutral-900 uppercase tracking-widest mb-4 border-b border-neutral-200/60 pb-2.5 flex items-start gap-2 leading-snug">
                                <span className="w-1.5 h-1.5 rounded-full bg-banner shadow-[0_0_8px_rgba(255,84,41,0.6)] shrink-0 mt-1.5" />
                                <span className="flex-1 min-w-0 break-words whitespace-normal">{menuGroup.group}</span>
                              </h4>
                            )}
                            <ul className="flex flex-col gap-1 w-full">
                              {menuGroup.items.map((link, lIdx) => (
                                <li key={lIdx} className="w-full">
                                  <Link
                                    href={link.href}
                                    className="text-[14px] font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-xl px-3 py-2 -mx-3 transition-all duration-300 flex items-start gap-3.5 group w-full"
                                  >
                                    {link.logoUrl && (
                                      <div className="w-11 h-6 flex items-center justify-center shrink-0 mt-0.5">
                                        <Image 
                                          src={link.logoUrl} 
                                          alt={link.label} 
                                          width={44} 
                                          height={24} 
                                          className="object-contain max-h-full max-w-full mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                                        />
                                      </div>
                                    )}
                                    <span className="group-hover:translate-x-1 transition-transform duration-300 flex-1 min-w-0 break-words whitespace-normal leading-tight">{link.label}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Right Side: Featured / Trending Products / Banner */}
                    {item.megaMenuFeatured && (
                      <div className="w-[35%] p-6 bg-neutral-50/80 flex flex-col h-full">
                        {item.megaMenuFeatured.title && (
                          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-4 flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-banner" />
                            {item.megaMenuFeatured.title}
                          </h4>
                        )}
                        
                        {item.megaMenuFeatured.bannerImage ? (
                          <Link 
                            href={item.megaMenuFeatured.bannerImage.href}
                            className="relative w-full h-full min-h-[250px] rounded-xl overflow-hidden group flex-1"
                          >
                            <Image
                              src={item.megaMenuFeatured.bannerImage.imageUrl}
                              alt={item.megaMenuFeatured.bannerImage.altText || "Promotional Banner"}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>
                        ) : item.megaMenuFeatured.items ? (
                          <div className="grid grid-cols-2 gap-4">
                            {item.megaMenuFeatured.items.map((feat, fIdx) => (
                              <Link 
                                key={fIdx} 
                                href={feat.href}
                                className="group flex flex-col gap-2 p-2 bg-white rounded-xl shadow-sm border border-neutral-100 hover:shadow-md hover:border-neutral-200 transition-all duration-200"
                              >
                                <div className="relative w-full aspect-square bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
                                  {feat.imageUrl ? (
                                    <Image 
                                      src={feat.imageUrl}
                                      alt={feat.name}
                                      fill
                                      sizes="120px"
                                      className="object-contain group-hover:scale-105 transition-transform duration-300 p-1"
                                    />
                                  ) : (
                                    <span className="text-xs text-neutral-400">No Image</span>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold text-neutral-800 leading-tight line-clamp-2">
                                    {feat.name}
                                  </span>
                                  {feat.priceFormatted && (
                                    <span className="text-xs font-bold text-banner mt-1">
                                      {feat.priceFormatted}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
