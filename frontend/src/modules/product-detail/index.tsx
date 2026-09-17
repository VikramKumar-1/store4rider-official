"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useCartStore } from "@/stores/useCartStore";
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
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  // Reset defaults when product changes
  useEffect(() => {
    if (product.colors?.length > 0) {
      setSelectedColor(product.colors[0].name);
    }
    if (product.sizes?.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product.slug]);

  const handleAddToCart = (color: string, size: string) => {
    const numericPrice = parseFloat(product.priceFormatted.replace(/[^0-9.]/g, "")) || 0;

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity: 1,
      variantId: `${color}-${size}`,
      product: {
        _id: product.id,
        id: product.id,
        name: product.name,
        basePrice: numericPrice,
        price: numericPrice,
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
          
          {/* Left: Gallery & Reviews (40% width on large screens) */}
          <div className="w-full lg:w-[40%] max-w-xl mx-auto lg:mx-0">
            <ProductGallery 
              images={product.images} 
              selectedColor={selectedColor}
            />
            
            <div className="mt-12 hidden lg:block">
              <StoreReviews reviews={product.storeReviews} />
            </div>
          </div>

          {/* Right: Info & Kit (60% width on large screens) */}
          <div className="w-full lg:w-[60%] flex flex-col pt-4 lg:pt-0">
            <ProductInfo 
              category={product.category}
              rating={product.rating}
              name={product.name}
              originalPriceFormatted={product.originalPriceFormatted}
              discountBadge={product.discountBadge}
              priceFormatted={product.priceFormatted}
              shortDescription={product.shortDescription}
              colors={product.colors}
              sizes={product.sizes}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onColorChange={setSelectedColor}
              onSizeChange={setSelectedSize}
            />
            
            <div className="mt-10 border-t border-neutral-100 pt-6">
              <CompleteKitSlider products={product.kitProducts} />
            </div>
            
            {/* Show reviews here on mobile, so it comes after the product details */}
            <div className="mt-10 block lg:hidden">
              <StoreReviews reviews={product.storeReviews} />
            </div>
          </div>
        </div>

        {/* 3. Bottom Detail Areas */}
        <div className="mt-16 w-full">
          <DetailAndReviews 
            fullDescription={product.fullDescription} 
            reviews={product.productReviews} 
          />
        </div>
        
        <UpSellProducts products={product.upSellProducts} />

      </main>

      {/* 4. Global Footer */}
      <Footer />

      {/* 5. Sticky Add to Cart Bar */}
      <StickyFooterBar 
        productName={product.name}
        priceFormatted={product.priceFormatted}
        colors={product.colors}
        sizes={product.sizes}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        onColorChange={setSelectedColor}
        onSizeChange={setSelectedSize}
        rating={product.rating}
        reviewCount={product.reviewCount}
        onAddToCart={handleAddToCart}
      />

    </div>
  );
};
