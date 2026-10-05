"use client";

import React from "react";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SubcategoryTiles } from "./components/SubcategoryTiles";
import { CategorySEOAccordion } from "./components/CategorySEOAccordion";
import { CategoryDescriptionBlock } from "./components/CategoryDescriptionBlock";
import { FloatingCatalogBar } from "./components/FloatingCatalogBar";
import { CatalogProps } from "./types/catalog.types";
import { SidebarFilters } from "./components/SidebarFilters";
import { CatalogGrid } from "./components/CatalogGrid";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";

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
  const params = useParams();
  
  let categoryParam = searchParams.get("category") || "";
  if (!categoryParam && params?.categorySlug) {
    const slugArr = params.categorySlug as string[];
    categoryParam = slugArr[slugArr.length - 1];
  }
  const sortParam = searchParams.get("sort") || "";
  
  const pageTitle = categoryParam 
    ? categoryParam.replace(/-/g, " ").toUpperCase() 
    : "ALL PRODUCTS";

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "HOME", href: "/" }
  ];

  if (params?.categorySlug && Array.isArray(params.categorySlug)) {
    const slugArr = params.categorySlug as string[];
    let currentPath = "";
    slugArr.forEach((slug, idx) => {
      currentPath += `/${slug}`;
      const label = slug.replace(/-/g, " ").toUpperCase();
      if (idx === slugArr.length - 1) {
        breadcrumbItems.push({ label });
      } else {
        breadcrumbItems.push({ label, href: currentPath });
      }
    });
  } else if (categoryParam) {
    breadcrumbItems.push({ label: "PRODUCTS", href: "/products" });
    breadcrumbItems.push({ label: pageTitle });
  } else {
    breadcrumbItems.push({ label: "PRODUCTS" });
  }
  









  const handleSortChange = (newSort: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (newSort) {
      current.set("sort", newSort);
    } else {
      current.delete("sort");
    }
    current.set("page", "1");
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    router.push(`${pathname}?${current.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* 1. Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 2. Main Catalog Area (Structured exactly as user wireframe) */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 pt-3 pb-16 md:pb-20">
        
        {/* Category Heading (SEO H1) */}
        <div className="mb-2">
          <h1 className="font-sans text-lg min-[375px]:text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-neutral-900 leading-tight">
            {pageTitle}
          </h1>
        </div>

        
        {/* --- CLIENT LAYOUT REQUIREMENT: HERO IMAGE --- */}
        {categoryNode?.bannerImage && (
          <div className="w-full h-48 md:h-64 lg:h-80 relative rounded-lg overflow-hidden mb-4 shadow-sm">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={categoryNode.bannerImage} alt={pageTitle} className="w-full h-full object-cover" />
          </div>
        )}

        {/* 3. Subcategory Tiles */}
        <SubcategoryTiles categoryName={pageTitle} categorySlug={categoryParam || ""} />

        {/* --- CLIENT LAYOUT REQUIREMENT: TWO ACCORDIONS AT TOP --- */}
        <div className="w-full flex flex-col gap-2 mb-6 mt-4">
          {/* Accordion 2: Google Reviews */}
          <details className="group border border-neutral-200/90 rounded-lg overflow-hidden bg-white shadow-xs">
            <summary className="w-full py-2.5 px-3 sm:py-3 sm:px-4 flex items-center justify-between text-left gap-3 bg-neutral-50/70 hover:bg-neutral-100/70 transition-colors cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[11px] sm:text-[13px] font-bold text-neutral-900 tracking-tight">
                Google Reviews
              </span>
              <span className="transition group-open:rotate-180 text-neutral-700">▼</span>
            </summary>
            <div className="p-3 sm:p-4 text-[10px] sm:text-xs text-neutral-600 leading-relaxed font-sans border-t border-neutral-100">
              <div className="flex items-center gap-1 text-yellow-400 mb-2">
                ★★★★★ <span className="text-neutral-500 ml-2">(4.9/5 based on Google Reviews)</span>
              </div>
              <p>⭐⭐⭐⭐⭐ "Amazing products and fast delivery!" - Rahul M.</p>
              <p className="mt-1">⭐⭐⭐⭐⭐ "Best collection of riding gear." - Sneha P.</p>
            </div>
          </details>
        </div>

        <CategoryDescriptionBlock description={categoryNode?.description} pageTitle={pageTitle} />

        {/* 6. Product Grid + Desktop Sidebar Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mt-4">
          
          {/* Left Sidebar Filters — Desktop only (On mobile, accessed via bottom floating bar) */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 lg:sticky lg:top-[90px] self-start max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar">
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

        
        {/* --- CLIENT LAYOUT REQUIREMENT: FAQ AT BOTTOM WITH SCHEMA --- */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <h2 className="font-bold text-lg min-[375px]:text-xl sm:text-2xl uppercase tracking-wide text-neutral-900 leading-tight mb-4">
            Frequently Asked Questions
          </h2>
          {/* If the category node has FAQs from the DB, we pass them. Otherwise it uses default dummies for now */}
          <CategorySEOAccordion 
            categoryName={pageTitle} 
            items={categoryNode?.faqs?.length > 0 ? categoryNode.faqs.map((f: any, i: number) => ({ id: 'faq-'+i, title: f.question, content: f.answer })) : undefined}
          />
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
    <div className="w-full min-h-screen flex flex-col font-sans bg-white relative pb-36 lg:pb-0">
      
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
        <Navbar
          logoText="Store4Riders"
          theme="light"
          
        />
      </div>

      <div className="flex-1 flex flex-col w-full">
        <CatalogContent 
          products={products} 
          totalCount={totalCount} 
          isLoading={isLoading}
          isFetching={isFetching}
          categoryNode={categoryNode}
        />
      </div>

      {/* 4. Global Footer */}
      <Footer />
    </div>
  );
};
