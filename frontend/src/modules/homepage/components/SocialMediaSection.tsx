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
  const sliderRef = useRef<HTMLDivElement>(null);

  // Placeholder images for the reels slider
  const reelImages = [
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&h=700&q=80",
    "https://images.unsplash.com/photo-1518972553187-573b983a54dc?auto=format&fit=crop&w=400&h=700&q=80",
    "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=400&h=700&q=80",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=700&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&h=700&q=80",
  ];

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const scrollAmount = clientWidth * 0.7; // Scroll by 70% of container width
      sliderRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-10 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:min-h-[650px]">
        
        {/* --- LEFT COLUMN: Insta Reels Slider --- */}
        <div className="bg-banner p-4 md:p-6 rounded-sm flex flex-col overflow-hidden h-auto lg:h-full relative group/slider">
          <div className="flex items-center gap-3 mb-6 text-white px-2">
            <VideoCameraIcon className="w-8 h-8 opacity-90" />
            <h2 className="font-serif text-3xl tracking-wide drop-shadow-sm">Insta Reels</h2>
          </div>

          {/* Slider Navigation Arrows (Premium glassy style) */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:bg-white/30 transition-all duration-300 shadow-xl"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          
          <button 
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hover:bg-white/30 transition-all duration-300 shadow-xl"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-6 h-6 text-white" />
          </button>

          {/* Horizontal scrollable slider for videos */}
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar px-2"
          >
            {reelImages.map((src, idx) => (
              <div 
                key={idx} 
                className="relative shrink-0 w-[180px] sm:w-[240px] lg:w-[260px] aspect-[9/16] bg-neutral-900 rounded-lg overflow-hidden snap-center group cursor-pointer shadow-2xl border border-white/10"
              >
                <Image
                  src={src}
                  alt={`Reel ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 180px, 260px"
                />
                
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                     <PlayIcon className="w-6 h-6 fill-white text-white ml-1" />
                   </div>
                </div>

                {/* View count */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium drop-shadow-md">
                  <PlayIcon className="w-4 h-4 fill-white" />
                  <span>{[24.5, 12.8, 56.2, 8.9, 102.4][idx % 5]}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="flex flex-col gap-4 md:gap-6 h-auto lg:h-full">
          
          {/* Top Block: Image 1 */}
          <div className="bg-banner flex-1 min-h-[250px] lg:min-h-[300px] relative rounded-sm overflow-hidden group cursor-pointer">
             <Image 
                src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80" 
                alt="Image 1" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700" 
             />
             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
             <div className="absolute top-6 left-6">
                <span className="text-white text-2xl font-serif tracking-wider drop-shadow-md">image 1</span>
             </div>
          </div>

          {/* Bottom Block: Feature Card */}
          <div className="bg-banner flex-1 min-h-[250px] lg:min-h-[300px] p-6 flex items-center justify-center rounded-sm">
            <div className="bg-white w-full max-w-lg p-8 md:p-10 flex flex-col sm:flex-row items-start gap-6 shadow-2xl rounded-sm">
               
               {/* Rocket Icon Container */}
               <div className="w-14 h-14 rounded-full bg-banner text-white flex items-center justify-center shrink-0 shadow-md">
                 <RocketLaunchIcon className="w-6 h-6 fill-white text-white" />
               </div>
               
               {/* Text Content */}
               <div className="flex flex-col gap-3">
                 <h3 className="font-serif text-2xl md:text-3xl text-neutral-800">
                   image 2
                 </h3>
                 <p className="text-[13px] md:text-sm text-neutral-500 leading-relaxed font-sans">
                   Lorem ipsum dolor sit amet consectetur. Suspendisse laoreet scelerisque morbi 
                   vulputate. Quisque bibendum eget id diam elementum fringilla duis.
                 </p>
               </div>

            </div>
          </div>

        </div>

      </div>
      
      {/* Custom styles to hide scrollbar for webkit and standard browsers */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
};

export default SocialMediaSection;
