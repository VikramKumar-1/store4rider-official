"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ProductImage } from "../types/product-detail.types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80";

/**
 * Thumbnail with its own error state so one broken image
 * doesn't affect the rest of the gallery.
 */
const Thumbnail: React.FC<{
  img: ProductImage;
  idx: number;
  isActive: boolean;
  onClick: () => void;
}> = ({ img, idx, isActive, onClick }) => {
  const [src, setSrc] = useState(img.url);
  return (
    <button
      onClick={onClick}
      className={`relative w-20 sm:w-24 aspect-square shrink-0 border-2 rounded-sm overflow-hidden bg-neutral-100 transition-all ${
        isActive ? "border-brand" : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <Image
        src={src}
        alt={`Thumbnail ${idx}`}
        fill
        unoptimized
        className="object-contain p-1"
        onError={() => setSrc(FALLBACK_IMAGE)}
      />
    </button>
  );
};

const findMatchingImageIndex = (selectedColor: string | undefined, images: ProductImage[]): number => {
  if (!selectedColor || !images || images.length === 0) return -1;

  const normalizedColor = selectedColor.trim().toLowerCase();
  
  // 1. Direct match on altText
  let matchIdx = images.findIndex(img => 
    (img.altText || "").toLowerCase().includes(normalizedColor)
  );
  if (matchIdx !== -1) return matchIdx;

  // 2. Direct match on image URL
  matchIdx = images.findIndex(img => 
    (img.url || "").toLowerCase().includes(normalizedColor)
  );
  if (matchIdx !== -1) return matchIdx;

  const tokens = normalizedColor.split(/[/\\&\-_+ ]/).filter(Boolean);
  const accentTokens = tokens.length > 1 ? tokens.filter(t => t !== "black" && t !== "grey") : tokens;
  const primaryToken = accentTokens[0] || tokens[0];

  const abbreviations: Record<string, string[]> = {
    yellow: ["ylw", "yel", "yellow"],
    black: ["blk", "_5_", "_30", "_38", "black"],
    orange: ["org", "_10", "orange"],
    blue: ["blu", "_14", "_24", "_19", "blue"],
    red: ["_25", "_46", "_48", "_3__11zon", "red"],
    grey: ["gry", "gray", "_9", "_11", "grey"],
    brown: ["brn", "__1", "brown"],
    white: ["wht", "white"],
    green: ["grn", "green"],
    silver: ["slv", "silver"],
    purple: ["pur", "prp", "purple"],
  };

  const searchTerms = [
    primaryToken,
    ...(abbreviations[primaryToken] || []),
    ...tokens,
  ];

  matchIdx = images.findIndex(img => {
    const alt = (img.altText || "").toLowerCase();
    const url = (img.url || "").toLowerCase();
    
    return searchTerms.some(term => 
      alt.includes(term) || 
      url.includes(`-${term}`) || 
      url.includes(`_${term}`) || 
      url.includes(`/${term}`) || 
      url.includes(term)
    );
  });

  return matchIdx;
};

export const ProductGallery: React.FC<{ 
  images: ProductImage[];
  selectedColor?: string;
}> = ({ images, selectedColor }) => {
  // Always default to the very first image (base image) which matches Catalog
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainSrc, setMainSrc] = useState(images?.[0]?.url || FALLBACK_IMAGE);
  const [userHasClickedColor, setUserHasClickedColor] = useState(false);
  const prevColorRef = React.useRef(selectedColor);

  // Sync main image whenever images list changes (e.g. navigation)
  useEffect(() => {
    if (images && images.length > 0) {
      setActiveIndex(0);
      setMainSrc(images[0].url);
      setUserHasClickedColor(false);
    }
  }, [images]);

  // When selectedColor changes, switch to exact matching image
  useEffect(() => {
    if (selectedColor) {
      prevColorRef.current = selectedColor;
      setUserHasClickedColor(true); // Flag that color changed

      const matchIdx = findMatchingImageIndex(selectedColor, images);
      if (matchIdx !== -1) {
        setActiveIndex(matchIdx);
        setMainSrc(images[matchIdx].url);
      }
    }
  }, [selectedColor, images]);

  const handleSelect = useCallback(
    (idx: number) => {
      setActiveIndex(idx);
      setMainSrc(images[idx]?.url || FALLBACK_IMAGE);
    },
    [images]
  );

  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Main Large Image */}
      <div 
        className="relative aspect-square md:aspect-[10/11] w-full max-h-[500px] md:max-h-[580px] bg-white rounded-xl border border-neutral-200/80 cursor-none overflow-hidden"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Base Image */}
        <Image
          src={mainSrc}
          alt={images[activeIndex]?.altText || "Product image"}
          fill
          unoptimized
          className="object-contain p-2 md:p-6"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={() => setMainSrc(FALLBACK_IMAGE)}
        />

        {/* Flawless Clip-Path Circular Magnifying Glass */}
        {isZoomed && (
          <>
            {/* The Zoomed Image masked by a circle */}
            <div 
              className="absolute inset-0 z-10 pointer-events-none hidden lg:block"
              style={{
                clipPath: `circle(125px at ${position.x}% ${position.y}%)`
              }}
            >
              <div className="relative w-full h-full bg-white">
                <Image
                  src={mainSrc}
                  alt="Zoomed"
                  fill
                  unoptimized
                  className="object-contain p-2 md:p-6"
                  style={{
                    transformOrigin: `${position.x}% ${position.y}%`,
                    transform: 'scale(2.5)',
                  }}
                />
              </div>
            </div>

            {/* The Glass Frame/Ring (to give it a realistic glass look) */}
            <div 
              className="absolute z-20 pointer-events-none hidden lg:block rounded-full border-2 border-neutral-200 shadow-[inset_0_0_20px_rgba(0,0,0,0.05),0_8px_30px_rgba(0,0,0,0.15)]"
              style={{
                left: `calc(${position.x}% - 125px)`,
                top: `calc(${position.y}% - 125px)`,
                width: "250px",
                height: "250px",
              }}
            />
          </>
        )}
      </div>

      {/* Thumbnails Row with Arrows */}
      <div className="relative flex items-center group">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 bg-white shadow-md border border-neutral-200 rounded-full p-1.5 hover:bg-neutral-50 transition-all -ml-3 hidden md:flex opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-2 sm:gap-4 overflow-x-auto hide-scrollbar pb-2 px-1 w-full"
        >
          {images.map((img, idx) => (
            <Thumbnail
              key={idx}
              img={img}
              idx={idx}
              isActive={activeIndex === idx}
              onClick={() => handleSelect(idx)}
            />
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 bg-white shadow-md border border-neutral-200 rounded-full p-1.5 hover:bg-neutral-50 transition-all -mr-3 hidden md:flex opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
};
