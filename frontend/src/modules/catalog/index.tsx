"use client";

import React from "react";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CatalogProps } from "./types/catalog.types";
import { SidebarFilters } from "./components/SidebarFilters";
import { CatalogGrid } from "./components/CatalogGrid";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * CatalogContent
 * Inner component to handle searchParams safely within Suspense
 */
const CatalogContent: React.FC<{ products: any[]; totalCount?: number; isLoading?: boolean; isFetching?: boolean }> = ({ 
  products, 
  totalCount,
  isLoading,
  isFetching
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const sortParam = searchParams.get("sort") || "";
  
  const pageTitle = categoryParam 
    ? categoryParam.replace(/-/g, " ").toUpperCase() 
    : "ALL PRODUCTS";

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "HOME", href: "/" },
    { label: "PRODUCTS", href: "/products" }
  ];
  
  if (categoryParam) {
    breadcrumbItems.push({ label: pageTitle });
  } else {
    breadcrumbItems[1] = { label: "PRODUCTS" };
  }

  const handleSortChange = (newSort: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (newSort) {
      current.set("sort", newSort);
    } else {
      current.delete("sort");
    }
    current.set("page", "1");
    router.push(`/products?${current.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 2. Sticky Category Content Header (SEO: using h1) — Stays fixed, never scrolls away */}
      <div className="sticky top-[61px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-sans text-xl md:text-2xl font-extrabold uppercase tracking-wide text-neutral-900">
              {pageTitle}
            </h1>
            {totalCount ? (
              <span className="text-xs font-bold text-neutral-400">
                ({totalCount.toLocaleString()} items)
              </span>
            ) : null}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="catalog-sort" className="text-xs font-bold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="catalog-sort"
              value={sortParam}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-xs font-semibold bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md py-1.5 px-2.5 focus:outline-none focus:border-neutral-400 cursor-pointer text-neutral-800 shadow-xs transition-colors"
            >
              <option value="">Featured</option>
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Catalog Area (Independent Dual Scrolling) */}
      <main className="max-w-[1400px] w-full mx-auto px-4 md:px-6 pt-6 pb-20 md:pb-32">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Left Sidebar Filters — Floating Ultra-Compact Sticky Card (Fixed top offset to eliminate header overlap) */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-[136px] self-start max-h-[calc(100vh-150px)] overflow-y-auto hide-scrollbar">
            <SidebarFilters />
          </aside>

          {/* Right Product Grid */}
          <section className="flex-1 w-full min-w-0">
            <CatalogGrid 
              products={products} 
              totalCount={totalCount} 
              isLoading={isLoading}
              isFetching={isFetching}
            />
          </section>

        </div>
      </main>
    </>
  );
};

/**
 * CatalogModule
 * 
 * Semantic, SEO-friendly layout for the Product Listing Page.
 */
export const CatalogModule: React.FC<CatalogProps> = ({ products, totalCount, isLoading, isFetching }) => {
  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-white relative">
      
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <Navbar
          logoText="Store4Riders"
          theme="light"
          navItems={[
            { id: "catalog", label: "Catalog", href: "/products", hasDropdown: true },
            { id: "sale", label: "Sale", href: "/sale" },
            { id: "new-arrival", label: "New Arrival", href: "/products?sort=newest" },
            { id: "about", label: "About", href: "/about" },
          ]}
        />
      </div>

      <CatalogContent 
        products={products} 
        totalCount={totalCount} 
        isLoading={isLoading}
        isFetching={isFetching}
      />



      {/* 4. Global Footer */}
      <Footer />
    </div>
  );
};
