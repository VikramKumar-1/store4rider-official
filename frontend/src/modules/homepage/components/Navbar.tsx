"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  { id: "catalog", label: "Catalog", href: "/products", hasDropdown: true },
  { id: "sale", label: "Sale", href: "/sale" },
  { id: "new-arrival", label: "New Arrival", href: "/products?sort=newest" },
  { id: "about", label: "About", href: "/about" },
];

/**
 * Navbar Component
 * 
 * Symmetrical 3-part layout:
 * - Left: Store4Riders Brand Logo
 * - Middle: Exact 100% Dead-Centered Navigation Links (Catalog, Sale, New Arrival, About)
 * - Right: Search Box, Cart with Badge, User Account with Dropdown
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close user dropdown menu when clicking outside
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
      isLight ? "relative bg-white text-neutral-900 border-b border-neutral-100" : "absolute top-0 left-0 right-0 bg-transparent text-white"
    }`}>
      <nav className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        
        {/* 1. Left Side: Brand Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <span
              className={`font-serif text-2xl md:text-3xl font-bold tracking-tight transition-colors ${
                isLight ? "text-neutral-900 group-hover:text-banner" : "text-white group-hover:text-white/80"
              }`}
            >
              {logoText}
            </span>
          </Link>
        </div>

        {/* 2. Middle Section: Exact 100% Mathematical Dead-Center Nav Links */}
        <div className="hidden lg:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          {activeNavItems.map((item) => (
            <div key={item.id} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center gap-1 text-sm font-sans font-medium tracking-wide uppercase transition-colors py-2 ${
                  isLight
                    ? "text-neutral-700 hover:text-neutral-900"
                    : "text-white/90 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.hasDropdown && (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:rotate-180 transition-transform duration-200 stroke-[2]" />
                )}
              </Link>
            </div>
          ))}
        </div>

        {/* 3. Right Side: Search Box, Cart Button & User Profile */}
        <div className="flex items-center gap-3 sm:gap-6">
          
          {/* Search Input Box */}
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
              className={`text-sm pl-10 pr-4 py-2.5 rounded-sm focus:outline-none w-44 md:w-52 placeholder:text-neutral-400 transition-all shadow-sm ${
                isLight ? "bg-neutral-100 text-neutral-800 focus:bg-neutral-200" : "bg-white text-neutral-800"
              }`}
            />
          </form>

          {/* Shopping Cart Link with Live Badge (Navigates to /cart Page) */}
          <Link
            href="/cart"
            aria-label="Shopping Cart"
            className={`relative p-1.5 transition-colors cursor-pointer ${
              isLight ? "text-neutral-800 hover:text-neutral-600" : "text-white hover:text-white/80"
            }`}
          >
            <ShoppingBagIcon className="w-6 h-6 stroke-[1.5]" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50">
                {totalItemCount > 99 ? "99+" : totalItemCount}
              </span>
            )}
          </Link>

          {/* User Account Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={handleUserIconClick}
              aria-label="User Account"
              className={`p-1.5 transition-colors cursor-pointer flex items-center gap-1 ${
                isLight ? "text-neutral-800 hover:text-neutral-600" : "text-white hover:text-white/80"
              }`}
            >
              <UserIcon className="w-6 h-6 stroke-[1.5]" />
              {mounted && isAuthenticated && user && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1 ring-2 ring-white" />
              )}
            </button>

            {/* User Profile Dropdown Panel */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white text-neutral-900 rounded-sm shadow-2xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header Info */}
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

                {/* Navigation Items */}
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
