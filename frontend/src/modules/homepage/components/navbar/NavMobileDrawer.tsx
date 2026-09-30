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

            {/* Search bar */}
            <div className="px-5 py-3 border-b border-neutral-100">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2"
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="search"
                  placeholder="Search helmets, jackets..."
                  className="flex-1 bg-transparent text-sm text-neutral-800 placeholder-neutral-400 outline-none"
                />
              </form>
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
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 mb-1">
                                    {group.group}
                                  </p>
                                  {group.items.map((link, lIdx) => (
                                    <Link
                                      key={lIdx}
                                      href={link.href}
                                      onClick={onClose}
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:text-banner hover:bg-orange-50 transition-colors"
                                    >
                                      <ChevronRightIcon className="w-3 h-3 text-neutral-300" />
                                      {link.label}
                                    </Link>
                                  ))}
                                </div>
                              ))}
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
            <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50">
              {mounted && isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-banner flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user.name?.[0]?.toUpperCase() || "R"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { onLogout(); onClose(); }}
                    className="text-xs text-red-500 font-semibold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex-1 text-center py-2.5 bg-banner text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="flex-1 text-center py-2.5 border border-neutral-300 text-neutral-700 text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors"
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
