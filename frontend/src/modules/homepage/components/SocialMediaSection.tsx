"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IInstagramReel,
  ISocialMediaBannerTop,
  ISocialMediaBannerBottom,
} from "@store4riders/shared-types";
import { ReelVideoModal } from "./ReelVideoModal";
import {
  PlayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";

export interface SocialMediaSectionProps {
  title?: string;
  subtitle?: string;
  instagramHandle?: string;
  instagramProfileUrl?: string;
  followersCount?: string;
  followingCount?: string;
  postsCount?: string;
  profileAvatarUrl?: string;
  reels?: IInstagramReel[];
  reelImages?: string[];
  bannerTop?: ISocialMediaBannerTop;
  bannerBottom?: ISocialMediaBannerBottom;
}

/**
 * Authentic Store4Riders Instagram Reels
 * Fallback reels if none are configured in the Admin Panel yet.
 */
const DEFAULT_STORE_REELS: (IInstagramReel & { isPinned?: boolean })[] = [
  {
    _id: "default-reel-1",
    title: "MT Thunder 4 SV Helmet Unboxing & Wind Noise Review",
    thumbnailUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&h=500&q=80",
    videoType: "embed",
    videoUrl: "https://www.instagram.com/reel/C8-0xO9pQ2m/",
    instagramUrl: "https://www.instagram.com/store4riders/",
    views: "4,234",
    likes: "1.4K",
    author: "@store4riders",
    order: 1,
    isActive: true,
    isPinned: true,
  },
  {
    _id: "default-reel-2",
    title: "Axor Apex Venom Edition - Real Riding Exhaust Audio",
    thumbnailUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=400&h=500&q=80",
    videoType: "embed",
    videoUrl: "https://www.instagram.com/reel/C7-9qN7yH6o/",
    instagramUrl: "https://www.instagram.com/store4riders/",
    views: "6,480",
    likes: "2.1K",
    author: "@store4riders",
    order: 2,
    isActive: true,
    isPinned: true,
  },
  {
    _id: "default-reel-3",
    title: "All-Weather Riding Jackets Armor & Waterproof Check",
    thumbnailUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&h=500&q=80",
    videoType: "embed",
    videoUrl: "https://www.instagram.com/reel/C6yZa6yB2Nm/",
    instagramUrl: "https://www.instagram.com/store4riders/",
    views: "8,721",
    likes: "1.6K",
    author: "@store4riders",
    order: 3,
    isActive: true,
    isPinned: false,
  },
  {
    _id: "default-reel-4",
    title: "Raida Tourer Waterproof Riding Boots Ergonomics & Grip",
    thumbnailUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=500&q=80",
    videoType: "embed",
    videoUrl: "https://www.instagram.com/reel/C5xPo4wB1Xz/",
    instagramUrl: "https://www.instagram.com/store4riders/",
    views: "9.7K",
    likes: "890",
    author: "@store4riders",
    order: 4,
    isActive: true,
  },
  {
    _id: "default-reel-5",
    title: "Carbon Knuckle Touchscreen Gloves Testing at High Speed",
    thumbnailUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&h=500&q=80",
    videoType: "embed",
    videoUrl: "https://www.instagram.com/reel/C4xQr8vC4Lm/",
    instagramUrl: "https://www.instagram.com/store4riders/",
    views: "12.1K",
    likes: "1.1K",
    author: "@store4riders",
    order: 5,
    isActive: true,
  },
  {
    _id: "default-reel-6",
    title: "Rolon Brass Chain Sprocket Kit Setup & Track Dyno Run",
    thumbnailUrl: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=400&h=500&q=80",
    videoType: "embed",
    videoUrl: "https://www.instagram.com/reel/C3bTu7yA9Op/",
    instagramUrl: "https://www.instagram.com/store4riders/",
    views: "31.4K",
    likes: "3.2K",
    author: "@store4riders",
    order: 6,
    isActive: true,
  },
];

/**
 * SocialMediaSection:
 * - Left-aligned title ("INSTA REELS") with accent bar. No subtitle tagline.
 * - LEFT: Authentic Instagram mobile profile UI (avatar + story ring, stats, bio, action buttons, tabs, and 3x2 reels grid).
 * - RIGHT: 2 EQUAL-SIZED stacked cards with optional text cleanly positioned at the bottom of the card.
 * - Width set to max-w-[1180px] for balanced proportions.
 * - Fully connected to Admin Panel for both images and text.
 */
export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({
  title = "INSTA REELS",
  instagramHandle = "store4riders",
  instagramProfileUrl = "https://www.instagram.com/store4riders/",
  followersCount = "48.5K",
  followingCount = "142",
  postsCount = "1,280",
  profileAvatarUrl,
  reels,
  reelImages,
  bannerTop,
  bannerBottom,
}) => {
  const [activeModalReel, setActiveModalReel] = useState<IInstagramReel | null>(null);

  // Compile active reels list for homepage (always exactly 6 items for a sleek 2-row x 3-column grid)
  const activeReelsList: IInstagramReel[] = useMemo(() => {
    if (reels && reels.length > 0) {
      const filtered = reels.filter((r) => r.isActive !== false);
      if (filtered.length > 0) {
        const sorted = [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
        if (sorted.length < 6) {
          // Fill remaining slots from DEFAULT_STORE_REELS so the 3x2 grid remains complete
          const remainingNeeded = 6 - sorted.length;
          const fallbackSlice = DEFAULT_STORE_REELS.slice(sorted.length, sorted.length + remainingNeeded);
          return [...sorted, ...fallbackSlice];
        }
        return sorted.slice(0, 6);
      }
    }

    if (reelImages && reelImages.length > 0) {
      const defaultViews = ["4,234", "6,480", "8,721", "9.7K", "12.1K", "31.4K"];
      const customLegacy = reelImages.slice(0, 6).map((img, idx) => ({
        _id: `legacy-reel-${idx}`,
        title: `Store4Riders Reel #${idx + 1}`,
        thumbnailUrl: img,
        videoType: "embed" as const,
        videoUrl: "https://www.instagram.com/store4riders/",
        instagramUrl: "https://www.instagram.com/store4riders/",
        views: defaultViews[idx % defaultViews.length],
        author: `@${instagramHandle}`,
        order: idx + 1,
        isActive: true,
      }));
      if (customLegacy.length < 6) {
        const remainingNeeded = 6 - customLegacy.length;
        const fallbackSlice = DEFAULT_STORE_REELS.slice(customLegacy.length, customLegacy.length + remainingNeeded);
        return [...customLegacy, ...fallbackSlice];
      }
      return customLegacy;
    }

    return DEFAULT_STORE_REELS;
  }, [reels, reelImages, instagramHandle]);

  // Full reels list for the interactive modal (allows user to scroll through all 12-20 synced reels)
  const allModalReels: IInstagramReel[] = useMemo(() => {
    if (reels && reels.length > 0) {
      const filtered = reels.filter((r) => r.isActive !== false);
      if (filtered.length > 0) {
        return [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    }
    return activeReelsList;
  }, [reels, activeReelsList]);

  return (
    <section className="w-full bg-white py-5 sm:py-7 md:py-8 overflow-hidden">
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
        
        {/* Section Header — Left-Aligned */}
        <div className="text-left mb-3.5 sm:mb-4">
          <h2 className="font-sans text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            {title}
          </h2>
          <div className="w-10 h-1 bg-[#FF5429] mt-1.5 rounded-full" />
        </div>

        {/* 2-Column Balanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Instagram Profile Container                  */}
          {/* Sized cleanly like a smartphone screen                    */}
          {/* ========================================================= */}
          <div className="w-full max-w-[420px] mx-auto lg:max-w-none lg:col-span-5 flex flex-col">
            <div className="border-2 border-[#FF5429] bg-[#121212] rounded-2xl p-3 sm:p-3.5 shadow-sm text-white flex flex-col justify-between h-full overflow-hidden">
              
              <div>
                {/* 1. Instagram Profile Top Bar */}
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs tracking-tight text-white">
                      {instagramHandle}
                    </span>
                    {/* Verified Checkmark Badge */}
                    <svg className="w-3.5 h-3.5 text-[#0095f6] fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4-8 8z" />
                    </svg>
                  </div>

                  <a
                    href={instagramProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white transition-colors p-0.5"
                    aria-label="Open Instagram Profile"
                  >
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* 2. Instagram Profile Avatar & Stats Row */}
                <div className="flex items-center gap-3 my-1.5">
                  {/* Avatar with Story Gradient Ring */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0 shadow-xs">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black relative border-[1.5px] border-[#121212]">
                      <Image
                        src={profileAvatarUrl || "/favicon.png"}
                        alt="Store4Riders Instagram Profile"
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  </div>

                  {/* Profile Stats */}
                  <div className="flex-1 flex items-center justify-around text-center">
                    <div>
                      <span className="block font-bold text-xs sm:text-[13px] text-white leading-tight">
                        {postsCount || "1,280"}
                      </span>
                      <span className="text-[9.5px] text-white/60">posts</span>
                    </div>
                    <div>
                      <span className="block font-bold text-xs sm:text-[13px] text-white leading-tight">
                        {followersCount || "48.5K"}
                      </span>
                      <span className="text-[9.5px] text-white/60">followers</span>
                    </div>
                    <div>
                      <span className="block font-bold text-xs sm:text-[13px] text-white leading-tight">
                        {followingCount || "142"}
                      </span>
                      <span className="text-[9.5px] text-white/60">following</span>
                    </div>
                  </div>
                </div>

                {/* 3. Instagram Bio / Description */}
                <div className="text-left text-xs mb-2.5 space-y-0.5">
                  <span className="font-bold text-white text-[11.5px] sm:text-xs block leading-tight">
                    Store4Riders | Premium Riding Gear
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-white/60 block leading-tight">
                    Motorcycle Gear & Accessories Store
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] text-white/80 block leading-tight">
                    India&apos;s leading certified helmets, jackets, boots & gloves.
                  </span>
                  <a
                    href="https://store4riders.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-[10.5px] text-[#0095f6] hover:underline block font-medium"
                  >
                    store4riders.com
                  </a>
                </div>

                {/* 4. Action Buttons (Follow & Message) */}
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={instagramProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1 px-2.5 rounded-md bg-[#0095f6] hover:bg-[#1877f2] text-white text-[11px] font-bold text-center transition-colors shadow-xs"
                  >
                    Follow
                  </a>
                  <a
                    href={instagramProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1 px-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium text-center transition-colors border border-white/15"
                  >
                    Message
                  </a>
                </div>

                {/* 5. Instagram Navigation Tabs */}
                <div className="flex items-center justify-around border-t border-b border-white/10 py-1 mb-2">
                  {/* Grid Tab */}
                  <button
                    type="button"
                    aria-label="Instagram Grid View"
                    className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  </button>

                  {/* Reels Tab (Active with line indicator) */}
                  <div className="relative pb-0.5">
                    <button
                      type="button"
                      aria-label="Instagram Reels Active"
                      className="p-1 text-white flex items-center gap-1 cursor-default"
                    >
                      <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                      </svg>
                    </button>
                    <div className="absolute -bottom-1 inset-x-0 h-0.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                  </div>

                  {/* Guides / Bookmark Tab */}
                  <button
                    type="button"
                    aria-label="Instagram Guides"
                    className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>

                  {/* Tagged Profile Tab */}
                  <button
                    type="button"
                    aria-label="Instagram Tagged"
                    className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </button>
                </div>

                {/* 6. 3-Column Reels Grid */}
                <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                  {activeReelsList.map((reel, idx) => {
                    const isPinned = idx < 2;

                    return (
                      <div
                        key={reel._id ? `reel-${reel._id}` : `reel-${idx}`}
                        onClick={() => setActiveModalReel(reel)}
                        className="group relative aspect-[4/5] rounded-md overflow-hidden bg-neutral-900 border border-white/10 cursor-pointer select-none"
                      >
                        {/* Thumbnail Image */}
                        <Image
                          src={reel.thumbnailUrl || "/helmetcat.jpg"}
                          alt={reel.title || `Reel ${idx + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 30vw, (max-width: 1024px) 15vw, 140px"
                        />

                        {/* Top Gradient for Pin Icon */}
                        <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                        {/* Top-Right: Pin Icon */}
                        {isPinned && (
                          <div className="absolute top-1 right-1 z-10 text-white/90 drop-shadow-xs">
                            <svg className="w-2.5 h-2.5 fill-current transform rotate-45" viewBox="0 0 24 24">
                              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                            </svg>
                          </div>
                        )}

                        {/* Center Hover Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-black/30 backdrop-blur-[1px]">
                          <div className="w-7 h-7 rounded-full bg-[#FF5429] text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform">
                            <PlayIcon className="w-3 h-3 ml-0.5 text-white" />
                          </div>
                        </div>

                        {/* Bottom Gradient with View Count */}
                        <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none flex items-center gap-1">
                          <PlayIcon className="w-2 h-2 text-white fill-current shrink-0" />
                          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-white drop-shadow leading-none">
                            {reel.views || "4,234"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Footer Hint */}
              <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 px-0.5">
                <span>@{instagramHandle}</span>
                <span>Click any reel to play</span>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Stacked Banners (image 1 & image 2)         */}
          {/* BOTH CARDS ARE EQUAL SIZE (flex-1) with optional text     */}
          {/* cleanly rendered at the bottom (never in the middle)      */}
          {/* ========================================================= */}
          <div className="w-full lg:col-span-7 flex flex-col gap-4 sm:gap-5 h-full">
            {/* Auto-focal alignment: defaults to top-alignment so faces, heads & helmets are NEVER cropped */}
            {(() => {
              const topPositionClass =
                bannerTop?.imagePosition === "center"
                  ? "object-center"
                  : bannerTop?.imagePosition === "bottom"
                  ? "object-bottom"
                  : "object-top";

              const bottomPositionClass =
                bannerBottom?.imagePosition === "center"
                  ? "object-center"
                  : bannerBottom?.imagePosition === "bottom"
                  ? "object-bottom"
                  : "object-top";

              return (
                <>
                  {/* Top Card: image 1 (Equal Size Promotional Banner Card) */}
                  <div className="flex-1 min-h-[220px] sm:min-h-[235px] md:min-h-[240px] rounded-2xl overflow-hidden shadow-sm bg-neutral-900 group relative">
                    <Link
                      href={bannerTop?.linkUrl || "/products"}
                      className="absolute inset-0 block w-full h-full"
                    >
                      <Image
                        src={bannerTop?.imageUrl || "/heropic2.jpg"}
                        alt={bannerTop?.title || "Store4Riders Promotional Banner"}
                        fill
                        className={`object-cover ${topPositionClass} group-hover:scale-105 transition-transform duration-500`}
                        sizes="(max-width: 1024px) 100vw, 55vw"
                      />
                      
                      {/* Text & CTA Button at Bottom */}
                      {(bannerTop?.title || bannerTop?.description || bannerTop?.subtitle || bannerTop?.buttonText) ? (
                        <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 pointer-events-none">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            {bannerTop.title && (
                              <h3 className="font-sans text-sm min-[400px]:text-base sm:text-lg font-black uppercase tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-tight">
                                {bannerTop.title}
                              </h3>
                            )}
                            {(bannerTop.description || bannerTop.subtitle) && (
                              <p className="text-xs sm:text-[13px] text-neutral-200 font-semibold leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-2">
                                {bannerTop.description || bannerTop.subtitle}
                              </p>
                            )}
                          </div>

                          {bannerTop.buttonText && (
                            <div className="shrink-0 self-start sm:self-end">
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF5429] hover:bg-[#e0451d] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF5429]/30 group-hover:scale-105 transition-all duration-300">
                                <span>{bannerTop.buttonText}</span>
                                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                      )}
                    </Link>
                  </div>

                  {/* Bottom Card: image 2 (Equal Size Promotional Banner Card) */}
                  <div className="flex-1 min-h-[220px] sm:min-h-[235px] md:min-h-[240px] rounded-2xl overflow-hidden shadow-sm bg-neutral-900 group relative">
                    <Link
                      href={bannerBottom?.linkUrl || "/products"}
                      className="absolute inset-0 block w-full h-full"
                    >
                      <Image
                        src={bannerBottom?.imageUrl || "/heropic1.jpg"}
                        alt={bannerBottom?.title || "Store4Riders Promotional Banner"}
                        fill
                        className={`object-cover ${bottomPositionClass} group-hover:scale-105 transition-transform duration-500`}
                        sizes="(max-width: 1024px) 100vw, 55vw"
                      />
                
                      {/* Text & CTA Button at Bottom */}
                      {(bannerBottom?.title || bannerBottom?.description || bannerBottom?.subtitle || bannerBottom?.buttonText) ? (
                        <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 pointer-events-none">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            {bannerBottom.title && (
                              <h3 className="font-sans text-sm min-[400px]:text-base sm:text-lg font-black uppercase tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-tight">
                                {bannerBottom.title}
                              </h3>
                            )}
                            {(bannerBottom.description || bannerBottom.subtitle) && (
                              <p className="text-xs sm:text-[13px] text-neutral-200 font-semibold leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-2">
                                {bannerBottom.description || bannerBottom.subtitle}
                              </p>
                            )}
                          </div>

                          {bannerBottom.buttonText && (
                            <div className="shrink-0 self-start sm:self-end">
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF5429] hover:bg-[#e0451d] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF5429]/30 group-hover:scale-105 transition-all duration-300">
                                <span>{bannerBottom.buttonText}</span>
                                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                      )}
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>

        </div>

      </div>

      {/* Video Modal Player (Plays video/embed on reel click) */}
      <ReelVideoModal
        isOpen={!!activeModalReel}
        onClose={() => setActiveModalReel(null)}
        activeReel={activeModalReel}
        reels={allModalReels}
        onSelectReel={(r) => setActiveModalReel(r)}
        instagramHandle={instagramHandle}
        instagramProfileUrl={instagramProfileUrl}
        profileAvatarUrl={profileAvatarUrl}
      />
    </section>
  );
};

export default SocialMediaSection;
