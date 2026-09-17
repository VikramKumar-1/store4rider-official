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
        className="object-contain p-1"
        onError={() => setSrc(FALLBACK_IMAGE)}
      />
    </button>
  );
};

export const ProductGallery: React.FC<{ 
  images: ProductImage[];
  selectedColor?: string;
}> = ({ images, selectedColor }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainSrc, setMainSrc] = useState(images?.[0]?.url || FALLBACK_IMAGE);

  // Sync main image whenever images list changes
  useEffect(() => {
    if (images && images.length > 0) {
      setMainSrc(images[activeIndex]?.url || images[0].url);
    }
  }, [images, activeIndex]);

  // When selectedColor changes, automatically switch to the exact matching image
  useEffect(() => {
    if (!selectedColor || !images || images.length === 0) return;

    const normalizedColor = selectedColor.trim().toLowerCase();
    
    // Extract specific distinctive accent (e.g. "orange", "blue", "red", "grey", "brown")
    let accentWord = "";
    if (normalizedColor.includes("/") || normalizedColor.includes("-")) {
      const parts = normalizedColor.split(/[/\\-]/).map(p => p.trim().toLowerCase()).filter(Boolean);
      // Pick the non-black part if present
      accentWord = parts.find(p => p !== "black") || parts[0];
    } else {
      accentWord = normalizedColor;
    }

    // 1. High priority: Check image altText for the distinct accent word (e.g. "orange", "brown", "blue", "red")
    let matchIdx = images.findIndex(img => {
      const alt = (img.altText || "").toLowerCase();
      if (!alt) return false;
      if (accentWord && alt.includes(accentWord)) {
        return true;
      }
      return false;
    });

    // 2. Secondary priority: Check URL for distinctive keywords / filename patterns
    if (matchIdx === -1) {
      matchIdx = images.findIndex(img => {
        const url = (img.url || "").toLowerCase();
        if (accentWord === "orange" && (url.includes("_10") || url.includes("org") || url.includes("orange"))) return true;
        if (accentWord === "blue" && (url.includes("_14") || url.includes("_24") || url.includes("_19") || url.includes("blue"))) return true;
        if (accentWord === "red" && (url.includes("_25") || url.includes("_46") || url.includes("_3__11zon") || url.includes("red"))) return true;
        if (accentWord === "grey" && (url.includes("_9") || url.includes("_11") || url.includes("grey") || url.includes("gray"))) return true;
        if (accentWord === "brown" && (url.includes("__1") || url.includes("brown") || url.includes("brn"))) return true;
        if (accentWord === "black" && !url.includes("__1") && (url.includes("blk") || url.includes("black") || url.includes("_5_") || url.includes("_30") || url.includes("_38"))) return true;
        return false;
      });
    }

    // 3. Fallback: exact substring in altText
    if (matchIdx === -1) {
      matchIdx = images.findIndex(img => 
        (img.altText || "").toLowerCase().includes(normalizedColor)
      );
    }

    if (matchIdx !== -1) {
      setActiveIndex(matchIdx);
      setMainSrc(images[matchIdx].url);
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
        className="relative aspect-square w-full max-h-[500px] bg-white overflow-hidden rounded-md border border-neutral-200 cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Base Image (Always visible) */}
        <Image
          src={mainSrc}
          alt={images[activeIndex]?.altText || "Product image"}
          fill
          className="p-4 object-contain"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={() => setMainSrc(FALLBACK_IMAGE)}
        />

        {/* Circular Magnifying Glass - Visible only on desktop on hover */}
        {isZoomed && (
          <div 
            className="absolute z-20 pointer-events-none border-2 border-neutral-100 shadow-xl rounded-full hidden lg:block bg-white"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: "200px",
              height: "200px",
              transform: "translate(-50%, -50%)",
              backgroundImage: `url(${mainSrc})`,
              backgroundPosition: `${position.x}% ${position.y}%`,
              backgroundSize: "300%", // Zoom level inside the glass
              backgroundRepeat: "no-repeat",
            }}
          />
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
