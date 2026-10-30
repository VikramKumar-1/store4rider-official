"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
ArrowRightIcon 
} from "@heroicons/react/24/outline";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useBrands } from "@/core/hooks/useBrands";
import { IBrand } from "@store4riders/shared-types";

/**
 * High-resolution brand logo fallbacks for official catalog brands.
 */
const BRAND_LOGOS: Record<string, string> = {
  "agv": "/brands/agv.svg",
  "hjc": "/brands/hjc.svg",
  "ls2": "/brands/ls2.svg",
  "mt": "/brands/mt.svg",
  "mt-helmets": "/brands/mt.svg",
  "axor": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/axor-logo_bw_100x51.png",
  "axor-helmets": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/axor-logo_bw_100x51.png",
  "axxis": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Axxis-Logo-2.png",
  "smk": "/brands/smk.svg",
  "smk-helmets": "/brands/smk.svg",
  "vemar": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/vemar-100x51.png",
  "vega": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/vega100x75.png",
  "alpinestars": "/brands/alpinestars.svg",
  "rynox": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/new-rynox-logo-black.png",
  "rynox-gear": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/new-rynox-logo-black.png",
  "shima": "/brands/shima.svg",
  "viaterra": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/VIATERRA_LOGO_PNG.png",
  "dsg": "/brands/dsg.svg",
  "macna": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/macna-100x51.png",
  "furygan": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/furygan_logo.jpg",
  "raida": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Raida.png",
  "raida-gears": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Raida.png",
  "knox": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/knox.png",
  "sena": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/SENA-LOGO.png",
  "parani": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/PARANI-LOGO.png",
  "bobo": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BOBO-Logo-Blue-Black.png",
  "bluarmor": "/brands/bluarmor.svg",
  "dirtsack": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Dirtsack.png",
  "shad": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/SHAD-LOGO-PNG.png",
  "maddog": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/maddog-logo-2.png",
  "apollo": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/APOLLO.png",
  "michelin": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MICHELIN.jpg",
  "pirelli": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/PIRELLI.jpg",
  "motul": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Motul-logo.png",
  "k-n-bike-air-filter": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/K_N-Logo.png",
  "ngk-spark-plugs": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/NGK.png",
  "bmc-air-filter": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/BMC_Air_filter_logo.png",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const BrandsDirectoryModule: React.FC = () => {
  const { data: brands, isLoading, error } = useBrands();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Filter brands based on user search
  const filteredBrands = useMemo(() => {
    if (!brands || !Array.isArray(brands)) return [];
    let list = [...brands];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => 
        b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
      );
    }

    if (selectedLetter) {
      if (selectedLetter === "#") {
        list = list.filter((b) => !/^[A-Za-z]/.test(b.name));
      } else {
        list = list.filter((b) => 
          b.name.trim().toUpperCase().startsWith(selectedLetter)
        );
      }
    }

    return list;
  }, [brands, searchQuery, selectedLetter]);

  // Group brands alphabetically by first letter
  const groupedBrands = useMemo(() => {
    const groups: Record<string, IBrand[]> = {};

    filteredBrands.forEach((b) => {
      const firstChar = b.name.trim().charAt(0).toUpperCase();
      const letter = /^[A-Z]$/.test(firstChar) ? firstChar : "#";
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(b);
    });

    // Sort letters alphabetically, '#' at the end
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((letter) => ({
      letter,
      brands: groups[letter].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [filteredBrands]);

  // Calculate letters that have brands in full catalog
  const availableLetters = useMemo(() => {
    if (!brands || !Array.isArray(brands)) return new Set<string>();
    const set = new Set<string>();
    brands.forEach((b) => {
      const firstChar = b.name.trim().charAt(0).toUpperCase();
      if (/^[A-Z]$/.test(firstChar)) {
        set.add(firstChar);
      } else {
        set.add("#");
      }
    });
    return set;
  }, [brands]);

  const scrollToLetter = (letter: string) => {
    setSelectedLetter(letter === selectedLetter ? null : letter);
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getBrandLogo = (brand: IBrand) => {
    return brand.logo || BRAND_LOGOS[brand.slug] || null;
  };

  const getBrandInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full flex flex-col font-sans bg-neutral-50/60 min-h-screen">
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
        <Navbar logoText="Store4Riders" theme="light" />
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "HOME", href: "/" },
          { label: "BRANDS" },
        ]}
      />

      {/* 2. Hero Section */}
      <section className="bg-white border-b border-neutral-200/80 pt-8 pb-10 px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-xs font-black uppercase tracking-widest text-brand">
              Official Brand Directory
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-medium text-neutral-500">
              100% Genuine Manufacturer Gear
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-900 mb-3">
            Shop By Brand
          </h1>
          <p className="max-w-2xl mx-auto text-neutral-600 text-sm sm:text-base mb-8">
            Explore authentic motorcycle riding gear, helmets, accessories, and performance parts from the world&apos;s most trusted manufacturers.
          </p>

          {/* Search Input */}
          <div className="max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedLetter(null);
                }}
                placeholder="Search brands (e.g. Rynox, Axor, Motul, SMK)..."
                className="w-full bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-neutral-900 text-sm font-medium pl-11 pr-11 py-3.5 rounded-full border border-neutral-200 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 p-1 rounded-full text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-neutral-500 mt-2 text-left pl-4">
                Found {filteredBrands.length} brand{filteredBrands.length === 1 ? "" : "s"} matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 3. Sticky Alphabet Jump Bar */}
      <div className="sticky top-[69px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 overflow-x-auto hide-scrollbar flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedLetter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              selectedLetter === null
                ? "bg-neutral-900 text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
            }`}
          >
            All Brands
          </button>

          <span className="w-px h-4 bg-neutral-200 mx-1 shrink-0" />

          {ALPHABET.map((char) => {
            const hasBrands = availableLetters.has(char);
            const isSelected = selectedLetter === char;

            return (
              <button
                key={char}
                type="button"
                disabled={!hasBrands}
                onClick={() => scrollToLetter(char)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                  isSelected
                    ? "bg-brand text-white shadow-xs scale-105"
                    : hasBrands
                    ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 font-extrabold cursor-pointer"
                    : "text-neutral-300 cursor-not-allowed opacity-50"
                }`}
              >
                {char}
              </button>
            );
          })}

          <button
            type="button"
            disabled={!availableLetters.has("#")}
            onClick={() => scrollToLetter("#")}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
              selectedLetter === "#"
                ? "bg-brand text-white shadow-xs scale-105"
                : availableLetters.has("#")
                ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 font-extrabold"
                : "text-neutral-300 cursor-not-allowed opacity-50"
            }`}
          >
            #
          </button>
        </div>
      </div>

      {/* 4. Main Catalog Content */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-neutral-200/60 p-4 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-10 bg-neutral-100 rounded-md" />
                <div className="w-20 h-3 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center bg-white rounded-2xl border border-red-200 max-w-lg mx-auto">
            <p className="text-red-600 font-bold mb-2">Failed to load brands</p>
            <p className="text-neutral-500 text-sm">Please refresh the page to try again.</p>
          </div>
        )}

        {!isLoading && !error && (
          <>

            {/* Empty State */}
            {groupedBrands.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200/80 max-w-lg mx-auto p-8 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">No brands found</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  We couldn&apos;t find any brands matching &quot;{searchQuery || selectedLetter}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLetter(null);
                  }}
                  className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                >
                  View All Brands
                </button>
              </div>
            )}

            {/* Alphabetical Map (A-Z Grouped Sections) */}
            {groupedBrands.map(({ letter, brands: letterBrands }) => (
              <section
                key={letter}
                id={`letter-${letter}`}
                className="mb-12 scroll-mt-32"
              >
                {/* Letter Header */}
                <div className="flex items-center gap-3 pb-3 border-b-2 border-neutral-900 mb-5">
                  <span className="w-10 h-10 rounded-xl bg-neutral-900 text-white font-black text-xl flex items-center justify-center shadow-xs">
                    {letter}
                  </span>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    {letterBrands.length} Brand{letterBrands.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Brand Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                  {letterBrands.map((brand) => {
                    const logoUrl = getBrandLogo(brand);
                    return (
                      <Link
                        key={brand._id}
                        href={`/brands/${brand.slug}`}
                        className="bg-white rounded-2xl border border-neutral-200/80 hover:border-brand p-4 sm:p-5 flex flex-col justify-between group hover:shadow-md transition-all duration-300"
                      >
                        <div className="h-12 w-full flex items-center justify-center mb-3">
                          {logoUrl ? (
                            <Image
                              src={logoUrl}
                              alt={brand.name}
                              width={85}
                              height={40}
                              className="object-contain max-h-10 max-w-[85%] mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 group-hover:bg-brand/10 text-neutral-700 group-hover:text-brand font-black text-xs flex items-center justify-center transition-colors">
                              {getBrandInitials(brand.name)}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-neutral-800 group-hover:text-brand transition-colors line-clamp-1">
                            {brand.name}
                          </span>
                          <ArrowRightIcon className="w-3.5 h-3.5 text-neutral-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

      {/* 5. Global Footer */}
      <div className="bg-neutral-950 pb-20 lg:pb-0 w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
};
