"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Slim top progress bar that shows during page navigation.
 * Similar to YouTube/GitHub loading indicator.
 * 
 * Works by intercepting <a> clicks and tracking pathname changes.
 * No external dependencies needed.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startProgress = useCallback(() => {
    cleanup();
    setVisible(true);
    setProgress(15);

    // Simulate gradual progress (slows down as it gets higher)
    let current = 15;
    intervalRef.current = setInterval(() => {
      current += Math.max(1, (90 - current) * 0.1);
      if (current >= 90) {
        current = 90; // Never reaches 100 until navigation completes
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(current);
    }, 200);
  }, [cleanup]);

  const completeProgress = useCallback(() => {
    cleanup();
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, [cleanup]);

  // When pathname changes → navigation completed
  useEffect(() => {
    completeProgress();
  }, [pathname, completeProgress]);

  // Intercept all internal link clicks to start the progress bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, same page
      if (
        href.startsWith("http") ||
        href.startsWith("mailto") ||
        href.startsWith("tel") ||
        href.startsWith("#") ||
        href === pathname
      ) {
        return;
      }

      // Internal navigation — start progress bar
      startProgress();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startProgress]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Progress bar */}
      <div
        className="h-[3px] bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "400ms",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
      {/* Glow dot at the end */}
      {progress > 0 && progress < 100 && (
        <div
          className="absolute top-0 right-0 w-24 h-[3px] bg-gradient-to-l from-orange-300 to-transparent animate-pulse"
          style={{ right: `${100 - progress}%` }}
        />
      )}
    </div>
  );
}
