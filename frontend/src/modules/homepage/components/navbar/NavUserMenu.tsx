"use client";

import React from "react";
import Link from "next/link";
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  ShoppingBagIcon as OrdersIcon,
  HeartIcon,
  UserCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface NavUserMenuProps {
  isLight: boolean;
  isOpen: boolean;
  mounted: boolean;
  isAuthenticated: boolean;
  user: { name?: string; email?: string } | null;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

/**
 * Desktop user icon + dropdown menu (avatar, orders, wishlist, login/logout).
 * Hidden on mobile — mobile auth is handled inside NavMobileDrawer.
 */
export const NavUserMenu: React.FC<NavUserMenuProps> = ({
  isLight,
  isOpen,
  mounted,
  isAuthenticated,
  user,
  onToggle,
  onClose,
  onLogout,
  menuRef,
}) => {
  return (
    <div className="hidden lg:block relative" ref={menuRef}>
      <button
        onClick={onToggle}
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

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white/85 backdrop-blur-2xl text-neutral-900 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-white/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/[0.04] overflow-hidden">

          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/70">
            {mounted && isAuthenticated && user ? (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  {user.name || "Rider Member"}
                </span>
                <span className="text-[11px] text-neutral-500 truncate">{user.email}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-neutral-900 uppercase">Welcome to Store4Riders</span>
                <span className="text-[11px] text-neutral-500">Sign in to view orders & saved gear</span>
              </div>
            )}
          </div>

          <div className="py-1 text-xs font-semibold uppercase tracking-wider text-neutral-700">
            {mounted && isAuthenticated ? (
              <>
                <Link href="/account" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors">
                  <UserCircleIcon className="w-4 h-4 text-neutral-500" />
                  <span>My Profile</span>
                </Link>
                <Link href="/account/orders" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors">
                  <OrdersIcon className="w-4 h-4 text-neutral-500" />
                  <span>My Orders</span>
                </Link>
                <Link href="/account/wishlist" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors">
                  <HeartIcon className="w-4 h-4 text-neutral-500" />
                  <span>Wishlist</span>
                </Link>
                <div className="border-t border-neutral-100 my-1" />
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={onClose} className="flex items-center justify-between px-4 py-2.5 bg-banner text-white font-bold hover:bg-orange-600 transition-colors mx-3 my-1 rounded-sm">
                  <span>SIGN IN / LOGIN</span>
                  <SparklesIcon className="w-4 h-4" />
                </Link>
                <Link href="/register" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors">
                  <UserCircleIcon className="w-4 h-4 text-neutral-500" />
                  <span>Create Account</span>
                </Link>
                <Link href="/account/orders" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 hover:text-banner transition-colors">
                  <OrdersIcon className="w-4 h-4 text-neutral-500" />
                  <span>Track Orders</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
