"use client";

import React from "react";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SubcategoryTiles } from "./components/SubcategoryTiles";
import { CategorySEOAccordion } from "./components/CategorySEOAccordion";
import { CategoryDescriptionBox } from "./components/CategoryDescriptionBox";
import { FloatingCatalogBar } from "./components/FloatingCatalogBar";
import { CatalogProps } from "./types/catalog.types";
import { SidebarFilters } from "./components/SidebarFilters";
import { CatalogGrid } from "./components/CatalogGrid";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * CatalogContent
 * Inner component to handle searchParams safely within Suspense
 */
const CatalogContent: React.FC<{ products: any[]; totalCount?: number; isLoading?: boolean; isFetching?: boolean; categoryNode?: any }> = ({ 
  products, 
  totalCount,
  isLoading,
  isFetching,
  categoryNode
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
      {/* 1. Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 2. Main Catalog Area (Structured exactly as user wireframe) */}
      <main className="max-w-[1400px] w-full mx-auto px-3 sm:px-6 pt-3 pb-16 md:pb-20">
        
        {/* Category Heading (SEO H1) */}
        <div className="mb-2">
          <h1 className="font-sans text-lg min-[375px]:text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-neutral-900 leading-tight">
            {pageTitle}
          </h1>
        </div>

        {/* 3. Subcategory Tiles (3 in nos.) */}
        <SubcategoryTiles categoryName={pageTitle} categorySlug={categoryParam || ""} />

        {/* 4. SEO-Optimized Accordions (100% Googlebot Crawl-Proof + FAQPage Schema) */}
        <CategorySEOAccordion categoryName={pageTitle} />

        {/* 5. Category Short Description Box with [ + MORE VIEW ] (SSR Rendered) */}
        <CategoryDescriptionBox categoryName={pageTitle} description={categoryNode?.description} />

        {/* 6. Product Grid + Desktop Sidebar Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mt-4">
          
          {/* Left Sidebar Filters — Desktop only (On mobile, accessed via bottom floating bar) */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 lg:sticky lg:top-[90px] self-start max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar">
            <SidebarFilters />
          </aside>

          {/* Right Product Grid (2 columns on mobile with dark gradient name & price overlay) */}
          <section className="flex-1 w-full min-w-0">
            {/* Sort & Count Header on Desktop */}
            <div className="hidden sm:flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Products Overview
              </span>

              <div className="flex items-center gap-2">
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
                  <option value="bestselling">Bestselling</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            <CatalogGrid 
              products={products} 
              totalCount={totalCount} 
              isLoading={isLoading}
              isFetching={isFetching}
            />
          </section>

        </div>

        {/* 7. Floating Reviews & Category Filter Bar (Mobile only) */}
        <FloatingCatalogBar totalCount={totalCount} />
      </main>
    </>
  );
};

/**
 * CatalogModule
 * 
 * Semantic, SEO-friendly layout for the Product Listing Page.
 */
export const CatalogModule: React.FC<CatalogProps> = ({ products, totalCount, isLoading, isFetching, categoryNode }) => {
  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-white relative">
      
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
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
        categoryNode={categoryNode}
      />



      {/* 4. Global Footer */}
      <Footer />
    </div>
  );
};
