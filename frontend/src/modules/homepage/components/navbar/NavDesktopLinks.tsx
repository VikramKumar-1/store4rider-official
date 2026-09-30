"use client";

import React from "react";
import Link from "next/link";
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
      className="hidden lg:flex flex-1 items-center justify-center gap-0.5 px-4 pointer-events-auto whitespace-nowrap"
      onMouseLeave={onNavLeave}
    >
      {items.map((item) => {
        const isHovered = hoveredNavId === item.id;
        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => onNavEnter(item.id, !!item.megaMenuItems)}
          >
            <Link
              href={item.href}
              className={`relative flex items-center gap-1.5 text-[11px] xl:text-[12px] font-sans font-bold tracking-widest uppercase px-3.5 py-2 rounded-full transition-colors duration-200 z-10 ${
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
            {item.hasDropdown && item.megaMenuItems && (
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[420px] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] border border-neutral-200/80 z-50 transition-all duration-300 ease-out overflow-hidden transform ring-1 ring-black/[0.04] ${
                  hoveredMenuId === item.id
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-2 pointer-events-none"
                }`}
              >
                <div className="grid grid-cols-2 gap-6 p-6">
                  {item.megaMenuItems.map((menuGroup, idx) => (
                    <div key={idx}>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-3 border-b border-neutral-200/60 pb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                        {menuGroup.group}
                      </h4>
                      <ul className="flex flex-col gap-1.5">
                        {menuGroup.items.map((link, lIdx) => (
                          <li key={lIdx}>
                            <Link
                              href={link.href}
                              className="text-[13px] font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-900/[0.05] rounded-lg px-2.5 py-1 -mx-2.5 hover:translate-x-1 transition-all duration-200 block"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
