"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  ChevronDownIcon, 
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  ShoppingBagIcon as OrdersIcon,
  HeartIcon,
  UserCircleIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { NavbarProps, NavItem } from "../types/homepage.types";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { 
    id: "helmets", label: "Helmets", href: "/products?category=helmets", hasDropdown: true,
    megaMenuItems: [
      {
        group: "By Style",
        items: [
          { label: "Full Face Helmets", href: "/products?category=full-face-helmets" },
          { label: "Modular Helmets", href: "/products?category=modular-helmets" },
          { label: "Half Face Helmets", href: "/products?category=half-face-helmets" },
          { label: "Off Road Helmets", href: "/products?category=off-road-helmets" }
        ]
      },
      {
        group: "By Brand",
        items: [
          { label: "Axor Helmets", href: "/products?brand=axor" },
          { label: "MT Helmets", href: "/products?brand=mt" }
        ]
      }
    ]
  },
  { 
    id: "riding-gear", label: "Riding Gear", href: "/products?category=riding-gear", hasDropdown: true,
    megaMenuItems: [
      {
        group: "Apparel",
        items: [
          { label: "Riding Jackets", href: "/products?category=riding-jackets" },
          { label: "Riding Pants", href: "/products?category=riding-pants" }
        ]
      }
    ]
  },
  { id: "luggage", label: "Luggage", href: "/products?category=motorcycle-luggage", hasDropdown: false },
  { id: "merchandise", label: "Merchandise", href: "/products?category=merchandise" },
  { id: "accessories", label: "Accessories", href: "/products?category=bike-accessories", hasDropdown: false },
  { id: "spares", label: "Spares", href: "/products?category=spares" },
  { id: "exhausts", label: "Exhausts", href: "/products?category=exhausts" },
  { id: "gadgets", label: "Gadgets", href: "/products?category=gadgets" },
  { id: "tyres", label: "Tyres", href: "/products?category=tyres" },
];

/**
 * Navbar Component
 */
