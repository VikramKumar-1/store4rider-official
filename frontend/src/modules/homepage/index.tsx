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
      imageUrl: "/no-image.svg",
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
        // Resolve price with fallbacks: basePrice → variant prices → specialPrice
        let effectivePrice = p.basePrice || 0;
        if (effectivePrice === 0 && Array.isArray(p.variants) && p.variants.length > 0) {
          const vp = p.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
          if (vp.length > 0) effectivePrice = Math.min(...vp);
        }
        if (effectivePrice === 0 && p.specialPrice && p.specialPrice > 0) effectivePrice = p.specialPrice;
        const displayPrice = (p.specialPrice && p.specialPrice > 0 && effectivePrice > 0 && p.specialPrice < effectivePrice)
          ? p.specialPrice : effectivePrice;
        // Extract category from magentoCategories path
        const catParts = (p.magentoCategories || "").split(",")[0].split("/");
        const catName = catParts.filter((c: string) => !c.toLowerCase().includes("root")).pop()?.trim() || "GEAR";
        return {
          id: p._id || p.id || `grid-${idx}`,
          category: catName.toUpperCase(),
          name: p.name,
          priceFormatted: `₹ ${displayPrice?.toLocaleString('en-IN') || '0'}`,
          imageUrl: (p.images && p.images.length > 0) ? p.images[0].url : "/no-image.svg",
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
      imageUrl: "/no-image.svg",
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
    },
    {
      id: "grid-5",
      category: "JACKETS",
      name: "All-Weather Riding Jacket",
      priceFormatted: "₹ 7,499",
      imageUrl: "/no-image.svg",
      rating: 4.80,
      productUrl: "/products/5"
    },
    {
      id: "grid-6",
      category: "GLOVES",
      name: "Full Gauntlet Gloves",
      priceFormatted: "₹ 3,299",
      imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80",
      rating: 4.85,
      productUrl: "/products/6"
    },
    {
      id: "grid-7",
      category: "HELMETS",
      name: "Carbon Fiber Helmet",
      priceFormatted: "₹ 12,500",
      imageUrl: "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=600&q=80",
      rating: 4.95,
      productUrl: "/products/7"
    },
    {
      id: "grid-8",
      category: "PANTS",
      name: "Armored Riding Pants",
      priceFormatted: "₹ 5,999",
      imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
      rating: 4.90,
      productUrl: "/products/8"
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

  const touringProducts: BrowseProductData[] = finalTouringList.length > 0 
    ? finalTouringList.map((p: any, idx: number) => {
        let effectivePrice = p.basePrice || 0;
        if (effectivePrice === 0 && Array.isArray(p.variants) && p.variants.length > 0) {
          const vp = p.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
          if (vp.length > 0) effectivePrice = Math.min(...vp);
        }
        if (effectivePrice === 0 && p.specialPrice && p.specialPrice > 0) effectivePrice = p.specialPrice;
        const displayPrice = (p.specialPrice && p.specialPrice > 0 && effectivePrice > 0 && p.specialPrice < effectivePrice)
          ? p.specialPrice : effectivePrice;
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
      })
    : [
        {
          id: "tour-1",
          category: "LUGGAGE",
          name: "Touring Tail Bag 50L",
          priceFormatted: "₹ 4,500",
          imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
          rating: 4.90,
          productUrl: "/products/t1"
        },
        {
          id: "tour-2",
          category: "HELMETS",
          name: "Adventure Dual Sport Helmet",
          priceFormatted: "₹ 6,800",
          imageUrl: "https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=600&q=80",
          rating: 4.85,
          productUrl: "/products/t2"
        },
        {
          id: "tour-3",
          category: "BOOTS",
          name: "Waterproof Touring Boots",
          priceFormatted: "₹ 9,999",
          imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
          rating: 4.95,
          productUrl: "/products/t3"
        },
        {
          id: "tour-4",
          category: "JACKETS",
          name: "Mesh Touring Jacket",
          priceFormatted: "₹ 8,200",
          imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80",
          rating: 4.80,
          productUrl: "/products/t4"
        }
      ];

  const [testimonialsData, setTestimonialsData] = React.useState<TestimonialData[]>([]);

  React.useEffect(() => {
    // Fetch real Google Reviews from SerpApi route
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews/store");
        const json = await res.json();
        if (json.success && json.data) {
          let mappedReviews: TestimonialData[] = json.data.map((r: any) => ({
            id: r.id,
            authorName: r.author,
            date: r.date,
            rating: r.rating || 5,
            content: r.text,
            verified: true,
            link: r.link,
          }));

          // Force exactly 10 reviews to show in the UI slider
          if (mappedReviews.length > 0) {
            while (mappedReviews.length < 10) {
              mappedReviews = [...mappedReviews, ...mappedReviews].map((r, index) => ({ ...r, id: `${r.id}-${index}` }));
            }
            mappedReviews = mappedReviews.slice(0, 10);
          }

          setTestimonialsData(mappedReviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      }
    };
    fetchReviews();
  }, []);

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
            
            theme="dark"
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
        <BrowseProductsSection title="BEST GEAR FOR TOURING" products={touringProducts} showSeeMore={true} mobileLayout="grid" />

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
