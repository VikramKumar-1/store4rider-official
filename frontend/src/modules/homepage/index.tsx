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
      imageUrl: "/helmetcat.jpg",
      linkUrl: "/products?category=helmets"
    },
    gloves: {
      id: "cat-gloves",
      title: "GLOVES",
      imageUrl: "/glovescat.jpg",
      linkUrl: "/products?category=gloves"
    },
    jackets: {
      id: "cat-jackets",
      title: "JACKETS",
      imageUrl: "/jacketcat.jpg",
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

  // Filter backend products for touring and adventure riding gear
  const matchedTouring = (backendProducts || []).filter((p: any) => {
    const catStr = (p.magentoCategories || "").toLowerCase();
    const nameStr = (p.name || "").toLowerCase();
    return (
      catStr.includes("touring") || 
      nameStr.includes("touring") || 
      catStr.includes("adventure") || 
      nameStr.includes("adventure") ||
      catStr.includes("luggage") ||
      catStr.includes("bag") ||
      catStr.includes("boot") ||
      nameStr.includes("waterproof")
    );
  });

  // Ensure we always have 4 real products, pulling from the rest of backendProducts if needed
  const finalTouringList = matchedTouring.length >= 4 
    ? matchedTouring.slice(0, 4) 
    : [...matchedTouring, ...(backendProducts || []).filter((p: any) => !matchedTouring.some((m: any) => m._id === p._id))].slice(0, 4);

  const touringProducts: BrowseProductData[] = finalTouringList.map((p: any, idx: number) => {
    const displayPrice = (p.specialPrice && p.specialPrice < p.basePrice) ? p.specialPrice : p.basePrice;
    const catParts = (p.magentoCategories || "").split(",")[0].split("/");
    const catName = catParts.filter((c: string) => !c.toLowerCase().includes("root")).pop()?.trim() || "TOURING GEAR";
    return {
      id: p._id || p.id || `tour-${idx}`,
      category: catName.toUpperCase(),
      name: p.name,
      priceFormatted: `₹ ${displayPrice?.toLocaleString('en-IN') || '0'}`,
      imageUrl: (p.images && p.images.length > 0 && p.images[0].url) 
        ? p.images[0].url 
        : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
      rating: 4.85,
      productUrl: `/products/${p.slug || p._id}`
    };
  });

  const testimonialsData: TestimonialData[] = [
    {
      id: "test-1",
      authorName: "Rohit Deshmukh",
      bikeModel: "KTM Duke 390",
      location: "Pune",
      purchasedProduct: "MT Thunder 4 SV Helmet",
      date: "12 Aug 2024",
      rating: 5,
      verified: true,
      content: "Got the MT Thunder 4 SV delivered in 2 days to Pune! The fit is snug, wind noise at 110 kmph is very minimal, and the visor clarity is top notch. Genuine ECE 22.06 certified piece with proper batch serial. Store4Riders is 100% legit!",
    },
    {
      id: "test-2",
      authorName: "Arjun Venkat",
      bikeModel: "RE Himalayan 450",
      location: "Bangalore",
      purchasedProduct: "Rynox Storm Evo Jacket",
      date: "28 Jul 2024",
      rating: 5,
      verified: true,
      content: "The level 2 Knox armor on shoulders and back gives massive confidence on highway tours. Rode from Bangalore to Ooty in heavy rain; the thermal liner and rain cover performed flawlessly. Outstanding customer service!",
    },
    {
      id: "test-3",
      authorName: "Vikram Malhotra",
      bikeModel: "Kawasaki Ninja 400",
      location: "New Delhi",
      purchasedProduct: "Axor Apex Venom Helmet",
      date: "14 Jun 2024",
      rating: 5,
      verified: true,
      content: "The aerodynamic stability on track days is incredible. Double D-ring lock is solid, and the Pinlock 30 lens stopped fogging completely during early morning winter rides. Best price online compared to other retailers.",
    },
    {
      id: "test-4",
      authorName: "Pooja Sharma",
      bikeModel: "BMW G310 GS",
      location: "Chandigarh",
      purchasedProduct: "ViaTerra Claw Tail Bag 72L",
      date: "03 May 2024",
      rating: 5,
      verified: true,
      content: "Mounted the Claw 72L for my Spiti Valley ride. Zero saddle shake even on rocky river crossings. Heavy duty Cordura fabric and completely waterproof inner liners. Must-have for any adventure tourer!",
    },
    {
      id: "test-5",
      authorName: "Karthik Nair",
      bikeModel: "Yamaha R15 V4",
      location: "Kochi",
      purchasedProduct: "Furygan AFS-19 Riding Gloves",
      date: "19 Apr 2024",
      rating: 5,
      verified: true,
      content: "Pre-curved fingers with carbon knuckle protectors. Fantastic throttle feel and zero palm fatigue during spirited weekend cornering. Delivery was lightning fast with safe bubble packaging.",
    }
  ];

  // Background image using the provided heropic1.jpg from public folder
  const heroBgImage = "/heropic1.jpg";

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

          <HeroSection
            subtitle="BROWSE THE COLLECTION"
            title="RIDING GEAR THAT KEEPS YOU SAFE"
            bgImageUrl={heroBgImage}
            bgImageUrls={["/heropic1.jpg", "/heropic2.jpg"]}
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
