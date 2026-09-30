"use client";

import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function TopMarquee() {
  const items = [
    "🔥 FLASH SALE: UP TO 40% OFF PREMIUM HELMETS",
    "🚚 FREE NATIONWIDE SHIPPING ON ORDERS OVER ₹5000",
    "✨ NEW ALPINESTARS & DAINESE DROPS JUST LANDED",
    "🛡️ 1 YEAR OFFICIAL WARRANTY ON ALL RIDING GEAR",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      // Start fade out
      setIsFading(true);
      
      // Wait for fade out to complete, then change text and fade back in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsFading(false);
      }, 500); // 500ms matches transition duration
    }, 4500); // Every 4.5 seconds

    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className="w-full bg-slate-950 text-white overflow-hidden py-2 border-b border-white/10 flex items-center justify-center select-none relative z-50 h-[36px]">
      <div 
        className={`flex items-center justify-center whitespace-nowrap transition-opacity duration-500 ease-in-out ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="text-[10px] sm:text-[11px] font-black tracking-widest sm:tracking-[0.2em] uppercase text-slate-300">
          {items[currentIndex].includes("FLASH SALE") ? (
            <span className="text-brand inline-flex items-center gap-1.5">
              <Sparkles size={12} className="animate-pulse" /> 
              {items[currentIndex]}
            </span>
          ) : (
            items[currentIndex]
          )}
        </span>
      </div>
    </div>
  );
}
