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
import { StoreReviews } from "@/modules/product-detail/components/StoreReviews";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
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
  
  const { data: publicSettings } = usePublicSettings();
  const dynamicRating = publicSettings?.googleRating ?? 4.8;
  const dynamicReviewCount = publicSettings?.googleReviewCount ?? "800+";
  
  let categoryParam = searchParams.get("category") || "";
  if (!categoryParam && params?.categorySlug) {
    const slugArr = params.categorySlug as string[];
    categoryParam = slugArr[slugArr.length - 1];
  }
  const sortParam = searchParams.get("sort") || "";
  let brandParam = searchParams.get("brand") || "";
  if (!brandParam && params?.brandSlug) {
    const slugArr = Array.isArray(params.brandSlug) ? params.brandSlug : [params.brandSlug];
    brandParam = slugArr[slugArr.length - 1];
  }
  
  const searchQuery = (searchParams.get("search") || searchParams.get("q") || "").trim();

  // Strictly filter hero cards: ONLY display if admin explicitly assigned heroCategoryIds
  const assignedHeroCards = React.useMemo(() => {
    if (!Array.isArray(categoryNode?.heroCategoryIds) || categoryNode.heroCategoryIds.length === 0) {
      return [];
    }
    const rawCards = Array.isArray(categoryNode?.heroCategories) ? categoryNode.heroCategories : [];
    const allowedIdSet = new Set(
      categoryNode.heroCategoryIds.map((id: any) => String(id).toLowerCase().trim())
    );
    return rawCards.filter((card: any) => {
      const id = String(card._id || card.id || "").toLowerCase().trim();
      const slug = String(card.slug || "").toLowerCase().trim();
      return (id && allowedIdSet.has(id)) || (slug && allowedIdSet.has(slug));
    });
  }, [categoryNode]);

  let pageTitle = searchQuery
    ? `RESULTS FOR "${searchQuery.toUpperCase()}"`
    : (categoryParam ? categoryParam.replace(/-/g, " ").toUpperCase() 
    
        : (brandParam ? (categoryNode?.name || brandParam.replace(/-/g, " ")).toUpperCase() : "ALL PRODUCTS")); 



  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "HOME", href: "/" }
  ];

  if (searchQuery) {
    breadcrumbItems.push({ label: "SEARCH" });
    breadcrumbItems.push({ label: `"${searchQuery.toUpperCase()}"` });
  } else if (params?.categorySlug && Array.isArray(params.categorySlug)) {
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
  } else if (brandParam && categoryParam) {
    breadcrumbItems.push({ label: "BRANDS", href: "/brands" });
    breadcrumbItems.push({ label: brandParam.replace(/-/g, " ").toUpperCase(), href: `/brands/${brandParam}` });
    breadcrumbItems.push({ label: categoryParam.replace(/-/g, " ").toUpperCase() });
  } else if (categoryParam) {
    breadcrumbItems.push({ label: "PRODUCTS", href: "/products" });
    breadcrumbItems.push({ label: categoryParam.replace(/-/g, " ").toUpperCase() });
  } else if (brandParam) {
    breadcrumbItems.push({ label: "BRANDS", href: "/brands" });
    breadcrumbItems.push({ label: (categoryNode?.name || brandParam.replace(/-/g, " ")).toUpperCase() });
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
          {searchQuery && (
            <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
              Found <strong className="text-neutral-900 font-bold">{totalCount || products.length}</strong> {totalCount === 1 ? "product" : "products"} for &ldquo;<span className="text-neutral-900 font-semibold">{searchQuery}</span>&rdquo;
            </p>
          )}
        </div>

        
        {/* 3. Subcategory Tiles / Hero Showcase Cards (Mobile Only as per design, strictly admin-assigned only) */}
        {assignedHeroCards.length > 0 && (
          <div className="block lg:hidden">
            <SubcategoryTiles 
              categoryName={pageTitle} 
              categorySlug={categoryParam || ""} 
              subcategories={assignedHeroCards} 
            />
          </div>
        )}

        {/* --- CLIENT LAYOUT REQUIREMENT: TWO ACCORDIONS AT TOP --- */}
        {categoryNode?.topAccordions && categoryNode.topAccordions.length > 0 && (
          <div className="w-full flex flex-col gap-2 mb-6 mt-4">
            <CategorySEOAccordion 
              categoryName="Category Top Info" 
              items={categoryNode.topAccordions.map((a: any, i: number) => ({ id: 'acc-'+i, title: a.title, content: a.content }))}
            />
        </div>
        )}

        {/* Category Description & Google Reviews Accordions */}
        <div className={`w-full flex flex-col gap-2 ${categoryNode?.description ? "mb-6 mt-4" : "hidden md:flex mb-6 mt-4"}`}>
          <CategorySEOAccordion 
            categoryName="Category Info & Reviews" 
            items={[
              ...(categoryNode?.description ? [{
                id: 'cat-desc',
                title: categoryParam ? 'Category Description' : (brandParam ? 'Brand Description' : 'Description'),
                content: <CategoryDescriptionBlock description={categoryNode.description} pageTitle={pageTitle} />
              }] : []),
              {
                id: 'google-reviews',
                title: (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-[24px] h-[24px] rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-neutral-900">
                      STORE REVIEWS
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white border border-neutral-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-neutral-800 shadow-2xs ml-0.5">
                      <span className="text-amber-500">★ {dynamicRating}</span>
                    </span>
                  </div>
                ),
                content: <StoreReviews hideHeader={true} />,
                className: 'hidden md:block'
              }
            ]}
          />
        </div>

        {/* 6. Product Grid + Desktop Sidebar Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mt-4">
          
          {/* Left Sidebar Filters — Desktop only (On mobile, accessed via bottom floating bar) */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 lg:sticky lg:top-[90px] self-start max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar">
            <SidebarFilters isFetching={isFetching} />
          </aside>

          {/* Right Product Grid (2 columns on mobile with dark gradient name & price overlay) */}
          <section className="flex-1 w-full min-w-0">
            {/* Sort & Count Header (Responsive: Visible on both Mobile & Desktop) */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider truncate">
                  {totalCount !== undefined ? `${totalCount.toLocaleString()} ${totalCount === 1 ? "Product" : "Products"}` : "Products Overview"}
                </span>
                {isFetching && (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium shrink-0">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-neutral-300 border-t-[#FF5429] rounded-full animate-spin" />
                    <span className="hidden min-[420px]:inline text-[10px] sm:text-[11px] font-semibold text-neutral-500 tracking-normal">Filtering...</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <label htmlFor="catalog-sort" className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="catalog-sort"
                  value={sortParam}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-[11px] sm:text-xs font-semibold bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md py-1.5 px-2 sm:px-2.5 focus:outline-none focus:border-neutral-400 cursor-pointer text-neutral-800 shadow-xs transition-colors"
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
        {categoryNode?.faqs && categoryNode.faqs.length > 0 && (
          <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col items-center">
            <div className="w-full max-w-4xl">
              <h2 className="font-bold text-lg min-[375px]:text-xl sm:text-2xl uppercase tracking-wide text-neutral-900 leading-tight mb-6 text-center">
                Frequently Asked Questions
              </h2>
              <CategorySEOAccordion 
                categoryName={pageTitle} 
                enableFaqSchema={true}
                items={categoryNode.faqs.map((f: any, i: number) => ({ id: 'faq-'+i, title: f.question, content: f.answer }))}
              />
        </div>
        </div>
        )}


        {/* 7. Floating Reviews & Category Filter Bar (Mobile only) */}
        <FloatingCatalogBar 
          totalCount={totalCount} 
          isFetching={isFetching} 
          averageRating={dynamicRating}
          reviewCount={dynamicReviewCount}
        />
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
    <div className="w-full flex flex-col font-sans bg-white relative min-h-screen">
      
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

      <div className="w-full flex-1 flex flex-col">
        <CatalogContent 
          products={products} 
          totalCount={totalCount} 
          isLoading={isLoading}
          isFetching={isFetching}
          categoryNode={categoryNode}
        />
      </div>

      {/* 4. Global Footer */}
      <div className="bg-neutral-950 pb-32 lg:pb-0 w-full mt-auto"><Footer /></div>
    </div>
  );
};
