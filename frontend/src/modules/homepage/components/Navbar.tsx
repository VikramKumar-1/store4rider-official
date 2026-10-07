"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon, ShoppingBagIcon, MagnifyingGlassIcon, XMarkIcon, HeartIcon } from "@heroicons/react/24/outline";
import { NavbarProps } from "../types/homepage.types";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { SearchAutocomplete } from "@/modules/search/components/SearchAutocomplete";
import { NavItem } from "../types/homepage.types";
import { DEFAULT_NAV_ITEMS } from "./navbar/nav.constants";
import { NavDesktopLinks } from "./navbar/NavDesktopLinks";
import { NavUserMenu } from "./navbar/NavUserMenu";
import { NavMobileDrawer } from "./navbar/NavMobileDrawer";
import { useCategoryTree } from "@/core/hooks/useCategories";
import { useBrands } from "@/core/hooks/useBrands";
import { generateNavItems } from "../utils/navigation.utils";

/**
 * Navbar — thin orchestration shell.
 * All visual sub-sections live in ./navbar/:
 *   NavDesktopLinks  → desktop links + mega menu
 *   NavUserMenu      → desktop user dropdown
 *   NavMobileDrawer  → mobile slide-in drawer
 *   nav.constants    → DEFAULT_NAV_ITEMS data
 */
export const Navbar: React.FC<NavbarProps> = ({
  logoText = "Store4Riders",
  navItems,
  onSearch,
  onAccountClick,
  theme = "light",
}) => {
  const items = useCartStore((state) => state.items);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { data: brands } = useBrands();
  const { data: categoryTreeData } = useCategoryTree();

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null!);

  useEffect(() => { setMounted(true); }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  // Optimized scroll listener (rAF-based, zero jitter)
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalItemCount = mounted ? items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0;
  const isLight = theme === "light" || isScrolled;
  
  // The client explicitly requested the hardcoded navbar only, but we will filter out empty brands later
  // We will clone DEFAULT_NAV_ITEMS and inject the real database brands into the "Shop By Brand" dropdown
  const activeNavItems = React.useMemo(() => {
    if (navItems) return navItems;
    
    // Deep clone to avoid mutating the constant
    const cloned = JSON.parse(JSON.stringify(DEFAULT_NAV_ITEMS));
    
    // Find the Shop By Brand item
    const brandItem = cloned.find((item: any) => item.id === "shop-by-brand");
    
    if (brandItem && brands && brands.length > 0) {
      // Chunk brands into groups of 9 for the mega menu columns
      const brandGroups = [];
      for (let i = 0; i < brands.length; i += 9) {
        brandGroups.push(brands.slice(i, i + 9));
      }
      
      brandItem.megaMenuItems = brandGroups.map((group: any[], index: number) => ({
        group: `Brands Part ${index + 1}`,
        items: group.map((b: any) => ({
          label: b.name,
          href: `/brands/${b.slug}`,
          logoUrl: b.logoUrl || undefined,
        })),
      }));
    }
    
    return cloned;
  }, [navItems, categoryTreeData, brands]);

  return (
    <>
      <header
        className={`w-full z-50 ${theme === "light"
            ? "sticky top-0"
            : `fixed left-0 right-0 transition-all duration-300 ${isScrolled ? "top-0" : "top-[32px]"}`
          }`}
      >
        {/* Glassmorphic backdrop */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out pointer-events-none ${theme === "light"
              ? "bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
              : isScrolled
                ? "opacity-100 bg-white/90 backdrop-blur-md border-b border-neutral-200/60 shadow-sm"
                : "opacity-0 bg-white/0"
            }`}
        />

        <nav className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-3 xl:px-4 py-3.5 flex items-center justify-between">
          {/* Logo (Fades out on mobile when search is open) */}
          <Link
            href="/"
            className={`items-center group transition-opacity duration-200 ${isMobileSearchOpen ? "opacity-0 pointer-events-none sm:flex sm:opacity-100 sm:pointer-events-auto" : "flex opacity-100"
              }`}
          >
            <div className="relative h-6 w-28 sm:h-7 sm:w-32 md:h-8 md:w-36 lg:h-8 lg:w-40 xl:h-9 xl:w-44 transition-transform duration-300 group-hover:scale-105 will-change-transform">
              <Image
                src="/Store4riders-Logo.jpg"
                alt={logoText || "Store4Riders Logo"}
                fill
                className="object-contain object-left"
                sizes="(max-width: 768px) 144px, 200px"
                priority
              />
            </div>
          </Link>

          {/* Desktop nav links */}
          <NavDesktopLinks
            items={activeNavItems}
            isLight={isLight}
            hoveredNavId={hoveredNavId}
            hoveredMenuId={hoveredMenuId}
            onNavEnter={(id, hasMega) => {
              setHoveredNavId(id);
              setHoveredMenuId(hasMega ? id : null);
            }}
            onNavLeave={() => { setHoveredNavId(null); setHoveredMenuId(null); }}
          />

          {/* Right actions (Fades out on mobile when search is open) */}
          <div className={`flex items-center gap-1 sm:gap-3 transition-opacity duration-200 ${isMobileSearchOpen ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto" : "opacity-100"
            }`}>

            {/* Desktop Search Input (Hidden on tablets/small laptops to save space) */}
            <div className="hidden sm:block shrink-0">
              <SearchAutocomplete isLight={isLight} />
            </div>

            {/* Mobile/Tablet Search Toggle Icon */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Search"
              className={`sm:hidden p-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${isLight
                  ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.06]"
                  : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className={`relative p-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${isLight
                  ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.06]"
                  : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
            >
              <ShoppingBagIcon className="w-5 h-5 stroke-[1.75]" />
              {totalItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-banner text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItemCount > 99 ? "99+" : totalItemCount}
                </span>
              )}
            </Link>

            {/* User menu (desktop only) */}
            <NavUserMenu
              isLight={isLight}
              isOpen={isUserMenuOpen}
              mounted={mounted}
              isAuthenticated={isAuthenticated}
              user={user}
              onToggle={() => {
                if (onAccountClick) onAccountClick();
                else setIsUserMenuOpen((v) => !v);
              }}
              onClose={() => setIsUserMenuOpen(false)}
              onLogout={() => { logout(); setIsUserMenuOpen(false); }}
              menuRef={userMenuRef}
            />

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              className={`lg:hidden p-2.5 rounded-full transition-all active:scale-95 ${isLight
                  ? "text-neutral-700 hover:bg-neutral-900/[0.06]"
                  : "text-white/90 hover:bg-white/10"
                }`}
            >
              <Bars3Icon className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Mobile Full-Width Search Overlay with Smooth Fluid Motion */}
          <div
            className={`absolute inset-x-3.5 top-1/2 -translate-y-1/2 z-30 sm:hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${isMobileSearchOpen
                ? "opacity-100 scale-100 translate-y-[-50%] pointer-events-auto"
                : "opacity-0 scale-95 translate-y-[-45%] pointer-events-none"
              }`}
          >
            <SearchAutocomplete
              isLight={isLight}
              isMobileFull={true}
              onClose={() => setIsMobileSearchOpen(false)}
            />
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <NavMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={activeNavItems}
        mounted={mounted}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={logout}
      />
    </>
  );
};

export default Navbar;
