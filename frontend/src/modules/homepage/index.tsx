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
import { IHomepageConfig } from "@store4riders/shared-types";
import { useStoreReviews } from "@/core/hooks/useStoreReviews";
import { useUIStore } from "@/stores/useUIStore";
import { usePublicHomepageConfig } from "@/core/hooks/useHomepage";
import { useProducts } from "@/core/hooks/useProducts";

/**
 * HomepageModule Component
 * 
 * Entry point module for the homepage layout matching the exact Figma UI design structure.
 * Clean, module-based architecture containing purely UI components with zero frontend business logic.
 * Data is passed cleanly as structured props for maintainability and backend integration.
 */
export const HomepageModule: React.FC<{
  backendProducts?: any[];
  homepageConfig?: IHomepageConfig;
  storeReviews?: any[];
}> = ({
  backendProducts = [],
  homepageConfig: initialHomepageConfig,
  storeReviews = [],
}) => {
  const { data: liveConfig } = usePublicHomepageConfig();
  const homepageConfig = liveConfig || initialHomepageConfig;

  // Real client-side products query if SSR products list was empty (e.g. during Vercel cold-start)
  const { data: clientProductsData } = useProducts({ limit: 40 });
  const backendProductsList = (backendProducts && backendProducts.length > 0)
    ? backendProducts
    : (clientProductsData?.items || []);

  // Navigation items matching Figma structure
  const navItems: NavLinkItem[] = [
    { id: "catalog", label: "Catalog", href: "/products", hasDropdown: true },
    { id: "sale", label: "Sale", href: "/sale" },
    { id: "new-arrival", label: "New Arrival", href: "/products?sort=newest" },
    { id: "about", label: "About", href: "/about" },
  ];

  // Featured product cards matching Figma floating card elements
  const featuredProducts: HeroProductCardData[] = (homepageConfig?.hero?.featuredCards && homepageConfig.hero.featuredCards.length > 0)
    ? homepageConfig.hero.featuredCards
    : backendProductsList.slice(0, 2).map((p: any, idx: number) => {
        let effectivePrice = p.basePrice || 0;
        if (effectivePrice === 0 && Array.isArray(p.variants) && p.variants.length > 0) {
          const vp = p.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
          if (vp.length > 0) effectivePrice = Math.min(...vp);
        }
        if (effectivePrice === 0 && p.specialPrice && p.specialPrice > 0) effectivePrice = p.specialPrice;
        const displayPrice = (p.specialPrice && p.specialPrice > 0 && effectivePrice > 0 && p.specialPrice < effectivePrice)
          ? p.specialPrice : effectivePrice;

        return {
          id: p._id || `feat-${idx}`,
          title: p.name,
          priceFormatted: `₹ ${Math.round(displayPrice)?.toLocaleString('en-IN') || '0'}`,
          imageUrl: (p.images && p.images.length > 0 && p.images[0].url) ? p.images[0].url : "/no-image.svg",
          ctaText: "SHOP NOW",
          ctaUrl: `/${p.slug || p._id}`,
        };
      });

  // Categories data for the new section
  const categoryData = {
    helmets: {
      id: "cat-helmets",
      title: homepageConfig?.sections?.featuredCategories?.helmets?.title || "HELMETS",
      imageUrl: homepageConfig?.sections?.featuredCategories?.helmets?.imageUrl || "/helmetcat.jpg",
      linkUrl: homepageConfig?.sections?.featuredCategories?.helmets?.linkUrl || "/motorcycle-helmets"
    },
    gloves: {
      id: "cat-gloves",
      title: homepageConfig?.sections?.featuredCategories?.gloves?.title || "GLOVES",
      imageUrl: homepageConfig?.sections?.featuredCategories?.gloves?.imageUrl || "/glovescat.jpg",
      linkUrl:
        !homepageConfig?.sections?.featuredCategories?.gloves?.linkUrl ||
        homepageConfig?.sections?.featuredCategories?.gloves?.linkUrl === "/gloves" ||
        homepageConfig?.sections?.featuredCategories?.gloves?.linkUrl === "/riding-gloves" ||
        homepageConfig?.sections?.featuredCategories?.gloves?.linkUrl === "/riding-gear/motorcycle-riding-gloves"
          ? "/riding-gear/riding-gloves"
          : homepageConfig?.sections?.featuredCategories?.gloves?.linkUrl
    },
    jackets: {
      id: "cat-jackets",
      title: homepageConfig?.sections?.featuredCategories?.jackets?.title || "JACKETS",
      imageUrl: homepageConfig?.sections?.featuredCategories?.jackets?.imageUrl || "/jacketcat.jpg",
      linkUrl:
        !homepageConfig?.sections?.featuredCategories?.jackets?.linkUrl ||
        homepageConfig?.sections?.featuredCategories?.jackets?.linkUrl === "/jackets" ||
        homepageConfig?.sections?.featuredCategories?.jackets?.linkUrl === "/riding-jackets" ||
        homepageConfig?.sections?.featuredCategories?.jackets?.linkUrl === "/riding-gear/riding-jacket"
          ? "/riding-gear/riding-jackets"
          : homepageConfig?.sections?.featuredCategories?.jackets?.linkUrl
    }
  };

  // Define diverse riding gear categories to represent in BROWSE RIDING GEAR CATEGORIES
  const categoryRules = [
    {
      label: 'RIDING BOOTS',
      matcher: (cat: string, name: string) => /boot/i.test(cat) || /boot/i.test(name),
    },
    {
      label: 'RIDING PANTS',
      matcher: (cat: string, name: string) => /pant|trouser|jean/i.test(cat) || /pant|trouser|jean/i.test(name),
    },
    {
      label: 'TAIL BAGS',
      matcher: (cat: string, name: string) => /tail\s*bag/i.test(cat) || /tail\s*bag/i.test(name),
    },
    {
      label: 'ARMOUR & GUARDS',
      matcher: (cat: string, name: string) => /knee|guard|protector|armour|armor|chest|back|hip/i.test(cat) || /knee|guard|protector|armour|armor|chest|back|hip/i.test(name),
    },
    {
      label: 'RIDING SHOES',
      matcher: (cat: string, name: string) => /shoe|sneaker/i.test(cat) || /shoe|sneaker/i.test(name),
    },
    {
      label: 'TANK BAGS',
      matcher: (cat: string, name: string) => /tank\s*bag|saddle\s*bag|pannier/i.test(cat) || /tank\s*bag|saddle\s*bag|pannier/i.test(name),
    },
    {
      label: 'HYDRATION PACKS',
      matcher: (cat: string, name: string) => /hydration|bladder|backpack/i.test(cat) || /hydration|bladder|backpack/i.test(name),
    },
    {
      label: 'RAIN GEAR',
      matcher: (cat: string, name: string) => /rain|waterproof\s*cover|monsoon/i.test(cat) || /rain|waterproof\s*cover/i.test(name),
    },
    {
      label: 'ACCESSORIES',
      matcher: (cat: string, name: string) => /mount|holder|light|flash|spec\s*easy|bungee/i.test(cat) || /mount|holder|light|flash|spec\s*easy|bungee/i.test(name),
    },
  ];

  // Helper to identify and exclude spare parts, helmets, jackets, and gloves
  const isExcludedGear = (p: any) => {
    const catStr = (p.magentoCategories || "").toLowerCase();
    const nameStr = (p.name || "").toLowerCase();
    const slugStr = (p.slug || "").toLowerCase();

    // Exclude spare parts (air filters, spark plugs, brake pads, oils, exhausts)
    if (/spare part|air filter|spark plug|brake pad|oils & lubes|exhaust/i.test(catStr) || /air filter|spark plug|iridium|exhaust/i.test(nameStr)) return true;

    // Exclude helmets, jackets, gloves
    const hasHelmet = /\b(helmet|helmets|visor|visors|pinlock)\b/i.test(catStr) || 
                      /\b(helmet|helmets|visor|visors|pinlock)\b/i.test(nameStr) ||
                      /(?:helmet|visor|pinlock)/i.test(slugStr);

    const hasJacket = /\b(jacket|jackets)\b/i.test(catStr) || 
                      /\b(jacket|jackets)\b/i.test(nameStr) ||
                      /(?:jacket|jackets)/i.test(slugStr);

    const hasGloves = /\b(glove|gloves|gauntlet)\b/i.test(catStr) || 
                      /\b(glove|gloves|gauntlet)\b/i.test(nameStr) ||
                      /(?:glove|gloves|gauntlet)/i.test(slugStr);

    return hasHelmet || hasJacket || hasGloves;
  };

  const eligibleProducts = (backendProductsList || []).filter((p: any) => !isExcludedGear(p));

  // Pick exactly 1 latest product from each category rule for maximum variety
  const diverseProducts: any[] = [];
  const usedIds = new Set<string>();

  categoryRules.forEach(rule => {
    const match = eligibleProducts.find((p: any) => 
      !usedIds.has(p._id) && 
      rule.matcher((p.magentoCategories || "").toLowerCase(), (p.name || "").toLowerCase())
    );
    if (match) {
      diverseProducts.push({ ...match, displayCategory: rule.label });
      usedIds.add(match._id);
    }
  });

  // If fewer than 8, backfill with remaining eligible products without duplicates
  if (diverseProducts.length < 8) {
    categoryRules.forEach(rule => {
      if (diverseProducts.length >= 8) return;
      const match = eligibleProducts.find((p: any) => 
        !usedIds.has(p._id) && 
        rule.matcher((p.magentoCategories || "").toLowerCase(), (p.name || "").toLowerCase())
      );
      if (match) {
        diverseProducts.push({ ...match, displayCategory: rule.label });
        usedIds.add(match._id);
      }
    });
  }

  const gridProducts: BrowseProductData[] = diverseProducts.length > 0 
    ? diverseProducts.map((p: any, idx: number) => {
        // Resolve price with fallbacks: basePrice → variant prices → specialPrice
        let effectivePrice = p.basePrice || 0;
        if (effectivePrice === 0 && Array.isArray(p.variants) && p.variants.length > 0) {
          const vp = p.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
          if (vp.length > 0) effectivePrice = Math.min(...vp);
        }
        if (effectivePrice === 0 && p.specialPrice && p.specialPrice > 0) effectivePrice = p.specialPrice;
        const displayPrice = (p.specialPrice && p.specialPrice > 0 && effectivePrice > 0 && p.specialPrice < effectivePrice)
          ? p.specialPrice : effectivePrice;

        return {
          id: p._id || p.id || `grid-${idx}`,
          category: p.displayCategory || "RIDING GEAR",
          name: p.name,
          priceFormatted: `₹ ${Math.round(displayPrice)?.toLocaleString('en-IN') || '0'}`,
          imageUrl: (p.images && p.images.length > 0 && p.images[0].url) ? p.images[0].url : "/no-image.svg",
          rating: 4.8,
          productUrl: `/${p.slug || p._id}`
        };
      })
    : [];

  // 8 slots 1-to-1 mapped: Slot 1 (idx 0) is always Position 1, Slot 8 (idx 7) is Position 8
  const configuredItems = homepageConfig?.sections?.browseCategories?.items;
  const hasAnyConfigured = Array.isArray(configuredItems) && configuredItems.some((it: any) => it?.name && (it?.imageUrl || it?.productUrl));

  const finalBrowseProducts: BrowseProductData[] = hasAnyConfigured
    ? Array.from({ length: 8 }, (_, idx) => {
        const configured = configuredItems?.[idx];
        if (configured && configured.name && (configured.imageUrl || configured.productUrl)) {
          return {
            id: configured.id || `custom-browse-${idx + 1}`,
            category: (configured.category || "RIDING GEAR").toUpperCase(),
            name: configured.name,
            priceFormatted: configured.priceFormatted || "₹ 0",
            imageUrl: configured.imageUrl || "/no-image.svg",
            rating: configured.rating || 4.8,
            productUrl: configured.productUrl || "/products",
          };
        }
        // Fallback for this slot to the dynamic catalog product at the same index
        return gridProducts[idx] || gridProducts[0];
      })
    : gridProducts;

  // Filter backend products for touring and adventure riding gear
  const matchedTouring = (backendProductsList || []).filter((p: any) => {
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
    : [...matchedTouring, ...(backendProductsList || []).filter((p: any) => !matchedTouring.some((m: any) => m._id === p._id))].slice(0, 4);

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
          priceFormatted: `₹ ${Math.round(displayPrice)?.toLocaleString('en-IN') || '0'}`,
          imageUrl: (p.images && p.images.length > 0 && p.images[0].url) 
            ? p.images[0].url 
            : "/no-image.svg",
          rating: 4.8,
          productUrl: `/${p.slug || p._id}`
        };
      })
    : [];

  const { data: storeReviewsQuery } = useStoreReviews({ random: true, limit: 10 });
  const queryReviews = storeReviewsQuery?.pages.flatMap((p) => p.data) || [];
  const fetchedStoreReviews = queryReviews.length > 0 ? queryReviews : (storeReviews || []);

  const testimonialsData: TestimonialData[] = React.useMemo(() => {
    if (!fetchedStoreReviews || fetchedStoreReviews.length === 0) return [];

    let mappedReviews: TestimonialData[] = fetchedStoreReviews.map((r: any) => ({
      id: r._id || r.id,
      authorName: r.author,
      date: r.date,
      rating: r.rating || 5,
      content: r.text,
      verified: true,
      link: r.link,
      avatarUrl: r.avatarUrl,
    }));

    mappedReviews = mappedReviews.slice(0, 20);

    return mappedReviews;
  }, [fetchedStoreReviews]);

  // Background image using the provided heropic1.jpg from public folder
  const heroBgImage = "/heropic1.jpg";

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-neutral-100 antialiased selection:bg-amber-800 selection:text-white">
      {/* 1. Top Announcement Bar */}
      {homepageConfig?.sections?.topBanner?.isEnabled !== false && (
        <header>
          <TopBanner
            message={homepageConfig?.sections?.topBanner?.message || "Discount 20% For New Member,"}
            highlightText={homepageConfig?.sections?.topBanner?.highlightText || "ONLY FOR TODAY!!"}
            bannerUrl={homepageConfig?.sections?.topBanner?.linkUrl}
          />
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Hero Container with Header overlay */}
        <div className="relative w-full bg-neutral-200">
          {/* 2. Header Navigation */}
          <Navbar
            logoText="Store4Riders"
            theme="dark"
            hasTopBanner={homepageConfig?.sections?.topBanner?.isEnabled !== false}
          />

          <HeroSection
            subtitle={homepageConfig?.hero?.subtitle || "BROWSE THE COLLECTION"}
            title={homepageConfig?.hero?.title || "RIDING GEAR THAT KEEPS YOU SAFE"}
            bgImageUrl={homepageConfig?.hero?.bgImages?.[0] || heroBgImage}
            bgImageUrls={homepageConfig?.hero?.bgImages?.length ? homepageConfig.hero.bgImages : ["/heropic1.jpg", "/heropic2.jpg"]}
            featuredProducts={featuredProducts}
            ctaText={homepageConfig?.hero?.ctaText || "Shop Now"}
            ctaLink={homepageConfig?.hero?.ctaLink || "/products"}
          />
        </div>

        {/* 4. Featured Categories (3 Equal Cards Grid) */}
        <FeaturedCategories
          title={homepageConfig?.sections?.featuredCategories?.sectionTitle || "SHOP BY CATEGORY"}
          categories={categoryData}
        />

        {/* 5. Browse Products Section (Scrollable Carousel with Arrows) */}
        <BrowseProductsSection
          title={homepageConfig?.sections?.browseCategories?.sectionTitle || "BROWSE RIDING GEAR CATEGORIES"}
          products={finalBrowseProducts}
          mobileLayout="scroll"
        />

        {/* 6. Touring Gear Section */}
        <BrowseProductsSection
          title={homepageConfig?.sections?.touringGear?.sectionTitle || "BEST GEAR FOR TOURING"}
          products={touringProducts}
          showSeeMore={true}
          seeMoreText={homepageConfig?.sections?.touringGear?.seeMoreText || "SEE MORE"}
          seeMoreLink={homepageConfig?.sections?.touringGear?.seeMoreLink || "/products?q=touring"}
          mobileLayout="scroll"
        />

        {/* 7. Social Media / Insta Reels Section */}
        <SocialMediaSection
          title={homepageConfig?.sections?.socialMedia?.sectionTitle || "INSTA REELS"}
          subtitle={homepageConfig?.sections?.socialMedia?.sectionSubtitle}
          instagramHandle={homepageConfig?.sections?.socialMedia?.instagramHandle}
          instagramProfileUrl={homepageConfig?.sections?.socialMedia?.instagramProfileUrl}
          followersCount={homepageConfig?.sections?.socialMedia?.followersCount}
          followingCount={homepageConfig?.sections?.socialMedia?.followingCount}
          postsCount={homepageConfig?.sections?.socialMedia?.postsCount}
          profileAvatarUrl={homepageConfig?.sections?.socialMedia?.profileAvatarUrl}
          reels={homepageConfig?.sections?.socialMedia?.reels}
          reelImages={homepageConfig?.sections?.socialMedia?.reelImages}
          bannerTop={homepageConfig?.sections?.socialMedia?.bannerTop}
          bannerBottom={homepageConfig?.sections?.socialMedia?.bannerBottom}
        />

        {/* 8. Testimonials Section */}
        <TestimonialsSection
          title={homepageConfig?.sections?.testimonials?.sectionTitle || "WHAT CUSTOMERS SAY ABOUT US"}
          testimonials={testimonialsData}
        />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default HomepageModule;
