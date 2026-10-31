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
              <Link href="/" onClick={onClose} className="cursor-pointer">
                <div className="relative h-[36.8px] w-40">
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
                suppressHydrationWarning
                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
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
                        suppressHydrationWarning
                        onClick={() =>
                          setExpandedId(expandedId === item.id ? null : item.id)
                        }
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${
                          expandedId === item.id ? "text-brand bg-neutral-50" : "text-neutral-800 hover:bg-neutral-100"
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedId === item.id ? "rotate-180 text-brand" : "text-neutral-400"
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
                            <div className="pl-3 pr-2 pb-3 pt-1">
                              {/* Direct section landing page link if available */}
                              {item.href && item.href !== "#" && item.id !== "shop-by-brand" && (
                                <div className="pt-1 pb-2 px-1 mb-2 border-b border-neutral-100">
                                  <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                                  >
                                    <span>Explore All {item.label}</span>
                                    <ChevronRightIcon className="w-3.5 h-3.5 text-brand stroke-[2.5]" />
                                  </Link>
                                </div>
                              )}

                              {item.megaMenuItems.map((group, gIdx) => (
                                <div key={gIdx} className="mb-3.5 last:mb-1 w-full">
                                  {group.group ? (
                                    group.groupHref ? (
                                      <Link
                                        href={group.groupHref}
                                        onClick={onClose}
                                        className="mb-2 block cursor-pointer group/cat px-1 mt-3 first:mt-0"
                                      >
                                        <h4 className="text-[12.5px] font-bold text-neutral-900 uppercase tracking-widest border-b border-neutral-200/60 pb-1.5 flex items-start gap-2 leading-snug group-hover/cat:text-brand transition-colors">
                                          <span className="w-1.5 h-1.5 rounded-full bg-banner shadow-xs shrink-0 mt-1.5" />
                                          <span className="flex-1 min-w-0 break-words whitespace-normal">{group.group}</span>
                                        </h4>
                                      </Link>
                                    ) : (
                                      <div className="mb-2 px-1 mt-3 first:mt-0">
                                        <h4 className="text-[12.5px] font-bold text-neutral-900 uppercase tracking-widest border-b border-neutral-200/60 pb-1.5 flex items-start gap-2 leading-snug">
                                          <span className="w-1.5 h-1.5 rounded-full bg-banner shadow-xs shrink-0 mt-1.5" />
                                          <span className="flex-1 min-w-0 break-words whitespace-normal">{group.group}</span>
                                        </h4>
                                      </div>
                                    )
                                  ) : null}

                                  <ul className="flex flex-col gap-0.5 w-full">
                                    {group.items.map((link, lIdx) => (
                                      <li key={lIdx} className="w-full">
                                        <Link
                                          href={link.href}
                                          onClick={onClose}
                                          className={`cursor-pointer transition-colors duration-150 flex items-center gap-2.5 group/item w-full ${
                                            !group.group
                                              ? "text-[13px] font-medium text-neutral-700 hover:text-brand hover:bg-neutral-50 rounded-xl px-3 py-2"
                                              : "text-[13px] font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg px-2.5 py-1.5"
                                          }`}
                                        >
                                          {link.logoUrl ? (
                                            <div className="w-10 h-5 flex items-center justify-center shrink-0">
                                              <Image
                                                src={link.logoUrl}
                                                alt={link.label}
                                                width={40}
                                                height={20}
                                                unoptimized
                                                className="object-contain max-h-full max-w-full group-hover/item:scale-105 transition-transform duration-150"
                                              />
                                            </div>
                                          ) : link.imageUrl ? (
                                            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0 border border-neutral-200/80 bg-neutral-100">
                                              <Image
                                                src={link.imageUrl}
                                                alt={link.label}
                                                fill
                                                sizes="20px"
                                                unoptimized
                                                className="object-cover group-hover/item:scale-105 transition-transform duration-150"
                                              />
                                            </div>
                                          ) : null}
                                          <span className="group-hover/item:translate-x-0.5 transition-transform duration-150 flex-1 min-w-0 break-words whitespace-normal leading-snug flex items-center gap-1.5">
                                            <span>{link.label}</span>
                                            {link.badge && (
                                              <span
                                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white ${
                                                  link.badgeColor || "bg-brand"
                                                }`}
                                              >
                                                {link.badge}
                                              </span>
                                            )}
                                          </span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
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
                    suppressHydrationWarning
                    onClick={() => {
                      onLogout();
                      onClose();
                      router.push("/");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 bg-white"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex-1 text-center py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
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
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


