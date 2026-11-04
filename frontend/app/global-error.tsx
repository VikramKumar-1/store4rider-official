"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Critical Root Layout Error]:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center">
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-6 border border-slate-200 bg-slate-100">
            <Image
              src="/errorpageui/3-internal-server-error.jpg"
              alt="Internal Server Error"
              fill
              priority
              sizes="500px"
              className="object-cover"
            />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 mb-3">
            500 • Critical Engine Error
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
            Engine Trouble — Please Restart
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            The application encountered a critical system fault. Click below to re-ignite the engine or return to the main garage.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <RotateCcw size={15} />
              <span>Restart Engine</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Home size={15} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
