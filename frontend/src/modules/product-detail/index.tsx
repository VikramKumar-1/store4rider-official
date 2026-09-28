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
  
  // Ignore activeVariant.price because Magento variants often just hold the raw un-discounted base price.
  // This causes the discounted price to be overwritten, showing 5499 as both original and active.
  const activePrice = baseNumericPrice;
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
            
            {product.kitProducts && product.kitProducts.length > 0 && (
              <div className="mt-10 border-t border-neutral-100 pt-6">
                <CompleteKitSlider products={product.kitProducts} />
              </div>
            )}
            
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-brand shrink-0">
                  <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-neutral-900">
                  Store Guarantees
                </h3>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-2 gap-3 py-1">
              {/* 100% Genuine */}
              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">100% Genuine</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">Brand authorized</span>
                </div>
              </div>

              {/* Free Shipping */}
              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <svg viewBox="0 0 256 256" fill="currentColor" className="w-6 h-6">
                    <path d="M244.8,111.37l-25-35.75A15.91,15.91,0,0,0,206.67,69.5H176V56a16,16,0,0,0-16-16H24A16,16,0,0,0,8,56V184a16,16,0,0,0,16,16H42.79a32,32,0,1,0,58.42,0h53.58a32,32,0,1,0,58.42,0H232a16,16,0,0,0,16-16V117.8A16,16,0,0,0,244.8,111.37ZM72,216a16,16,0,1,1,16-16A16,16,0,0,1,72,216Zm112,0a16,16,0,1,1,16-16A16,16,0,0,1,184,216Zm48-32H213.21a32,32,0,1,0-58.42,0H176V85.5h30.67l25.33,36.19Z"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">Free Shipping</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">Across all India</span>
                </div>
              </div>

              {/* Easy Exchange */}
              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">Easy Exchange</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">7 days size swap</span>
                </div>
              </div>

              {/* Secure Payment */}
              <div className="border border-neutral-200/70 p-3.5 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex items-center gap-3.5 h-[72px] hover:border-neutral-300 transition-all">
                <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-900 leading-tight">Secure Payment</span>
                  <span className="text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">100% Encrypted</span>
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
              products={recentViews.filter(p => p.id !== product.id).slice(0, 8).map(p => ({
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
