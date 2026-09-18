"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  theme = "dark",
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

  useEffect(() => {
    setMounted(true);
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

  const isLight = theme === "light";
  const activeNavItems = (navItems && navItems.length > 0) ? navItems : DEFAULT_NAV_ITEMS;

  return (
    <header className={`w-full z-50 transition-colors ${
      isLight 
        ? "relative bg-white/85 backdrop-blur-lg border-b border-neutral-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)]" 
        : "absolute top-0 left-0 right-0 bg-transparent text-white"
    }`}>
      <nav className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
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

        {/* 2. Middle Section: Navigation Links */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-0.5 px-4 pointer-events-auto whitespace-nowrap">
          {activeNavItems.map((item) => (
            <div 
              key={item.id} 
              className="relative group"
              onMouseEnter={() => item.megaMenuItems && setHoveredMenuId(item.id)}
              onMouseLeave={() => setHoveredMenuId(null)}
            >
              <Link
                href={item.href}
                className={`relative flex items-center gap-1.5 text-[11px] xl:text-[12px] font-sans font-bold tracking-widest uppercase transition-all duration-200 px-3.5 py-2 rounded-full group ${
                  isLight
                    ? "text-neutral-800 hover:text-banner"
                    : "text-white/95 hover:text-banner drop-shadow-sm"
                }`}
              >
                {/* Premium Glow Pill Backdrop */}
                <div 
                  className={`absolute inset-0 transition-all duration-200 ease-out opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 rounded-full ${
                    isLight 
                      ? 'bg-orange-50/90 border border-orange-200/80 shadow-[0_2px_12px_rgba(255,84,41,0.08)]' 
                      : 'bg-black/40 border border-orange-400/40 shadow-[0_2px_15px_rgba(255,84,41,0.25)] backdrop-blur-md'
                  }`} 
                />
                
                {/* Text with subtle upward lift */}
                <span className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5">
                  {item.label}
                </span>

                {/* Expanding bottom accent beam */}
                <span className="absolute bottom-1 left-3.5 right-3.5 h-[2px] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out origin-center bg-banner" />

                {item.hasDropdown && (
                  <ChevronDownIcon className="relative z-10 w-3 h-3 text-neutral-400 group-hover:text-banner group-hover:rotate-180 transition-all duration-200 stroke-[2.5]" />
                )}
              </Link>

              {/* Mega Menu Dropdown */}
              {item.hasDropdown && item.megaMenuItems && (
                <div 
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-neutral-200/80 z-50 transition-all duration-300 ease-out overflow-hidden transform ${
                    hoveredMenuId === item.id 
                      ? "opacity-100 translate-y-0 pointer-events-auto" 
                      : "opacity-0 translate-y-3 pointer-events-none"
                  }`}
                >
                  {/* Top Brand Orange Accent Line */}
                  <div className="w-full h-[3px] bg-gradient-to-r from-orange-400 via-banner to-orange-500" />
                  <div className="grid grid-cols-2 gap-6 p-6">
                    {item.megaMenuItems.map((menuGroup, idx) => (
                      <div key={idx}>
                        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-3 border-b border-neutral-100 pb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-banner" />
                          {menuGroup.group}
                        </h4>
                        <ul className="flex flex-col gap-2">
                          {menuGroup.items.map((link, lIdx) => (
                            <li key={lIdx}>
                              <Link 
                                href={link.href}
                                className="text-[13px] font-medium text-neutral-600 hover:text-banner hover:translate-x-1 transition-all duration-200 block py-0.5"
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
          ))}
        </div>

        {/* 3. Right Side: Search Box, Cart Button & User Profile */}
        <div className="flex items-center gap-3 sm:gap-5">
          
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden sm:flex items-center"
          >
            <MagnifyingGlassIcon className="w-[18px] h-[18px] text-neutral-400 absolute left-3 pointer-events-none stroke-[1.5]" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none w-44 md:w-52 placeholder:text-neutral-400 transition-all border ${
                isLight 
                  ? "bg-neutral-50 text-neutral-800 border-neutral-200 focus:border-banner focus:bg-white" 
                  : "bg-white text-neutral-800 border-transparent focus:border-banner"
              }`}
            />
          </form>

          <Link
            href="/cart"
            aria-label="Shopping Cart"
            className={`relative p-2 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              isLight 
                ? "text-neutral-800 hover:text-banner hover:bg-orange-50/70" 
                : "text-white hover:text-banner hover:bg-white/15"
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
              className={`p-2 rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95 ${
                isLight 
                  ? "text-neutral-800 hover:text-banner hover:bg-orange-50/70" 
                  : "text-white hover:text-banner hover:bg-white/15"
              }`}
            >
              <UserIcon className="w-5 h-5 stroke-[1.75]" />
              {mounted && isAuthenticated && user && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 ring-2 ring-white" />
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white text-neutral-900 rounded-sm shadow-2xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                
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
