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
        isActive ? "border-brand" : "border-neutral-200 opacity-70 hover:opacity-100"
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

  if (!images || images.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Large Image */}
      <div className="relative aspect-square w-full max-h-[500px] bg-neutral-100 overflow-hidden rounded-md border border-neutral-200">
        <Image
          src={mainSrc}
          alt={images[activeIndex]?.altText || "Product image"}
          fill
          className="object-contain p-4"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={() => setMainSrc(FALLBACK_IMAGE)}
        />
      </div>

      {/* Thumbnails Row */}
      <div className="flex gap-2 sm:gap-4 overflow-x-auto hide-scrollbar pb-2">
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
    </div>
  );
};
