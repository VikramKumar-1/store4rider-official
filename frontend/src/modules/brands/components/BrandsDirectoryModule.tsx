"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useBrands, useBrandsPageConfig } from "@/core/hooks/useBrands";
import { IBrand, IBrandsPageConfig } from "@store4riders/shared-types";

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
  "biking-brotherhood": "https://s3.ap-south-2.amazonaws.com/store4riders/9biking.png",
  "mototech-gear": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MotoTech.png",
  "scala-gears": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/scala.png",
  "forma-boots": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Forma.png",
  "falco": "https://www.store4riders.com/media/codazon_cache/brand/120x120/Background.png",
  "fly-racing": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Flyracing-logo_1_.png",
  "invictus": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Invictus.png",
  "lone-ranger": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Lone-Ranger.png",
  "safe-tech-protectors": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Safe-tech.jpg",
  "sas-tec": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/SAS-TEC-Logo-.jpg",
  "moto-fusion": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/mf.png",
  "motospunk": "/brands/motospunk.svg",
  "quipco": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Quipco.jpg",
  "shoerella": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Shoerella-logo.jpg",
  "rolon": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/rolon.jpg",
  "barrel-exhaust": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Barrel-Exhaust.png",
  "moto-torque": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/MOTO-TORQUE-LOGO.jpg",
  "pro-spec-performance-parts": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Pro-Spec-logo.png",
  "race-dynamics": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/RaceDynamics_Logohi-res_Primary.png",
  "carberry": "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/Carberry.png",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const DEFAULT_HERO_TITLE = "Shop By Brand";
const DEFAULT_HERO_DESCRIPTION =
  "Store4Riders is an online multi-brand riding gear store launched in 2016 for fellow riders looking out for quality motorcycle riding gear. We house brands ranging from premium brands to more affordable riding gear brands like etc. Other than riding gear, we offer a host of accessories, luggage and performance parts for bike riders. We deliver all products across India. Check out the brands we have on offer.";

interface BrandsDirectoryModuleProps {
  initialConfig?: IBrandsPageConfig | null;
}

