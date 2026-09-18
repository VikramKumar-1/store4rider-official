"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { RocketLaunchIcon, PlayIcon, VideoCameraIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

/**
 * SocialMediaSection Component
 * 
 * Renders a compact 2-column layout:
 * - Left: Instagram Reels horizontal slider
 * - Right: Split into two stacked blocks (Image banner and a feature card)
 */
export const SocialMediaSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const reelImages = [
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1518972553187-573b983a54dc?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=600&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&h=600&q=80",
  ];

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -250, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 250, behavior: 'smooth' });
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-16 bg-neutral-100">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left: Instagram Reels Horizontal Slider (Col Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-neutral-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-sans text-xl md:text-2xl font-extrabold uppercase tracking-wide text-neutral-900 flex items-center gap-3">
              INSTA REELS
            </h2>
            <div className="flex gap-2">
              <button onClick={scrollLeft} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-brand hover:text-white transition-colors text-neutral-600">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={scrollRight} className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-brand hover:text-white transition-colors text-neutral-600">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 snap-x snap-mandatory hide-scrollbar pb-4 flex-1 items-stretch"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reelImages.map((src, idx) => (
              <div 
                key={idx} 
                className="relative min-w-[200px] md:min-w-[220px] aspect-[4/5] bg-neutral-900 rounded-lg group cursor-pointer overflow-hidden snap-start flex-shrink-0"
              >
                <Image
                  src={src}
                  alt={`Reel ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  sizes="(max-width: 768px) 50vw, 250px"
                />
                
                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                    <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow-md z-10">
                  <PlayIcon className="w-4 h-4" />
                  <span>{[1.2, 45, 12, 8.9, 102][idx % 5]}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Two Stacked Banners (Col Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Top Banner: Image Offer */}
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer shadow-sm border border-neutral-200">
            <Image
              src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80"
              alt="Promo Banner"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <span className="text-brand font-bold text-sm tracking-widest mb-1">NEW ARRIVAL</span>
              <h3 className="text-white font-sans font-bold text-xl uppercase tracking-wide leading-tight">TOURING<br/>ESSENTIALS</h3>
            </div>
          </div>

          {/* Bottom Banner: Feature Card */}
          <div className="bg-[#f25b22] rounded-lg p-6 flex flex-col justify-center items-start text-white shadow-sm flex-1 relative overflow-hidden group cursor-pointer border border-[#e04f1a]">
            {/* Background Icon */}
            <RocketLaunchIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                <RocketLaunchIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-1">Free Shipping</h3>
              <p className="text-white/90 text-sm max-w-[80%] leading-relaxed">
                On all orders across India above ₹1000. Upgrade your gear today.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default SocialMediaSection;
