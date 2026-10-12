import React from "react";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-neutral-50/60 selection:bg-brand selection:text-white">
      {/* 1. Header Global Area */}
      <header>
        <TopBanner
          message="Discount 20% For New Member,"
          highlightText="ONLY FOR TODAY!!"
        />
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
          <Navbar logoText="Store4Riders" theme="light" />
        </div>
      </header>

      {/* 2. Main Guides Content */}
      <div className="flex-1 w-full flex flex-col">
        {children}
      </div>

      {/* 3. Global Footer */}
      <div className="bg-banner pb-32 lg:pb-0 w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
}
