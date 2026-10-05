"use client";
import React from "react";
import { AccountSidebar } from "@/modules/account/components/AccountSidebar";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { usePathname } from "next/navigation";

export const AccountLayoutModule = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() || "";
  const paths = pathname.split("/").filter(Boolean);
  
  const breadcrumbItems: { label: string; href?: string }[] = [{ label: "HOME", href: "/" }];
  
  if (paths[0] === "account") {
    breadcrumbItems.push({ 
      label: "MY ACCOUNT", 
      href: paths.length > 1 ? "/account" : undefined 
    });
    if (paths[1]) {
      breadcrumbItems.push({ label: paths[1].replace("-", " ").toUpperCase() });
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-neutral-100 antialiased selection:bg-brand selection:text-white">
      {/* 1. Top Announcement Bar */}
      <header>
        <TopBanner
          message="Discount 20% For New Member,"
          highlightText="ONLY FOR TODAY!!"
        />
      </header>

      {/* 2. Standard Header Navigation (Light Theme) */}
      <div className="w-full bg-white relative z-40 border-b border-zinc-200 shadow-sm">
        <Navbar theme="light" logoText="Store4Riders" />
      </div>

      <Breadcrumb items={breadcrumbItems} />

      <main className="flex-1 w-full relative z-0">
        <div className="container mx-auto px-4 py-8 sm:py-12 flex flex-col lg:flex-row gap-6 sm:gap-8 max-w-7xl">
          <AccountSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
};
