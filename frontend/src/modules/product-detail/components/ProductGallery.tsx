"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { ProductImage } from "../types/product-detail.types";
import { normalizeExternalImageUrl, getVideoEmbedInfo } from "@/core/utils/mediaUrlHelper";

const FALLBACK_IMAGE = "/no-image.svg";

/**
 * High-performance Thumbnail:
 * Uses lazy loading and off-main-thread decoding (decoding="async")
 * so thumbnail processing never stutters the main UI thread.
 */
const Thumbnail = React.memo(
  ({
    img,
    idx,
    isActive,
    productTitle,
    fallbackUrl,
    onClick,
  }: {
    img: ProductImage;
    idx: number;
    isActive: boolean;
    productTitle?: string;
    fallbackUrl?: string;
    onClick: () => void;
  }) => {
    const rawUrl = img?.url || (idx === 0 ? fallbackUrl : "");
    const normalizedUrl = normalizeExternalImageUrl(rawUrl);
    const [src, setSrc] = useState(normalizedUrl || fallbackUrl || FALLBACK_IMAGE);

    useEffect(() => {
      const u = img?.url || (idx === 0 ? fallbackUrl : "");
      if (u) {
        setSrc(normalizeExternalImageUrl(u));
      }
    }, [img?.url, idx, fallbackUrl]);

    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-20 sm:w-24 aspect-square shrink-0 border-2 rounded-sm overflow-hidden bg-[#f4f4f4] transition-all duration-150 cursor-pointer ${
          isActive ? "border-brand ring-2 ring-brand/30" : "border-neutral-200 hover:border-neutral-300"
        }`}
      >
        <img
          src={src}
          alt={img?.altText || (productTitle ? `${productTitle} thumbnail ${idx + 1}` : `Product thumbnail ${idx + 1}`)}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain mix-blend-multiply absolute inset-0"
          onError={() => {
            if (fallbackUrl && src !== fallbackUrl) {
              setSrc(fallbackUrl);
            } else {
              setSrc(FALLBACK_IMAGE);
            }
          }}
        />
      </button>
    );
  }
);
Thumbnail.displayName = "Thumbnail";

// 100% bulletproof normalization: remove EVERYTHING except letters and numbers!
const normalizeForCompare = (str: string) => {
  if (!str) return "";
  return str.replace(/[^a-z0-9]/gi, "").toLowerCase();
};

const findMatchingImageIndex = (selectedColor: string | undefined, images: ProductImage[]): number => {
  if (!selectedColor || !images || images.length === 0) return -1;

  const normalizedValue = selectedColor.trim().toLowerCase();
  const exactNormVal = normalizeForCompare(selectedColor);

  let matchIdx = -1;

  // 1. Exact Match on Color Portion (or full string)
  matchIdx = images.findIndex((img) => {
    if (!img.altText) return false;
    const parts = img.altText.split("-");
    if (parts.length > 1 && normalizeForCompare(parts[parts.length - 1]) === exactNormVal) return true;
    if (normalizeForCompare(img.altText) === exactNormVal) return true;
    if (normalizeForCompare(img.altText).endsWith(exactNormVal)) return true;
    return false;
  });
  if (matchIdx !== -1) return matchIdx;

  // 2. Token Matching (Exclusivity Check for Pure Colors)
  const tokens = normalizedValue.split(/[/\\&\-_+ ]/).filter(Boolean);
  const isPureColor = tokens.length === 1;
  const allAccents = ["red", "orange", "blue", "green", "neon", "yellow", "silver", "white", "grey", "gray", "brown", "purple", "flu", "fluo", "hiviz", "hi-viz", "hi", "viz"];

  matchIdx = images.findIndex((img) => {
    const alt = (img.altText || "").toLowerCase();
    const url = (img.url || "").toLowerCase();

    if (isPureColor && tokens[0] === "black") {
      if (allAccents.some((c) => alt.includes(c) || url.includes(c))) return false;
      return alt.includes("black") || url.includes("black");
    }

    return tokens.every((t) => {
      const term = t === "flu." || t === "flu" ? "neon" : t;

      let isMatch = alt.includes(term) || url.includes(term);
      if (t === "flu." && !isMatch) isMatch = alt.includes("flu") || url.includes("flu");

      if (term === "yellow" && !isMatch) {
        isMatch = alt.includes("orange") || url.includes("orange");
      }

      return isMatch;
    });
  });

  return matchIdx;
};

export const ProductGallery: React.FC<{
  images: ProductImage[];
  selectedColor?: string;
  selectedSize?: string;
  activeVariantImageUrl?: string;
  colorImages?: Record<string, string>;
  colors?: Array<{ name: string; background: string; imageUrl?: string }>;
  productTitle?: string;
  videoUrl?: string;
  onColorChange?: (color: string) => void;
}> = ({
  images,
  selectedColor,
  selectedSize,
  activeVariantImageUrl,
  colorImages,
  colors,
  productTitle,
  videoUrl,
  onColorChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainSrc, setMainSrc] = useState(
    normalizeExternalImageUrl(images?.[0]?.url) || FALLBACK_IMAGE
  );
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const prevColorRef = useRef(selectedColor);

  // 120 FPS Buttery-Smooth Zoom: Uses cached bounding rect & CSS variables
  // Zero React state updates / re-renders during mouse movement!
  const [isZoomed, setIsZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafId = useRef<number | null>(null);

  const videoEmbed = useMemo(() => getVideoEmbedInfo(videoUrl), [videoUrl]);

  const normalizeUrl = (url?: string) =>
    url ? url.split("?")[0].replace("http://", "https://").trim().toLowerCase() : "";

  const primaryImageUrl = images?.[0]?.url;

  // Sync main image whenever primary image URL changes (navigation to different product)
  useEffect(() => {
    if (primaryImageUrl) {
      setActiveIndex(0);
      setMainSrc(normalizeExternalImageUrl(primaryImageUrl));
      setIsVideoActive(false);
    }
  }, [primaryImageUrl]);

  // When selectedColor changes, switch to exact matching image
  useEffect(() => {
    if (selectedColor || activeVariantImageUrl) {
      prevColorRef.current = selectedColor;
      setIsVideoActive(false);

      // 1. If active variant has an explicit image URL
      if (activeVariantImageUrl) {
        const cleanVarUrl = normalizeExternalImageUrl(activeVariantImageUrl);
        const normTarget = normalizeUrl(cleanVarUrl);
        const matchIdx = images.findIndex((img) => normalizeUrl(img.url) === normTarget);
        if (matchIdx !== -1) {
          setActiveIndex(matchIdx);
          setMainSrc(normalizeExternalImageUrl(images[matchIdx].url));
          return;
        } else {
          setMainSrc(cleanVarUrl);
          return;
        }
      }

      // 2. Check explicitly defined colorImages mapping from product
      if (selectedColor && colorImages && colorImages[selectedColor]) {
        const targetUrl = normalizeExternalImageUrl(colorImages[selectedColor]);
        const normTarget = normalizeUrl(targetUrl);
        const matchIdx = images.findIndex((img) => normalizeUrl(img.url) === normTarget);
        if (matchIdx !== -1) {
          setActiveIndex(matchIdx);
          setMainSrc(normalizeExternalImageUrl(images[matchIdx].url));
          return;
        } else {
          setMainSrc(targetUrl);
          return;
        }
      }

      // 3. Fallback: match by color name in altText or URL
      if (selectedColor) {
        const matchIdx = findMatchingImageIndex(selectedColor, images);
        if (matchIdx !== -1) {
          setActiveIndex(matchIdx);
          setMainSrc(normalizeExternalImageUrl(images[matchIdx]?.url) || FALLBACK_IMAGE);
          return;
        }
      }
    }
  }, [selectedColor, images, activeVariantImageUrl, colorImages]);

  const handleSelect = useCallback(
    (idx: number) => {
      setIsVideoActive(false);
      setActiveIndex(idx);
      const clickedImg = images[idx];
      setMainSrc(normalizeExternalImageUrl(clickedImg?.url) || FALLBACK_IMAGE);

      // Dynamically detect and switch color when a thumbnail is clicked
      if (onColorChange && clickedImg?.url) {
        const normClickedUrl = normalizeUrl(clickedImg.url);

        if (colorImages) {
          const matchedColor = Object.keys(colorImages).find(
            (c) => normalizeUrl(colorImages[c]) === normClickedUrl
          );
          if (matchedColor) {
            onColorChange(matchedColor);
            return;
          }
        }

        if (colors && colors.length > 0) {
          const matchedByImg = colors.find(
            (c) => c.imageUrl && normalizeUrl(c.imageUrl) === normClickedUrl
          );
          if (matchedByImg) {
            onColorChange(matchedByImg.name);
            return;
          }

          if (clickedImg.altText && clickedImg.altText.includes(" - ")) {
            const parts = clickedImg.altText.split(" - ");
            const possibleColor = parts[parts.length - 1].trim().toLowerCase();
            const matchedColorObj = colors.find(
              (c) => c.name.toLowerCase() === possibleColor
            );
            if (matchedColorObj) {
              onColorChange(matchedColorObj.name);
              return;
            }
          }
        }
      }
    },
    [images, onColorChange, colorImages, colors]
  );

  const handleVideoClick = useCallback(() => {
    setIsVideoActive(true);
    setIsIframeLoading(true);
    setIsZoomed(false);
  }, []);

  // 120 FPS Smooth Mouse Zoom: Caches rect on enter, updates CSS vars on RAF
  const handleMouseEnter = useCallback(() => {
    if (isVideoActive) return;
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      if (containerRef.current) {
        rectRef.current = containerRef.current.getBoundingClientRect();
      }
      setIsZoomed(true);
    }
  }, [isVideoActive]);

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false);
    rectRef.current = null;
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isVideoActive) return;
    if (!rectRef.current && containerRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    if (!rect) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

      if (containerRef.current) {
        containerRef.current.style.setProperty("--zoom-x", `${x}%`);
        containerRef.current.style.setProperty("--zoom-y", `${y}%`);
      }
    });
  }, [isVideoActive]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 relative select-none">
      {/* Main Large Viewer (Photo / Zoom / Video Player) ÔÇö Exact same container, Flipkart style */}
      <div
        ref={containerRef}
        className={`relative aspect-square md:aspect-[10/11] w-full max-h-[500px] md:max-h-[580px] bg-[#f4f4f4] rounded-xl border border-neutral-200/80 overflow-hidden will-change-transform ${
          isVideoActive ? "cursor-default" : "cursor-default lg:cursor-none"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {isVideoActive && videoEmbed ? (
          /* Active Video Player View ÔÇö Plays inline in the same div, zero modal popup */
          <div className="relative w-full h-full bg-black flex items-center justify-center cursor-default z-30">
            {/* Zero-Lag Video Poster & Loader ÔÇö eliminates blank black screen while buffering */}
            {isIframeLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950 overflow-hidden">
                {videoEmbed.thumbnailUrl ? (
                  <img
                    src={videoEmbed.thumbnailUrl}
                    alt="Loading Video"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-45 scale-105 blur-xs transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
                )}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                  <div className="w-9 h-9 border-3 border-brand border-t-transparent rounded-full animate-spin shadow-lg" />
                  <span className="text-xs font-bold text-white/95 tracking-wide drop-shadow-md">
                    Loading video player...
                  </span>
                </div>
              </div>
            )}

            {videoEmbed.type === "youtube" || videoEmbed.type === "vimeo" || videoEmbed.type === "iframe" ? (
              <iframe
                src={`${videoEmbed.embedUrl}${videoEmbed.embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
                title={productTitle || "Product Video"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setIsIframeLoading(false)}
              />
            ) : (
              <video
                src={videoEmbed.embedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onLoadedData={() => setIsIframeLoading(false)}
              />
            )}
          </div>
        ) : (
          /* Standard Image View with GPU-accelerated Zoom */
          <>
            <Image
              src={mainSrc}
              alt={images[activeIndex]?.altText || (productTitle ? `${productTitle} - Image ${activeIndex + 1}` : "Product image")}
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-contain mix-blend-multiply transition-opacity duration-150"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setMainSrc(FALLBACK_IMAGE)}
            />

            {/* 120 FPS GPU Magnifier: zero React re-renders while moving mouse */}
            {isZoomed && (
              <>
                <div
                  className="absolute inset-0 z-10 pointer-events-none hidden lg:block will-change-transform"
                  style={{
                    clipPath: "circle(125px at var(--zoom-x, 50%) var(--zoom-y, 50%))",
                  }}
                >
                  <div className="relative w-full h-full bg-[#f4f4f4]">
                    <Image
                      src={mainSrc}
                      alt={images[activeIndex]?.altText ? `${images[activeIndex].altText} (Zoomed)` : (productTitle ? `${productTitle} (Zoomed)` : "Product zoomed view")}
                      fill
                      unoptimized
                      referrerPolicy="no-referrer"
                      className="object-contain mix-blend-multiply will-change-transform"
                      style={{
                        transformOrigin: "var(--zoom-x, 50%) var(--zoom-y, 50%)",
                        transform: "scale(1.8)",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="absolute z-20 pointer-events-none hidden lg:block rounded-full border-2 border-neutral-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.06),0_8px_30px_rgba(0,0,0,0.18)] will-change-transform"
                  style={{
                    left: "calc(var(--zoom-x, 50%) - 125px)",
                    top: "calc(var(--zoom-y, 50%) - 125px)",
                    width: "250px",
                    height: "250px",
                  }}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Thumbnails Row with Arrows & Video Thumbnail */}
      <div className="relative flex items-center group">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 bg-white shadow-md border border-neutral-200 rounded-full p-1.5 hover:bg-neutral-50 transition-all -ml-3 hidden md:flex opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 px-1 w-full scroll-smooth"
        >
          {/* Primary Front Cover Image */}
          {images[0] && (
            <Thumbnail
              key={`${images[0].url || 0}-0`}
              img={images[0]}
              idx={0}
              isActive={!isVideoActive && activeIndex === 0}
              productTitle={productTitle}
              fallbackUrl={mainSrc}
              onClick={() => handleSelect(0)}
            />
          )}

          {/* Flipkart-Style Video Thumbnail (Position #2, immediately visible without scrolling) */}
          {videoEmbed && (
            <button
              type="button"
              onClick={handleVideoClick}
              className={`relative w-20 sm:w-24 aspect-square shrink-0 border-2 rounded-sm overflow-hidden bg-slate-900 transition-all duration-150 flex flex-col items-center justify-center group cursor-pointer ${
                isVideoActive
                  ? "border-brand ring-2 ring-brand/40"
                  : "border-neutral-200 hover:border-neutral-400"
              }`}
              title="Watch Product Video"
            >
              {videoEmbed.thumbnailUrl ? (
                <>
                  <img
                    src={videoEmbed.thumbnailUrl}
                    alt="Video Thumbnail"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition-colors" />
                </>
              ) : images?.[0]?.url ? (
                <>
                  <img
                    src={normalizeExternalImageUrl(images[0].url)}
                    alt="Video Thumbnail"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain mix-blend-multiply opacity-50 absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Play size={12} fill="currentColor" className="ml-0.5" />
                </div>
                <span className="text-[10px] font-bold text-white tracking-wider uppercase bg-black/75 px-1.5 py-0.5 rounded shadow-xs">
                  Video
                </span>
              </div>
            </button>
          )}

          {/* Remaining Angle Product Images */}
          {images.slice(1).map((img, i) => {
            const idx = i + 1;
            return (
              <Thumbnail
                key={`${img.url || idx}-${idx}`}
                img={img}
                idx={idx}
                isActive={!isVideoActive && activeIndex === idx}
                productTitle={productTitle}
                onClick={() => handleSelect(idx)}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 bg-white shadow-md border border-neutral-200 rounded-full p-1.5 hover:bg-neutral-50 transition-all -mr-3 hidden md:flex opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
};
