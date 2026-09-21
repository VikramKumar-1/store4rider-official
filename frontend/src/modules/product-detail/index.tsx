"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useCartStore } from "@/stores/useCartStore";
import { useRecentViewsStore } from "@/stores/useRecentViewsStore";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductDetailProps } from "./types/product-detail.types";
import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { StickyFooterBar } from "./components/StickyFooterBar";

// Lazy-load below-fold components — don't block initial page render
const CompleteKitSlider = dynamic(() => import("./components/CompleteKitSlider").then(m => ({ default: m.CompleteKitSlider })), { ssr: false });
const StoreReviews = dynamic(() => import("./components/StoreReviews").then(m => ({ default: m.StoreReviews })), { ssr: false });
const DetailAndReviews = dynamic(() => import("./components/DetailAndReviews").then(m => ({ default: m.DetailAndReviews })), { ssr: false });
const UpSellProducts = dynamic(() => import("./components/UpSellProducts").then(m => ({ default: m.UpSellProducts })), { ssr: false });

export const ProductDetailModule: React.FC<ProductDetailProps> = ({ product }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || "");
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [availableSizes, setAvailableSizes] = useState<string[]>(product.sizes || []);
  const addItem = useCartStore((state) => state.addItem);
  const recentViews = useRecentViewsStore((state) => state.items);
  const router = useRouter();

  // Reset defaults when product changes
  useEffect(() => {
    if (product.colors?.length > 0) {
      setSelectedColor(product.colors[0].name);
    }
  }, [product.slug]);

  // We are removing the strict "stock <= 0" check because Magento CSVs often have 0 qty 
  // even if the product is orderable. Colors will only be disabled if they strictly don't exist.
  const disabledColors: string[] = [];

  // Calculate disabled sizes for the CURRENTLY selected color based on variant existence
  const disabledSizes = React.useMemo(() => {
    if (!product.rawVariants) return [];
    const validSizesForColor = new Set<string>();
    
    product.rawVariants.forEach(v => {
      const attrs = v.attributes || {};
      const col = Object.entries(attrs).find(([k]) => k.toLowerCase() === 'color')?.[1] || "";
      if (!selectedColor || String(col).trim().toLowerCase() === selectedColor.toLowerCase()) {
        // As long as the variant exists for this color, the size is valid.
        const sz = Object.entries(attrs).find(([k]) => k.toLowerCase().includes('size'))?.[1];
        if (sz) validSizesForColor.add(String(sz).trim());
      }
    });

    // If a size is in product.sizes but NOT in validSizesForColor, it means this 
    // specific Color doesn't manufacture this size. So we disable it.
    return product.sizes.filter(s => !validSizesForColor.has(s));
  }, [selectedColor, product.sizes, product.rawVariants]);

  // Auto-select the first valid size if the current one becomes disabled
  useEffect(() => {
    if (disabledSizes.includes(selectedSize) && product.sizes.length > 0) {
      const firstValid = product.sizes.find(s => !disabledSizes.includes(s));
      if (firstValid) setSelectedSize(firstValid);
    }
  }, [selectedColor, disabledSizes, selectedSize, product.sizes]);

  // Dynamically calculate active price based on selected variants
  const activeVariant = product.rawVariants?.find(v => {
    const attrs = v.attributes || {};
    const colorMatch = !selectedColor || Object.entries(attrs).some(([k, val]) => k.toLowerCase() === 'color' && String(val).trim().toLowerCase() === selectedColor.toLowerCase());
    const sizeMatch = !selectedSize || Object.entries(attrs).some(([k, val]) => k.toLowerCase().includes('size') && String(val).trim() === selectedSize);
    return colorMatch && sizeMatch;
  });

  const baseNumericPrice = parseFloat(product.priceFormatted.replace(/[^0-9.]/g, "")) || 0;
  const activePrice = activeVariant?.price || baseNumericPrice;
  const activePriceFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(activePrice);

  const handleAddToCart = (color: string, size: string) => {
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity: 1,
      variantId: activeVariant?.sku || `${color}-${size}`,
      product: {
        _id: product.id,
        id: product.id,
        name: product.name,
        basePrice: activePrice,
        price: activePrice,
        images: product.images,
        slug: product.slug,
        selectedColor: color,
        selectedSize: size,
      } as any,
    });
  };

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-white relative pb-20 md:pb-24">
      
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

      {/* Breadcrumbs matching URL structure: /products/[slug] */}
      <Breadcrumb items={[
        { label: "HOME", href: "/" },
        { label: "PRODUCTS", href: "/products" },
        ...(product.category ? [{ label: product.category, href: `/products?category=${product.category.toLowerCase()}` }] : []),
        { label: product.name }
      ]} />

      {/* 2. Main Product Hero Area */}
      <main className="max-w-[1400px] w-full mx-auto px-4 md:px-6 pt-2 md:pt-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Left: Gallery (50% width on large screens) */}
          <div className="w-full lg:w-1/2 max-w-2xl mx-auto lg:mx-0">
            <ProductGallery 
              images={product.images} 
              selectedColor={selectedColor}
            />
          </div>

          {/* Right: Info & Kit (50% width on large screens) */}
          <div className="w-full lg:w-1/2 flex flex-col pt-4 lg:pt-0">
            <ProductInfo 
              category={product.category}
              rating={product.rating}
              name={product.name}
              originalPriceFormatted={product.originalPriceFormatted}
              discountBadge={product.discountBadge}
              priceFormatted={activePriceFormatted}
              shortDescription={product.shortDescription}
              colors={product.colors}
              sizes={product.sizes}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              disabledColors={disabledColors}
              disabledSizes={disabledSizes}
              onColorChange={setSelectedColor}
              onSizeChange={setSelectedSize}
            />
            
            <div className="mt-10 border-t border-neutral-100 pt-6">
              <CompleteKitSlider products={product.kitProducts} />
            </div>
            
            {/* Mobile Only: Store Reviews */}
            <div className="mt-10 border-t border-neutral-100 pt-6 lg:hidden">
              <StoreReviews reviews={product.storeReviews} />
            </div>
          </div>
        </div>

        {/* Desktop Only: Premium Aligned Guarantees & Reviews Section */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch mt-6 pt-6 border-t border-neutral-200/80">
          
          {/* Left: Store Promises Card */}
          <div className="bg-neutral-50/60 border border-neutral-200/70 rounded-2xl p-5 md:p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand" />
                <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-neutral-900">
                  Store Guarantees
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-neutral-200/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-neutral-700 shadow-xs">
                <span className="text-brand">🛡️</span>
                <span>Official Partner</span>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-orange-50/80 border border-orange-100 flex items-center justify-center text-banner shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">100% Genuine</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">Brand authorized</span>
                </div>
              </div>

              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-orange-50/80 border border-orange-100 flex items-center justify-center text-banner shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">Free Shipping</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">Across all India</span>
                </div>
              </div>

              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-orange-50/80 border border-orange-100 flex items-center justify-center text-banner shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">Easy Exchange</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">7 days size swap</span>
                </div>
              </div>

              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-orange-50/80 border border-orange-100 flex items-center justify-center text-banner shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">Secure Payment</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">Razorpay encrypted</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Store Reviews Card */}
          <div className="bg-neutral-50/60 border border-neutral-200/70 rounded-2xl p-5 md:p-6 flex flex-col justify-between overflow-hidden">
            <StoreReviews reviews={product.storeReviews} />
          </div>
        </div>

        {/* 3. Bottom Detail Areas */}
        <div className="mt-8 w-full">
          <DetailAndReviews 
            fullDescription={product.fullDescription} 
            reviews={product.productReviews} 
          />
        </div>
        
        <UpSellProducts products={product.upSellProducts} />

        {recentViews.length > 0 && (
          <div className="mt-[-80px] md:mt-[-100px]">
            <UpSellProducts 
              products={recentViews.filter(p => p.id !== product.id).map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                priceFormatted: p.priceFormatted,
                imageUrl: p.imageUrl,
                productUrl: p.productUrl
              }))} 
              title="Recently Viewed" 
            />
          </div>
        )}

      </main>

      {/* 4. Global Footer */}
      <Footer />

      {/* 5. Sticky Add to Cart Bar */}
      <StickyFooterBar 
        productName={product.name}
        priceFormatted={activePriceFormatted}
        colors={product.colors}
        sizes={product.sizes}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        disabledColors={disabledColors}
        disabledSizes={disabledSizes}
        onColorChange={setSelectedColor}
        onSizeChange={setSelectedSize}
        rating={product.rating}
        reviewCount={product.reviewCount}
        onAddToCart={handleAddToCart}
      />

    </div>
  );
};
