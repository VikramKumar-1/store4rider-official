"use client";
import React, { useEffect, useState } from "react";
import { AccountSidebar } from "@/modules/account/components/AccountSidebar";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export const AccountLayoutModule = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/account")}`);
    }
  }, [mounted, isAuthenticated, pathname, router]);

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

  if (!mounted || !isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex flex-col font-sans bg-neutral-100 antialiased selection:bg-brand selection:text-white">
        <header>
          <TopBanner
            message="Discount 20% For New Member,"
            highlightText="ONLY FOR TODAY!!"
          />
        </header>

        <div className="w-full bg-white relative z-40 border-b border-zinc-200 shadow-sm">
          <Navbar theme="light" logoText="Store4Riders" />
        </div>

        <main className="flex-1 w-full flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Please sign in to access your account...</p>
        </main>
      </div>
    );
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