export const BrandsDirectoryModule: React.FC<BrandsDirectoryModuleProps> = ({ initialConfig }) => {
  const { data: brands, isLoading, error } = useBrands();
  const { data: pageConfig } = useBrandsPageConfig();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Dynamic admin-editable content with reliable fallback
  const heroTitle = pageConfig?.heroTitle || initialConfig?.heroTitle || DEFAULT_HERO_TITLE;
  const heroDescription = pageConfig?.heroDescription || initialConfig?.heroDescription || DEFAULT_HERO_DESCRIPTION;

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

  // Top Popular Brands (strictly configured with "Popular Brands" in admin)
  const popularBrands = useMemo(() => {
    if (!brands || !Array.isArray(brands)) return [];

    return brands.filter((b) =>
      b.isActive !== false && (
        (b.menuGroups && b.menuGroups.some((g) => g.toLowerCase().includes("popular"))) ||
        (b.menuGroup && b.menuGroup.toLowerCase().includes("popular"))
      )
    );
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
    <div className="w-full flex flex-col font-sans bg-[#FAFAFA] min-h-screen">
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white/95 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
        <Navbar logoText="Store4Riders" theme="light" />
      </div>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "HOME", href: "/" },
          { label: "BRANDS" },
        ]}
      />

      {/* 2. Hero Section — Spacious, Clean Editorial Architecture */}
      <section className="relative pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-neutral-900 mb-2">
            {heroTitle}
          </h1>

          {/* Store4Riders Signature Brand Bar */}
          <div className="w-12 h-1 bg-brand mx-auto rounded-full mt-3 mb-6" />

          {/* Clean Editorial Story / Description */}
          <p className="max-w-2xl sm:max-w-3xl mx-auto text-neutral-700 text-sm sm:text-base md:text-lg leading-relaxed font-normal mb-8 sm:mb-10 text-center whitespace-pre-line">
            {heroDescription}
          </p>

          {/* High-Definition Search Capsule */}
          <div className="max-w-xl mx-auto relative">
            <div className="relative flex items-center rounded-full bg-white border border-neutral-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] hover:border-neutral-400 focus-within:border-banner focus-within:ring-2 focus-within:ring-banner/20 transition-all duration-200">
              <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedLetter(null);
                }}
                placeholder="Search brands (e.g. Rynox, Axor, Motul, SMK)..."
                className="w-full bg-transparent text-neutral-900 text-sm sm:text-base font-medium pl-11 pr-11 py-3.5 sm:py-4 rounded-full focus:outline-none placeholder-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-all cursor-pointer"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1 rounded-full bg-orange-50 text-xs font-bold text-banner border border-orange-200 shadow-2xs">
                <span>Found</span>
                <span className="font-extrabold text-neutral-950">{filteredBrands.length}</span>
                <span>brand{filteredBrands.length === 1 ? "" : "s"} matching &quot;{searchQuery}&quot;</span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 3. Sticky Alphabet Jump Bar */}
      <div className="sticky top-[69px] z-30 bg-white/95 border-y border-neutral-200 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 overflow-x-auto hide-scrollbar flex items-center justify-start sm:justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedLetter(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
              selectedLetter === null
                ? "bg-neutral-900 text-white shadow-xs border border-neutral-900"
                : "bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 shadow-xs border border-neutral-200"
            }`}
          >
            All Brands
          </button>
          {popularBrands.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedLetter(null);
                const el = document.getElementById("popular-brands");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 text-white bg-brand hover:bg-brand-dark shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Popular Brands</span>
            </button>
          )}

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
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-[0_4px_10px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.3)] border border-neutral-900 scale-105"
                    : hasBrands
                    ? "bg-white/90 hover:bg-red-50/80 hover:text-brand hover:border-red-200 text-neutral-800 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04),_inset_0_1px_1px_rgba(255,255,255,1)] border border-neutral-200/80 cursor-pointer active:scale-95"
                    : "text-neutral-300 bg-neutral-100/40 border border-transparent cursor-not-allowed opacity-35"
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
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
              selectedLetter === "#"
                ? "bg-neutral-900 text-white shadow-[0_4px_10px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.3)] border border-neutral-900 scale-105"
                : availableLetters.has("#")
                ? "bg-white/90 hover:bg-red-50/80 hover:text-brand hover:border-red-200 text-neutral-800 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.04),_inset_0_1px_1px_rgba(255,255,255,1)] border border-neutral-200/80 cursor-pointer active:scale-95"
                : "text-neutral-300 bg-neutral-100/40 border border-transparent cursor-not-allowed opacity-35"
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
              <div key={i} className="h-36 bg-white/80 rounded-2xl border border-neutral-200/80 p-5 flex flex-col items-center justify-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <div className="w-20 h-10 bg-neutral-200/60 rounded-xl" />
                <div className="w-24 h-3 bg-neutral-200/80 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center bg-white rounded-3xl border border-neutral-200 max-w-lg mx-auto shadow-sm">
            <p className="text-neutral-900 font-bold mb-2">Failed to load brands</p>
            <p className="text-neutral-500 text-sm">Please refresh the page to try again.</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Empty State */}
            {groupedBrands.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200/90 max-w-lg mx-auto p-8 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.05)]">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-4 shadow-[inset_1px_1px_1.5px_rgba(255,255,255,0.9),_inset_-1px_-1px_2px_rgba(0,0,0,0.04)]">
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
                  className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)] transition-all cursor-pointer"
                >
                  View All Brands
                </button>
              </div>
            )}

            {/* Popular Brands Showcase — HIGHLIGHTED */}
            {!searchQuery && !selectedLetter && popularBrands.length > 0 && (
              <section id="popular-brands" className="mb-14 scroll-mt-36">
                <div className="flex items-center justify-between pb-3.5 border-b-2 border-brand mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(171,21,9,0.8)] animate-pulse" />
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                      <span>Popular Brands</span>
                      <span className="inline-flex items-center text-[10.5px] font-bold uppercase tracking-wider bg-brand text-white px-3 py-1 rounded-full shadow-2xs leading-none">
                        <span>Top Choice</span>
                      </span>
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider hidden sm:inline">
                    Rider Favorites Across India
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                  {popularBrands.map((brand) => {
                    const logoUrl = getBrandLogo(brand);
                    return (
                      <Link
                        key={`popular-${brand._id}`}
                        href={`/brands/${brand.slug}`}
                        className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_30px_-6px_rgba(171,21,9,0.18)] hover:border-brand hover:-translate-y-0.5 transition-all duration-200 overflow-hidden transform-gpu"
                      >
                        {/* Popular Badge */}
                        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                          <span className="inline-flex items-center text-[9px] font-medium text-white bg-brand px-2 py-0.5 rounded-full shadow-xs tracking-wide uppercase leading-none">
                            <span>Popular</span>
                          </span>
                        </div>

                        {/* Logo Container */}
                        <div className="h-14 sm:h-16 w-full flex items-center justify-center my-2 rounded-xl bg-neutral-50 group-hover:bg-red-50/30 p-2 border border-neutral-100 group-hover:border-red-100 transition-colors">
                          {logoUrl ? (
                            <Image
                              src={logoUrl}
                              alt={brand.name}
                              width={95}
                              height={45}
                              className="object-contain max-h-11 max-w-[85%] transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-brand group-hover:text-white font-extrabold text-sm flex items-center justify-center border border-neutral-200/60 transition-colors">
                              {getBrandInitials(brand.name)}
                            </div>
                          )}
                        </div>

                        {/* Brand Name Footer */}
                        <div className="border-t border-neutral-100 pt-3 flex items-center justify-between mt-1">
                          <span className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-brand transition-colors line-clamp-1">
                            {brand.name}
                          </span>
                          <div className="w-6 h-6 rounded-lg bg-neutral-100 group-hover:bg-brand group-hover:text-white text-neutral-400 flex items-center justify-center transition-all duration-200 shrink-0 ml-1">
                            <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Alphabetical Map (A-Z Grouped Sections) */}
            {groupedBrands.map(({ letter, brands: letterBrands }) => (
              <section
                key={letter}
                id={`letter-${letter}`}
                className="mb-12 scroll-mt-32"
              >
                {/* Letter Header — Mechanical keycap badge */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-neutral-200/80 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white font-black text-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2),_inset_0_1px_1px_rgba(255,255,255,0.3)] border border-neutral-800">
                    {letter}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-neutral-900 tracking-tight">
                      Brands starting with &ldquo;{letter}&rdquo;
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      {letterBrands.length} Verified Manufacturer{letterBrands.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Brand Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                  {letterBrands.map((brand) => {
                    const logoUrl = getBrandLogo(brand);
                    const isBrandPopular = Boolean(
                      (brand.menuGroups && brand.menuGroups.some((g) => g.toLowerCase().includes("popular"))) ||
                      (brand.menuGroup && brand.menuGroup.toLowerCase().includes("popular"))
                    );

                    return (
                      <Link
                        key={brand._id}
                        href={`/brands/${brand.slug}`}
                        className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_-6px_rgba(171,21,9,0.14)] hover:border-brand hover:-translate-y-0.5 transition-all duration-200 overflow-hidden transform-gpu"
                      >
                        {isBrandPopular && (
                          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                            <span className="inline-flex items-center text-[9px] font-medium text-white bg-brand px-2 py-0.5 rounded-full shadow-xs tracking-wide uppercase leading-none">
                              <span>Popular</span>
                            </span>
                          </div>
                        )}
                        <div className="h-14 sm:h-16 w-full flex items-center justify-center my-2 rounded-xl bg-neutral-50 group-hover:bg-red-50/30 p-2 border border-neutral-100 group-hover:border-red-100 transition-colors">
                          {logoUrl ? (
                            <Image
                              src={logoUrl}
                              alt={brand.name}
                              width={90}
                              height={42}
                              className="object-contain max-h-11 max-w-[85%] transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-brand group-hover:text-white font-extrabold text-xs flex items-center justify-center border border-neutral-200/60 transition-colors">
                              {getBrandInitials(brand.name)}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-neutral-100 pt-3 flex items-center justify-between mt-1">
                          <span className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-brand transition-colors line-clamp-1">
                            {brand.name}
                          </span>
                          <div className="w-6 h-6 rounded-lg bg-neutral-100 group-hover:bg-brand group-hover:text-white text-neutral-400 flex items-center justify-center transition-all duration-200 shrink-0 ml-1">
                            <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
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
