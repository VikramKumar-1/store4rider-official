"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bars3Icon, ShoppingBagIcon, MagnifyingGlassIcon, XMarkIcon, HeartIcon, UserIcon } from "@heroicons/react/24/outline";
import { NavbarProps } from "../types/homepage.types";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { SearchAutocomplete } from "@/modules/search/components/SearchAutocomplete";
import { NavItem } from "../types/homepage.types";
import { DEFAULT_NAV_ITEMS } from "./navbar/nav.constants";
import { NavDesktopLinks } from "./navbar/NavDesktopLinks";
import { NavUserMenu } from "./navbar/NavUserMenu";
import { NavMobileDrawer } from "./navbar/NavMobileDrawer";

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
  hasTopBanner = true,
}) => {
  const items = useCartStore((state) => state.items);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null!);
  const navCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNavEnter = (id: string, hasMega: boolean) => {
    if (navCloseTimeoutRef.current) {
      clearTimeout(navCloseTimeoutRef.current);
      navCloseTimeoutRef.current = null;
    }
    setHoveredNavId(id);
    setHoveredMenuId(hasMega ? id : null);
  };

  const handleNavLeave = () => {
    if (navCloseTimeoutRef.current) {
      clearTimeout(navCloseTimeoutRef.current);
    }
    navCloseTimeoutRef.current = setTimeout(() => {
      setHoveredNavId(null);
      setHoveredMenuId(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (navCloseTimeoutRef.current) clearTimeout(navCloseTimeoutRef.current);
    };
  }, []);

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
  
  // ⚠️ CRITICAL: DO NOT MAKE NAVBAR DYNAMIC. The storefront navigation MUST strictly use DEFAULT_NAV_ITEMS.
  const activeNavItems = navItems || DEFAULT_NAV_ITEMS;

  return (
    <>
      <header
        className={`w-full z-50 ${theme === "light"
            ? "sticky top-0"
            : `fixed left-0 right-0 transition-all duration-300 ${isScrolled ? "top-0" : hasTopBanner ? "top-[36px] sm:top-[40px]" : "top-0"}`
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

        <nav className="relative z-10 w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-3 xl:px-5 py-2 sm:py-2.5 xl:py-3 flex items-center justify-between gap-2 lg:gap-2.5 xl:gap-5 2xl:gap-6">
                    {/* Logo (Fades out on mobile when search is open) */}
          <Link
            href="/"
            className={`shrink-0 items-center group transition-all duration-200 ${isMobileSearchOpen ? "opacity-0 pointer-events-none sm:flex sm:opacity-100 sm:pointer-events-auto" : "flex opacity-100"
              }`}
          >
            <div className="relative h-[27.6px] w-[104px] sm:h-8 sm:w-[120px] md:h-9 md:w-[135px] lg:h-[34px] lg:w-[128px] xl:h-[42px] xl:w-[158px] 2xl:h-[46px] 2xl:w-[175px] transition-transform duration-300 group-hover:scale-105 will-change-transform">
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
            onNavEnter={handleNavEnter}
            onNavLeave={handleNavLeave}
          />

          {/* Right actions (Fades out on mobile when search is open) */}
          <div className={`flex items-center gap-1 sm:gap-1.5 lg:gap-1 xl:gap-2 shrink-0 transition-opacity duration-200 ${isMobileSearchOpen ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto" : "opacity-100"
            }`}>

            {/* Desktop Search Input (Hidden on tablets/small laptops to save space) */}
            <div className="hidden sm:block shrink-0">
              <SearchAutocomplete isLight={isLight} />
            </div>

            {/* Mobile/Tablet Search Toggle Icon */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Search"
              suppressHydrationWarning
              className={`sm:hidden p-2 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${isLight
                  ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.06]"
                  : "text-white bg-black/45 backdrop-blur-md border border-white/20 hover:bg-black/70 shadow-md"
                }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className={`relative p-2 xl:p-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${isLight
                  ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.06]"
                  : "text-white bg-black/45 backdrop-blur-md border border-white/20 hover:bg-black/70 shadow-md ring-1 ring-white/10"
                }`}
            >
              <ShoppingBagIcon className="w-5 h-5 stroke-[1.75]" />
              {totalItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-banner text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItemCount > 99 ? "99+" : totalItemCount}
                </span>
              )}
            </Link>

            {/* User Account Link (mobile only) */}
            <Link
              href={mounted && isAuthenticated ? "/account" : "/login"}
              aria-label="User Account"
              suppressHydrationWarning
              className={`lg:hidden relative p-2 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${isLight
                  ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.06]"
                  : "text-white bg-black/45 backdrop-blur-md border border-white/20 hover:bg-black/70 shadow-md"
                }`}
            >
              <UserIcon className="w-5 h-5 stroke-[1.75]" />
              {mounted && isAuthenticated && user && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
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
              onLogout={() => {
                logout();
                setIsUserMenuOpen(false);
                router.push("/");
              }}
              menuRef={userMenuRef}
            />

            {/* Hamburger (mobile only) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              suppressHydrationWarning
              className={`lg:hidden p-2.5 rounded-full transition-all active:scale-95 ${isLight
                  ? "text-neutral-700 hover:bg-neutral-900/[0.06]"
                  : "text-white bg-black/55 backdrop-blur-xl border border-white/20 hover:bg-black/70 shadow-md"
                }`}
            >
              <Bars3Icon className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Mobile Full-Screen Search Modal */}
          {isMobileSearchOpen && (
            <div className="fixed inset-0 z-[100] sm:hidden bg-white animate-in fade-in duration-200">
              <SearchAutocomplete
                isLight={true}
                isMobileFull={true}
                onClose={() => setIsMobileSearchOpen(false)}
              />
            </div>
          )}
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
        onLogout={() => {
          logout();
          router.push("/");
        }}
      />
    </>
  );
};

export default Navbar;
