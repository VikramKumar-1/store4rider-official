"use client";

import React from "react";
import TopBanner from "./components/TopBanner";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturedCategories from "./components/FeaturedCategories";
import BrowseProductsSection from "./components/BrowseProductsSection";
import SocialMediaSection from "./components/SocialMediaSection";
import TestimonialsSection from "./components/TestimonialsSection";
import Footer from "./components/Footer";
import { NavLinkItem, HeroProductCardData, CategoryCardData, BrowseProductData, TestimonialData } from "./types/homepage.types";

/**
 * HomepageModule Component
 * 
 * Entry point module for the homepage layout matching the exact Figma UI design structure.
 * Clean, module-based architecture containing purely UI components with zero frontend business logic.
 * Data is passed cleanly as structured props for maintainability and backend integration.
 */
export const HomepageModule: React.FC<{ backendProducts?: any[] }> = ({ backendProducts = [] }) => {
  // Navigation items matching Figma structure
  const navItems: NavLinkItem[] = [
    { id: "catalog", label: "Catalog", href: "/products", hasDropdown: true },
    { id: "sale", label: "Sale", href: "/sale" },
    { id: "new-arrival", label: "New Arrival", href: "/products?sort=newest" },
    { id: "about", label: "About", href: "/about" },
  ];

  // Featured product cards matching Figma floating card elements
  // (Using rider motorcycle gear images & high-resolution product imagery)
  const featuredProducts: HeroProductCardData[] = [
    {
      id: "prod-1",
      title: "Riding Armor Jacket",
      priceFormatted: "₹ 5,499",
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      ctaText: "SHOP NOW",
      ctaUrl: "/products/riding-armor-jacket",
    },
    {
      id: "prod-2",
      title: "Protective Rider Suit",
      priceFormatted: "₹ 12,999",
      imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80",
      ctaText: "SHOP NOW",
      ctaUrl: "/products/protective-rider-suit",
    },
  ];

  // Categories data for the new section
  const categoryData = {
    helmets: {
      id: "cat-helmets",
      title: "HELMETS",
      imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80", // Using a placeholder rider image for now
      linkUrl: "/products?category=helmets"
    },
    gloves: {
      id: "cat-gloves",
      title: "GLOVES",
      imageUrl: "https://images.unsplash.com/photo-1518972553187-573b983a54dc?auto=format&fit=crop&w=800&q=80",
      linkUrl: "/products?category=gloves"
    },
    jackets: {
      id: "cat-jackets",
      title: "JACKETS",
      imageUrl: "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=800&q=80",
      linkUrl: "/products?category=jackets"
    }
  };

  // Map real backend products to grid data, or fallback to dummy data if none exist yet
  const gridProducts: BrowseProductData[] = backendProducts && backendProducts.length > 0 
    ? backendProducts.slice(0, 8).map((p: any, idx: number) => {
        // Use specialPrice if available, otherwise basePrice
        const displayPrice = (p.specialPrice && p.specialPrice < p.basePrice)
          ? p.specialPrice : p.basePrice;
        // Extract category from magentoCategories path
        const catParts = (p.magentoCategories || "").split(",")[0].split("/");
        const catName = catParts.filter((c: string) => !c.toLowerCase().includes("root")).pop()?.trim() || "GEAR";
        return {
          id: p._id || p.id || `grid-${idx}`,
          category: catName.toUpperCase(),
          name: p.name,
          priceFormatted: `₹ ${displayPrice?.toLocaleString('en-IN') || '0'}`,
          imageUrl: (p.images && p.images.length > 0) ? p.images[0].url : "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
          rating: 4.8,
          productUrl: `/products/${p.slug || p._id}`
        };
      })
    : [
    {
      id: "grid-1",
      category: "JACKETS",
      name: "Premium Leather Jacket",
      priceFormatted: "₹ 8,999",
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      rating: 4.95,
      productUrl: "/products/1"
    },
    {
      id: "grid-2",
      category: "GLOVES",
      name: "Tactical Riding Gloves",
      priceFormatted: "₹ 2,499",
      imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80",
      rating: 4.80,
      productUrl: "/products/2"
    },
    {
      id: "grid-3",
      category: "HELMETS",
      name: "Matte Black Helmet",
      priceFormatted: "₹ 4,500",
      imageUrl: "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=600&q=80",
      rating: 4.90,
      productUrl: "/products/3"
    },
    {
      id: "grid-4",
      category: "BOOTS",
      name: "Touring Boots",
      priceFormatted: "₹ 6,299",
      imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
      rating: 4.95,
      productUrl: "/products/4"
    }
  ];

  const touringProducts: BrowseProductData[] = [
    {
      id: "tour-1",
      category: "LUGGAGE",
      name: "Waterproof Tail Bag",
      priceFormatted: "₹ 3,200",
      imageUrl: "https://images.unsplash.com/photo-1518972553187-573b983a54dc?auto=format&fit=crop&w=600&q=80",
      rating: 4.75,
      productUrl: "/products/tour1"
    },
    {
      id: "tour-2",
      category: "ACCESSORIES",
      name: "Phone Mount Pro",
      priceFormatted: "₹ 1,899",
      imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
      rating: 4.95,
      productUrl: "/products/tour2"
    },
    {
      id: "tour-3",
      category: "JACKETS",
      name: "Mesh Summer Jacket",
      priceFormatted: "₹ 5,800",
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      rating: 4.85,
      productUrl: "/products/tour3"
    },
    {
      id: "tour-4",
      category: "HELMETS",
      name: "Modular Touring Helmet",
      priceFormatted: "₹ 7,500",
      imageUrl: "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=600&q=80",
      rating: 4.95,
      productUrl: "/products/tour4"
    }
  ];

  const testimonialsData: TestimonialData[] = [
    {
      id: "test-1",
      authorName: "CYNTHIA CAROLINE",
      date: "15 July 2023",
      rating: 5,
      content: "Lorem ipsum dolor sit amet consectetur. Suspendisse laoreet scelerisque morbi vulputate. Quisque bibendum eget id diam elementum fringilla duis. Faucibus pharetra dictum quis feugiat eu augue semper et nulla. Lectus turpis ut et eros tortor placerat rhoncus.",
    },
    {
      id: "test-2",
      authorName: "CYNTHIA CAROLINE",
      date: "15 July 2023",
      rating: 5,
      content: "Lorem ipsum dolor sit amet consectetur. Suspendisse laoreet scelerisque morbi vulputate. Quisque bibendum eget id diam elementum fringilla duis. Faucibus pharetra dictum quis feugiat eu augue semper et nulla. Lectus turpis ut et eros tortor placerat rhoncus.",
    },
    {
      id: "test-3",
      authorName: "CYNTHIA CAROLINE",
      date: "15 July 2023",
      rating: 5,
      content: "Lorem ipsum dolor sit amet consectetur. Suspendisse laoreet scelerisque morbi vulputate. Quisque bibendum eget id diam elementum fringilla duis. Faucibus pharetra dictum quis feugiat eu augue semper et nulla. Lectus turpis ut et eros tortor placerat rhoncus.",
    },
    {
      id: "test-4",
      authorName: "CYNTHIA CAROLINE",
      date: "15 July 2023",
      rating: 5,
      content: "Lorem ipsum dolor sit amet consectetur. Suspendisse laoreet scelerisque morbi vulputate. Quisque bibendum eget id diam elementum fringilla duis. Faucibus pharetra dictum quis feugiat eu augue semper et nulla. Lectus turpis ut et eros tortor placerat rhoncus.",
    },
    {
      id: "test-5",
      authorName: "CYNTHIA CAROLINE",
      date: "15 July 2023",
      rating: 5,
      content: "Lorem ipsum dolor sit amet consectetur. Suspendisse laoreet scelerisque morbi vulputate. Quisque bibendum eget id diam elementum fringilla duis. Faucibus pharetra dictum quis feugiat eu augue semper et nulla. Lectus turpis ut et eros tortor placerat rhoncus.",
    }
  ];

  // Background image URL (High resolution rider background image)
  const heroBgImage = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1920&q=80";

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-neutral-100 antialiased selection:bg-amber-800 selection:text-white">
      {/* 1. Top Announcement Bar */}
      <header>
        <TopBanner
          message="Discount 20% For New Member,"
          highlightText="ONLY FOR TODAY!!"
        />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Hero Container with Header overlay */}
        <div className="relative w-full bg-neutral-200">
          {/* 2. Header Navigation */}
          <Navbar
            logoText="Store4Riders"
            navItems={navItems}
          />

          {/* 3. Main Hero Banner */}
          <HeroSection
            subtitle="BROWSE THE COLLECTION"
            title="RIDING GEAR THAT KEEPS YOU SAFE"
            bgImageUrl={heroBgImage}
            featuredProducts={featuredProducts}
          />
        </div>

        {/* 4. Featured Categories (Bento Box Grid) */}
        <FeaturedCategories categories={categoryData} />

        {/* 5. Browse Products Section (4-column grid) */}
        <BrowseProductsSection title="BROWSE RIDING GEAR CATEGORIES" products={gridProducts} />

        {/* 6. Touring Gear Section */}
        <BrowseProductsSection title="BEST GEAR FOR TOURING" products={touringProducts} />

        {/* 7. Social Media / Insta Reels Section */}
        <SocialMediaSection />

        {/* 8. Testimonials Section */}
        <TestimonialsSection testimonials={testimonialsData} />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default HomepageModule;
