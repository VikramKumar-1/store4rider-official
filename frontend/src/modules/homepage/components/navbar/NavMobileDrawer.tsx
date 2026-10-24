"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ShoppingBagIcon as OrdersIcon,
  HeartIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { NavItem } from "../../types/homepage.types";

interface NavMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  mounted: boolean;
  isAuthenticated: boolean;
  user: { name?: string; email?: string } | null;
  onLogout: () => void;
}

/**
 * Full-screen mobile slide-in drawer with search, nav links (accordion), and auth CTA.
 * Rendered only on mobile/tablet (hidden on lg+).
 */
export const NavMobileDrawer: React.FC<NavMobileDrawerProps> = ({
  isOpen,
  onClose,
  items,
  mounted,
  isAuthenticated,
  user,
  onLogout,
}) => {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input") as HTMLInputElement;
    if (input?.value.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.value.trim())}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="mobile-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[85vw] max-w-sm bg-white flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <Link href="/" onClick={onClose}>
                <div className="relative h-8 w-36">
                  <Image
                    src="/Store4riders-Logo.jpg"
                    alt="Store4Riders"
                    fill
                    className="object-contain object-left"
                    sizes="144px"
                  />
                </div>
              </Link>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Nav links accordion */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {items.map((item) => (
                <div key={item.id} className="mb-1">
                  {item.megaMenuItems ? (
                    <>
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === item.id ? null : item.id)
                        }
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold text-neutral-800 uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                      >
                        <span>{item.label}</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                            expandedId === item.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {expandedId === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-3 pb-2">
                              {item.megaMenuItems.map((group, gIdx) => (
                                <div key={gIdx} className="mb-3">
                                  {group.group ? (
                                    group.groupHref ? (
                                      <Link href={group.groupHref} onClick={onClose} className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand px-3 mb-1">
                                        {group.group}
                                      </Link>
                                    ) : (
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 mb-1">
                                        {group.group}
                                      </p>
                                    )
                                  ) : null}
                                  {group.items.map((link, lIdx) => (
                                    <Link
                                      key={lIdx}
                                      href={link.href}
                                      onClick={onClose}
                                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:text-banner hover:bg-orange-50 transition-colors"
                                    >
                                      {link.imageUrl ? (
                                        <div className="relative w-5 h-5 rounded overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100">
                                          <Image src={link.imageUrl} alt={link.label} fill sizes="20px" className="object-cover" />
                                        </div>
                                      ) : (
                                        <ChevronRightIcon className="w-3 h-3 text-neutral-300 shrink-0" />
                                      )}
                                      <span className="flex-1">{link.label}</span>
                                      {link.badge && (
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white ${link.badgeColor || "bg-brand"}`}>
                                          {link.badge}
                                        </span>
                                      )}
                                    </Link>
                                  ))}
                                </div>
                              ))}
                              {item.id === "shop-by-brand" && (
                                <Link
                                  href="/brands"
                                  onClick={onClose}
                                  className="mt-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-brand bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                                >
                                  <span>View All Brands (A–Z Directory)</span>
                                  <ChevronRightIcon className="w-4 h-4 text-brand shrink-0" />
                                </Link>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold text-neutral-800 uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                    >
                      <span>{item.label}</span>
                      <ChevronRightIcon className="w-4 h-4 text-neutral-300" />
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Auth CTA */}
            {/* User Account / Auth Section */}
            <div className="px-4 py-4 border-t border-neutral-200 bg-neutral-50 shrink-0">
              {mounted && isAuthenticated && user ? (
                <div className="flex flex-col gap-3">
                  {/* User Profile Card */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-brand text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {((user as any).firstName || user.name || user.email || "R").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {(user as any).firstName
                          ? `${(user as any).firstName} ${(user as any).lastName || ""}`.trim()
                          : (user.name || "Rider Member")}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  {/* Profile & Orders Navigation Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <Link
                      href="/account"
                      onClick={onClose}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 hover:text-brand hover:border-brand/40 transition-colors shadow-2xs"
                    >
                      <UserCircleIcon className="w-4 h-4 text-brand shrink-0" />
                      <span className="truncate">My Profile</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={onClose}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 hover:text-brand hover:border-brand/40 transition-colors shadow-2xs"
                    >
                      <OrdersIcon className="w-4 h-4 text-brand shrink-0" />
                      <span className="truncate">My Orders</span>
                    </Link>
                    <Link
                      href="/account/addresses"
                      onClick={onClose}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 hover:text-brand hover:border-brand/40 transition-colors shadow-2xs"
                    >
                      <MapPinIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                      <span className="truncate">Addresses</span>
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={onClose}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 hover:text-brand hover:border-brand/40 transition-colors shadow-2xs"
                    >
                      <HeartIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                      <span className="truncate">Wishlist</span>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-white"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      onClick={onClose}
                      className="flex-1 text-center py-2.5 bg-banner text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={onClose}
                      className="flex-1 text-center py-2.5 border border-neutral-300 bg-white text-neutral-700 text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                  <Link
                    href="/account/orders"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-neutral-700 hover:text-brand transition-colors bg-white border border-neutral-200 rounded-xl"
                  >
                    <OrdersIcon className="w-4 h-4 text-neutral-400" />
                    <span>Track Your Order</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