export const Navbar: React.FC<NavbarProps> = ({
  logoText = "Store4Riders",
  navItems,
  onSearch,
  onAccountClick,
  theme = "light",
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const items = useCartStore((state) => state.items);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const [mounted, setMounted] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Optimized, zero-jitter 60/120fps scroll listener using requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalItemCount = mounted 
    ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    } else if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleUserIconClick = () => {
    if (onAccountClick) {
      onAccountClick();
    } else {
      setIsUserMenuOpen(!isUserMenuOpen);
    }
  };

  // Adaptive theme: On light pages, always light. On dark/transparent pages (Homepage), transparent at top and liquid glassmorphism on scroll.
  const isLight = theme === "light" || isScrolled;
  const activeNavItems = (navItems && navItems.length > 0) ? navItems : DEFAULT_NAV_ITEMS;

  return (
    <header className={`w-full z-50 ${
      theme === "light" 
        ? "sticky top-0" 
        : `fixed left-0 right-0 transition-all duration-300 ${isScrolled ? "top-0" : "top-[32px]"}`
    }`}>
      {/* Smooth fading liquid glassmorphic backdrop */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ease-in-out pointer-events-none ${
          theme === "light"
            ? "bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
            : isScrolled
              ? "opacity-100 bg-white/90 backdrop-blur-md border-b border-neutral-200/60 shadow-sm"
              : "opacity-0 bg-white/0"
        }`} 
      />
      <nav className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* 1. Left Side: Brand Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <div className="relative h-8 md:h-10 w-40 md:w-48 transition-transform duration-300 group-hover:scale-105 will-change-transform">
              <Image 
                src="/Store4riders-Logo.jpg" 
                alt={logoText || "Store4Riders Logo"} 
                fill
                className="object-contain object-left"
                sizes="(max-width: 768px) 160px, 200px"
                priority
              />
            </div>
          </Link>
        </div>

        {/* 2. Middle Section: Navigation Links with Apple-Level Liquid Sliding Pill */}
        <div 
          className="hidden lg:flex flex-1 items-center justify-center gap-0.5 px-4 pointer-events-auto whitespace-nowrap"
          onMouseLeave={() => {
            setHoveredNavId(null);
            setHoveredMenuId(null);
          }}
        >
          {activeNavItems.map((item) => {
            const isHovered = hoveredNavId === item.id;
            return (
              <div 
                key={item.id} 
                className="relative"
                onMouseEnter={() => {
                  setHoveredNavId(item.id);
                  if (item.megaMenuItems) {
                    setHoveredMenuId(item.id);
                  } else {
                    setHoveredMenuId(null);
                  }
                }}
              >
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-1.5 text-[11px] xl:text-[12px] font-sans font-bold tracking-widest uppercase px-3.5 py-2 rounded-full transition-colors duration-200 z-10 ${
                    isLight
                      ? isHovered ? "text-neutral-950" : "text-neutral-700 hover:text-neutral-950"
                      : isHovered ? "text-white" : "text-white/90 hover:text-white drop-shadow-sm"
                  }`}
                >
                  {/* Apple Liquid Spring Sliding Pill */}
                  {isHovered && (
                    <motion.span
                      layoutId="nav-liquid-pill"
                      className={`absolute inset-0 rounded-full -z-10 pointer-events-none ${
                        isLight 
                          ? "bg-gradient-to-b from-neutral-900/[0.06] to-neutral-900/[0.09] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_3px_10px_-2px_rgba(0,0,0,0.06)] border border-neutral-900/[0.07]" 
                          : "bg-gradient-to-b from-white/[0.18] to-white/[0.10] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_14px_rgba(0,0,0,0.25)] border border-white/20"
                      }`}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 20,
                        mass: 0.5,
                      }}
                    />
                  )}

                  {/* Tactile 3D Micro-Lift on Hover */}
                  <motion.span 
                    animate={{
                      y: isHovered ? -1.5 : 0,
                      scale: isHovered ? 1.03 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 22,
                      mass: 0.4,
                    }}
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

                {/* Mega Menu Dropdown with Glassmorphism */}
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
                                  className="text-[13px] font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-900/[0.05] hover:backdrop-blur-md rounded-lg px-2.5 py-1 -mx-2.5 hover:translate-x-1 transition-all duration-200 block"
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

        {/* 3. Right Side: Search Box, Cart Button & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden sm:flex items-center group"
          >
            <div className={`relative flex items-center rounded-full transition-all duration-300 w-48 md:w-60 lg:w-72 border ${
              isLight
                ? "bg-neutral-100/90 border-neutral-200/90 shadow-xs focus-within:bg-white focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/5 focus-within:w-64 lg:focus-within:w-80"
                : "bg-black/40 backdrop-blur-xl border-white/25 shadow-md focus-within:bg-black/65 focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/20 focus-within:w-64 lg:focus-within:w-80"
            }`}>
              <MagnifyingGlassIcon className={`w-4 h-4 ml-3.5 mr-2 shrink-0 transition-colors ${
                isLight ? "text-neutral-400 group-focus-within:text-neutral-900" : "text-white/60 group-focus-within:text-white"
              } stroke-[2]`} />
              
              <input
                type="text"
                placeholder="Search helmets, gear, boots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent text-xs sm:text-[13px] py-2 pr-7 focus:outline-none font-medium transition-colors ${
                  isLight 
                    ? "text-neutral-900 placeholder:text-neutral-400" 
                    : "text-white placeholder:text-white/60"
                }`}
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`mr-2.5 p-0.5 rounded-full transition-colors ${
                    isLight ? "text-neutral-400 hover:text-neutral-700 bg-neutral-200/60" : "text-white/60 hover:text-white bg-white/20"
                  }`}
                  aria-label="Clear search"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <span className={`hidden lg:inline-flex mr-2.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 select-none ${
                  isLight ? "bg-neutral-200/70 text-neutral-500" : "bg-white/15 text-white/70"
                }`}>
                  ↵
                </span>
              )}
            </div>
          </form>

          <Link
            href="/cart"
            aria-label="Shopping Cart"
            className={`relative p-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${
              isLight 
                ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.06]" 
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <ShoppingBagIcon className="w-5 h-5 stroke-[1.75]" />
            {totalItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-banner text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50">
                {totalItemCount > 99 ? "99+" : totalItemCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={handleUserIconClick}
              aria-label="User Account"
              className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 ${
                isLight 
                  ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-900/[0.06]" 
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <UserIcon className="w-5 h-5 stroke-[1.75]" />
              {mounted && isAuthenticated && user && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white/85 backdrop-blur-2xl text-neutral-900 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-white/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/[0.04] overflow-hidden">
                
                <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/70">
                  {mounted && isAuthenticated && user ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                        {user.name || "Rider Member"}
                      </span>
                      <span className="text-[11px] text-neutral-500 truncate">
                        {user.email}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-neutral-900 uppercase">
                        Welcome to Store4Riders
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Sign in to view orders & saved gear
                      </span>
                    </div>
                  )}
                </div>

                <div className="py-1 text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  {mounted && isAuthenticated ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors"
                      >
                        <UserCircleIcon className="w-4 h-4 text-neutral-500" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors"
                      >
                        <OrdersIcon className="w-4 h-4 text-neutral-500" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        href="/account/wishlist"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors"
                      >
                        <HeartIcon className="w-4 h-4 text-neutral-500" />
                        <span>Wishlist</span>
                      </Link>

                      <div className="border-t border-neutral-100 my-1" />

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 bg-banner text-white font-bold hover:bg-orange-600 transition-colors mx-3 my-1 rounded-sm text-center"
                      >
                        <span>SIGN IN / LOGIN</span>
                        <SparklesIcon className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors"
                      >
                        <UserCircleIcon className="w-4 h-4 text-neutral-500" />
                        <span>Create Account</span>
                      </Link>

                      <Link
                        href="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors"
                      >
                        <OrdersIcon className="w-4 h-4 text-neutral-500" />
                        <span>Track Orders</span>
                      </Link>
                    </>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </nav>
    </header>
  );
};

export default Navbar;
