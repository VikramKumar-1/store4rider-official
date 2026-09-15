"use client";

import React from "react";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CatalogProps } from "./types/catalog.types";
import { CatalogSidebar } from "./components/CatalogSidebar";
import { CatalogGrid } from "./components/CatalogGrid";

/**
 * CatalogModule
 * 
 * Semantic, SEO-friendly layout for the Product Listing Page.
 */
export const CatalogModule: React.FC<CatalogProps> = ({ products }) => {
  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-white relative">
      
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white border-b border-neutral-200 relative z-40">
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

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "HOME", href: "/" },
        { label: "CATALOG" }
      ]} />

      {/* 2. Page Content Header (SEO: using h1) */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-10 pb-6">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl uppercase tracking-wide text-neutral-800">
          ALL PRODUCTS
        </h1>
      </div>

      {/* 3. Main Catalog Area (SEO: main tag with aside for sidebar) */}
      <main className="max-w-[1400px] w-full mx-auto px-4 md:px-6 pb-20 md:pb-32">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <CatalogSidebar />
          </aside>

          {/* Right Product Grid */}
          <section className="flex-1 w-full">
            <CatalogGrid products={products} />
          </section>

        </div>
      </main>

      {/* 4. Global Footer */}
      <Footer />
    </div>
  );
};
