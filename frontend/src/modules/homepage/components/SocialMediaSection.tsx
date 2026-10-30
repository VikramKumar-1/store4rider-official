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
  profileName?: string;
  bio?: string;
  websiteUrl?: string;
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
 * SocialMediaSection:
 * - Left-aligned title ("Store4Riders on Insta") with accent bar. No subtitle tagline.
 * - LEFT: Authentic Instagram mobile profile UI (avatar + story ring, stats, bio, action buttons, tabs, and 3x2 reels grid).
 * - RIGHT: 2 EQUAL-SIZED stacked cards with optional text cleanly positioned at the bottom of the card.
 * - Width set to max-w-[1180px] for balanced proportions.
 * - Fully connected to Admin Panel for both images and text.
 */
export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({
  title = "Store4Riders on Insta",
  instagramHandle = "store4riders",
  instagramProfileUrl = "https://www.instagram.com/store4riders/",
  profileName,
  bio,
  websiteUrl,
  followersCount,
  followingCount,
  postsCount,
  profileAvatarUrl,
  reels,
  reelImages,
  bannerTop,
  bannerBottom,
}) => {
  const [activeModalReel, setActiveModalReel] = useState<IInstagramReel | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "reels">("all");

  // Compile full active reels list from props (sorted by order, which is newest first)
  const allActiveReels: IInstagramReel[] = useMemo(() => {
    if (reels && reels.length > 0) {
      const filtered = reels.filter((r) => r.isActive !== false);
      if (filtered.length > 0) {
        return [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    }

    if (reelImages && reelImages.length > 0) {
      return reelImages.map((img, idx) => ({
        _id: `legacy-reel-${idx}`,
        title: `Store4Riders Reel #${idx + 1}`,
        thumbnailUrl: img,
        videoType: "embed" as const,
        videoUrl: "https://www.instagram.com/store4riders/",
        instagramUrl: "https://www.instagram.com/store4riders/",
        views: "Live",
        author: `@${instagramHandle}`,
        order: idx + 1,
        isActive: true,
      }));
    }

    return [];
  }, [reels, reelImages, instagramHandle]);

  // Tab filtering: 'all' shows all latest posts & reels; 'reels' filters to genuine video reels
  const currentTabReels: IInstagramReel[] = useMemo(() => {
    if (activeTab === "reels") {
      const videoOnly = allActiveReels.filter(
        (r) =>
          r.videoType === "upload" ||
          (r.videoUrl && /\.(mp4|webm)(\?.*)?$/i.test(r.videoUrl)) ||
          r.instagramUrl?.includes("/reel/")
      );
      return videoOnly.length > 0 ? videoOnly : allActiveReels;
    }
    return allActiveReels;
  }, [allActiveReels, activeTab]);

  // Displayed reels: shows 6 items by default for balanced proportions, or all when expanded
  const displayedReels: IInstagramReel[] = useMemo(() => {
    return currentTabReels.slice(0, 6);
  }, [currentTabReels]);

  // Full reels list for the interactive modal (allows user to scroll through all 12-20 synced reels)
  const allModalReels: IInstagramReel[] = useMemo(() => {
    return allActiveReels;
  }, [allActiveReels]);

  return (
    <section className="w-full max-w-[1400px] mx-auto bg-white py-4 sm:py-5 md:py-6 overflow-hidden">
      <div className="w-full max-w-[1080px] mx-auto px-4 sm:px-6">
        
        {/* Section Header — Left-Aligned */}
        <div className="text-left mb-3.5 sm:mb-4">
          <h2 className="font-sans text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            {title}
          </h2>
          <div className="w-10 h-1 bg-brand mt-1.5 rounded-full" />
        </div>

        {/* 2-Column Balanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Instagram Profile Container                  */}
          {/* ========================================================= */}
          <div className="w-full max-w-[420px] mx-auto lg:max-w-none lg:col-span-5 flex flex-col">
            <div className="rounded-2xl p-3 sm:p-3.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15),0_8px_10px_-6px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.08] bg-[#121212] text-white flex flex-col justify-between h-full overflow-hidden">
              
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
                        unoptimized={!!profileAvatarUrl}
                        priority
                      />
                    </div>
                  </div>

                  {/* Profile Stats */}
                  <div className="flex-1 flex items-center justify-around text-center">
                    <div>
                      <span className="block font-bold text-xs sm:text-[13px] text-white leading-tight min-h-[16px]">
                        {postsCount ? postsCount : <span className="inline-block w-8 h-3.5 bg-white/20 rounded animate-pulse align-middle" />}
                      </span>
                      <span className="text-[9.5px] text-white/60">posts</span>
                    </div>
                    <div>
                      <span className="block font-bold text-xs sm:text-[13px] text-white leading-tight min-h-[16px]">
                        {followersCount ? followersCount : <span className="inline-block w-8 h-3.5 bg-white/20 rounded animate-pulse align-middle" />}
                      </span>
                      <span className="text-[9.5px] text-white/60">followers</span>
                    </div>
                    <div>
                      <span className="block font-bold text-xs sm:text-[13px] text-white leading-tight min-h-[16px]">
                        {followingCount ? followingCount : <span className="inline-block w-8 h-3.5 bg-white/20 rounded animate-pulse align-middle" />}
                      </span>
                      <span className="text-[9.5px] text-white/60">following</span>
                    </div>
                  </div>
                </div>

                {/* 3. Instagram Bio / Description */}
                <div className="text-left text-xs mb-2.5 space-y-0.5">
                  <span className="font-bold text-white text-[11.5px] sm:text-xs block leading-tight">
                    {profileName || "Store4Riders | Premium Riding Gear"}
                  </span>
                  {bio ? (
                    <p className="text-[10px] sm:text-[10.5px] text-white/80 leading-snug whitespace-pre-line py-0.5">
                      {bio}
                    </p>
                  ) : (
                    <>
                      <span className="text-[10px] sm:text-[10.5px] text-white/60 block leading-tight">
                        Motorcycle Gear & Accessories Store
                      </span>
                      <span className="text-[10px] sm:text-[10.5px] text-white/80 block leading-tight">
                        India&apos;s leading certified helmets, jackets, boots & gloves.
                      </span>
                    </>
                  )}
                  <a
                    href={websiteUrl || "https://store4riders.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-[10.5px] text-[#0095f6] hover:underline block font-medium"
                  >
                    {websiteUrl ? websiteUrl.replace(/^https?:\/\/(www\.)?/, "") : "store4riders.com"}
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
                  {/* Grid Tab (All Posts & Reels) */}
                  <div className="relative pb-0.5 flex-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab("all")}
                      aria-label="Instagram Grid View - All Posts"
                      className={`p-1 flex items-center gap-1 transition-colors cursor-pointer ${
                        activeTab === "all" ? "text-white" : "text-white/50 hover:text-white"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                      <span className="text-[10px] font-semibold">Posts</span>
                    </button>
                    {activeTab === "all" && (
                      <div className="absolute -bottom-1 inset-x-3 h-0.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                    )}
                  </div>

                  {/* Reels Tab (Video Reels) */}
                  <div className="relative pb-0.5 flex-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab("reels")}
                      aria-label="Instagram Reels View - Videos Only"
                      className={`p-1 flex items-center gap-1 transition-colors cursor-pointer ${
                        activeTab === "reels" ? "text-white" : "text-white/50 hover:text-white"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                      </svg>
                      <span className="text-[10px] font-semibold">Reels</span>
                    </button>
                    {activeTab === "reels" && (
                      <div className="absolute -bottom-1 inset-x-3 h-0.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                    )}
                  </div>
                </div>

                {/* 6. 3-Column Reels Grid */}
                <div className="grid grid-cols-3 gap-1 sm:gap-1.5 min-h-[220px]">
                  {displayedReels.length === 0 ? (
                    Array.from({ length: 6 }).map((_, skeletonIdx) => (
                      <div
                        key={`reel-skeleton-${skeletonIdx}`}
                        className="aspect-[4/5] rounded-md bg-white/5 animate-pulse border border-white/5 relative overflow-hidden flex flex-col justify-end p-1.5"
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                          <div className="w-8 h-2 bg-white/20 rounded" />
                        </div>
                      </div>
                    ))
                  ) : (
                    displayedReels.map((reel, idx) => {
                      const isPinned = idx < 2;

                      return (
                        <div
                          key={reel._id ? `reel-${reel._id}` : `reel-${idx}`}
                          onClick={() => setActiveModalReel(reel)}
                          className="group relative aspect-[4/5] rounded-md overflow-hidden bg-neutral-900 border border-white/10 cursor-pointer select-none"
                        >
                          {/* Thumbnail Image - unoptimized loads directly from Meta CDN with 0 serverless proxy latency */}
                          <Image
                            src={reel.thumbnailUrl || "/helmetcat.jpg"}
                            alt={reel.title || `Reel ${idx + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 30vw, (max-width: 1024px) 15vw, 140px"
                            unoptimized={
                              reel.thumbnailUrl?.includes("cdninstagram.com") ||
                              reel.thumbnailUrl?.includes("fbcdn.net") ||
                              reel.thumbnailUrl?.startsWith("http")
                            }
                            priority={idx < 3}
                            loading={idx < 3 ? "eager" : "lazy"}
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
                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                              <PlayIcon className="w-3 h-3 ml-0.5 text-white" />
                            </div>
                          </div>

                          {/* Bottom Subtle Gradient */}
                          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* See More Reels Button -> Opens Instagram-like Vertical Reels Modal */}
                {currentTabReels.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setActiveModalReel(currentTabReels[0])}
                    className="w-full py-2 px-3 mt-2 rounded-lg bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white text-[11px] font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  >
                    <svg className="w-3.5 h-3.5 fill-current transform group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                    <span>See More ({currentTabReels.length} Reels)</span>
                  </button>
                )}
              </div>

              {/* Bottom Footer Hint */}
              <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 px-0.5">
                <span>@{instagramHandle}</span>
                <span>
                  {currentTabReels.length > 6
                    ? `Showing ${displayedReels.length} of ${currentTabReels.length} • Click to play`
                    : "Click any reel to play"}
                </span>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Stacked Banners (image 1 & image 2)         */}
          {/* BOTH CARDS ARE EQUAL SIZE (flex-1) with optional text     */}
          {/* cleanly rendered at the bottom (never in the middle)      */}
          {/* ========================================================= */}
          <div className="w-full max-w-[420px] mx-auto lg:max-w-none lg:col-span-7 flex flex-col gap-3.5 sm:gap-4 h-full">
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
                  <div className="h-[210px] sm:h-[235px] md:h-[250px] lg:h-full lg:flex-1 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15),0_8px_10px_-6px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.08] bg-neutral-900 group relative">
                    <Link
                      href={bannerTop?.linkUrl || "/riding-gear/motorcycle-riding-boots"}
                      className="absolute inset-0 block w-full h-full"
                    >
                      <Image
                        src={bannerTop?.imageUrl || "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/f/o/forma-viper-urban-motorcycle-riding-boots-black.jpg"}
                        alt={bannerTop?.title || "Store4Riders Promotional Banner"}
                        fill
                        unoptimized={true}
                        priority
                        className={`object-cover ${topPositionClass} group-hover:scale-105 transition-transform duration-500`}
                        sizes="(max-width: 1024px) 100vw, 55vw"
                      />
                      
                      {/* Bottom Layout: Glassmorphic Text Capsule (Text Only) + Soft Muted Orange CTA */}
                      {(bannerTop?.title || bannerTop?.description || bannerTop?.subtitle || bannerTop?.buttonText) ? (
                        <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3.5 sm:bottom-3.5 flex items-end justify-between gap-2 pointer-events-none">
                          {(bannerTop?.title || bannerTop?.description || bannerTop?.subtitle) && (
                            <div className="min-w-0 max-w-[70%] sm:max-w-[74%] px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                              {bannerTop.title && (
                                <h3 className="font-sans text-[11px] min-[380px]:text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white drop-shadow-sm leading-tight line-clamp-1">
                                  {bannerTop.title}
                                </h3>
                              )}
                              {(bannerTop.description || bannerTop.subtitle) && (
                                <p className="text-[9px] min-[380px]:text-[9.5px] sm:text-[10.5px] text-neutral-200 font-normal leading-tight drop-shadow-xs line-clamp-1 mt-0.5">
                                  {bannerTop.description || bannerTop.subtitle}
                                </p>
                              )}
                            </div>
                          )}

                          {bannerTop.buttonText && (
                            <div className="shrink-0">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-[#ea580c]/90 hover:bg-[#ea580c] active:scale-95 text-white text-[8.5px] min-[380px]:text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-[0_3px_10px_rgba(234,88,12,0.3)] border border-white/20 group-hover:scale-105 transition-all duration-200 pointer-events-auto">
                                <span>{bannerTop.buttonText}</span>
                                <svg className="w-2.5 h-2.5 text-white transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                  <div className="h-[210px] sm:h-[235px] md:h-[250px] lg:h-full lg:flex-1 rounded-2xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15),0_8px_10px_-6px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.08] bg-neutral-900 group relative">
                    <Link
                      href={bannerBottom?.linkUrl || "/motorcycle-bags-bike-luggage"}
                      className="absolute inset-0 block w-full h-full"
                    >
                      <Image
                        src={bannerBottom?.imageUrl || "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/b/b/bbg_hybrid_tail_bag.jpg"}
                        alt={bannerBottom?.title || "Store4Riders Promotional Banner"}
                        fill
                        unoptimized={true}
                        priority
                        className={`object-cover ${bottomPositionClass} group-hover:scale-105 transition-transform duration-500`}
                        sizes="(max-width: 1024px) 100vw, 55vw"
                      />
                
                      {/* Bottom Layout: Glassmorphic Text Capsule (Text Only) + Soft Muted Orange CTA */}
                      {(bannerBottom?.title || bannerBottom?.description || bannerBottom?.subtitle || bannerBottom?.buttonText) ? (
                        <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3.5 sm:bottom-3.5 flex items-end justify-between gap-2 pointer-events-none">
                          {(bannerBottom?.title || bannerBottom?.description || bannerBottom?.subtitle) && (
                            <div className="min-w-0 max-w-[70%] sm:max-w-[74%] px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
                            {bannerBottom.title && (
                              <h3 className="font-sans text-[11px] min-[380px]:text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white drop-shadow-sm leading-tight line-clamp-1">
                                {bannerBottom.title}
                              </h3>
                            )}
                            {(bannerBottom.description || bannerBottom.subtitle) && (
                              <p className="text-[9px] min-[380px]:text-[9.5px] sm:text-[10.5px] text-neutral-200 font-normal leading-tight drop-shadow-xs line-clamp-1 mt-0.5">
                                {bannerBottom.description || bannerBottom.subtitle}
                              </p>
                            )}
                          </div>
                        )}

                          {bannerBottom.buttonText && (
                            <div className="shrink-0">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-[#ea580c]/90 hover:bg-[#ea580c] active:scale-95 text-white text-[8.5px] min-[380px]:text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-[0_3px_10px_rgba(234,88,12,0.3)] border border-white/20 group-hover:scale-105 transition-all duration-200 pointer-events-auto">
                                <span>{bannerBottom.buttonText}</span>
                                <svg className="w-2.5 h-2.5 text-white transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
