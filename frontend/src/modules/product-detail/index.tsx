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
const CustomerReviews = dynamic(() => import("./components/DetailAndReviews").then(m => ({ default: m.CustomerReviews })), { ssr: false });
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

    // If no size restrictions found for this color, keep all sizes enabled
    if (validSizesForColor.size === 0) return [];

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

          {/* Right: Info, Kit & Reviews (50% width on large screens) */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 md:pt-4 lg:pt-0 pb-2 md:pb-6">
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
              sizeChart={product.sizeChart}
              isFreeShipping={product.isFreeShipping ?? false} // From DB
              onColorChange={setSelectedColor}
              onSizeChange={setSelectedSize}
            />
            
            {/* Complete Kit - Displays right under short description in its own box when available */}
            {product.kitProducts && product.kitProducts.length > 0 && (
              <div className="mt-3 md:mt-4">
                <CompleteKitSlider products={product.kitProducts} />
              </div>
            )}
            
            {/* Store Reviews (Desktop only, hidden on mobile as requested) */}
            <div className="mt-3 hidden md:block">
              <StoreReviews reviews={product.storeReviews} />
            </div>
          </div>
        </div>

        {/* 3. Bottom Detail Areas */}
        <div className="mt-3 md:mt-6 w-full">
          <DetailAndReviews 
            fullDescription={product.fullDescription} 
            reviews={product.productReviews} 
          />
        </div>
        
        <UpSellProducts products={product.upSellProducts} />

        {recentViews.length > 0 && (
          <div className="mt-[-10px] md:mt-[-100px]">
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

        {/* 4. Customer Reviews on Mobile: Placed at bottom below Recently Viewed */}
        <div className="block lg:hidden mt-2 mb-10 w-full">
          <div className="w-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 py-2.5 px-4 rounded-xl mb-4 shadow-xs">
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden">
              <span className="w-4 h-[2px] bg-[#ab1509] shrink-0" />
              <span>Customer Reviews</span>
              <span className="w-4 h-[2px] bg-[#ab1509] shrink-0" />
            </h2>
          </div>
          <CustomerReviews reviews={product.productReviews} />
        </div>

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
        sizeChart={product.sizeChart}
        onColorChange={setSelectedColor}
        onSizeChange={setSelectedSize}
        rating={product.rating}
        reviewCount={product.reviewCount}
        onAddToCart={handleAddToCart}
      />

    </div>
  );
};
