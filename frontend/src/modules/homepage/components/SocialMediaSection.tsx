"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { RocketLaunchIcon, PlayIcon, Squares2X2Icon, FilmIcon, UserIcon } from "@heroicons/react/24/solid";

/**
 * SocialMediaSection Component
 * 
 * Matches the user's wireframe:
 * - A 3-column Instagram Reels grid (like a profile view).
 * - Below (or to the right on desktop): Two promo banners, displayed side-by-side on mobile.
 */
export const SocialMediaSection: React.FC = () => {
  // 6 Images for a 3x2 IG grid
  const reelImages = [
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1518972553187-573b983a54dc?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=400&h=600&q=80",
  ];

  const viewCounts = ["12.9K", "8,181", "45K", "6,480", "4,254", "10.2K"];

  return (
    <section className="w-full max-w-[1400px] mx-auto px-0 sm:px-4 md:px-6 py-8 md:py-16 bg-white">
      
      {/* Title (Hidden on mobile to match the pure IG frame look, or just kept clean) */}
      <div className="text-center mb-6 md:mb-12 px-4">
        <h2 className="font-sans text-[16px] min-[375px]:text-[18px] sm:text-2xl md:text-3xl lg:text-[40px] font-extrabold uppercase tracking-wide md:tracking-wider text-neutral-900 leading-tight whitespace-nowrap">
          INSTA REELS
        </h2>
        <div className="w-10 md:w-16 h-1 bg-banner mx-auto mt-2 md:mt-3 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        
        {/* Left: Instagram Profile / Reels Grid */}
        <div className="lg:col-span-2 border border-neutral-200 bg-white overflow-hidden sm:rounded-lg shadow-sm">
          
          {/* Fake IG Tabs */}
          <div className="flex justify-around items-center border-b border-neutral-200 bg-neutral-900 text-neutral-400">
            <div className="flex-1 py-3 flex justify-center cursor-pointer hover:text-white">
              <Squares2X2Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 py-3 flex justify-center border-b-2 border-white text-white cursor-pointer">
              <FilmIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 py-3 flex justify-center cursor-pointer hover:text-white">
              <UserIcon className="w-5 h-5" />
            </div>
          </div>
          
          {/* 3x2 Grid */}
          <div className="grid grid-cols-3 gap-[1px] bg-neutral-200">
            {reelImages.map((src, idx) => (
              <div 
                key={idx} 
                className="relative aspect-[9/16] bg-neutral-900 group cursor-pointer overflow-hidden"
              >
                <Image
                  src={src}
                  alt={`Reel ${idx + 1}`}
                  fill
                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  sizes="(max-width: 768px) 33vw, 250px"
                />
                
                {/* Views Count (Bottom Left) */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[10px] md:text-xs font-semibold drop-shadow-md z-10">
                  <PlayIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>{viewCounts[idx]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (Desktop) / Bottom (Mobile): Two Category Banners matching wireframe layout */}
        {/* On mobile, they are side-by-side (grid-cols-2). On desktop, they stack (lg:grid-cols-1) */}
        <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4 px-2 sm:px-0">
          
          {/* Wireframe "Image 1": Simple Image Banner */}
          <Link href="/products" className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-[300px] rounded-lg overflow-hidden group cursor-pointer border border-neutral-200 bg-neutral-800 flex items-center justify-center">
            <Image
              src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80"
              alt="Category Image 1"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Wireframe "Image 2": Simple Image Banner */}
          <Link href="/products" className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-[300px] rounded-lg overflow-hidden group cursor-pointer border border-neutral-200 bg-neutral-800 flex items-center justify-center">
            <Image
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80"
              alt="Category Image 2"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

        </div>

      </div>
    </section>
  );
};

export default SocialMediaSection;
