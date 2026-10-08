"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const colorQuery = searchParams.get("color");

  // Reset defaults when product changes (e.g. navigating via related products)
  useEffect(() => {
    let initialColor = "";
    
    if (colorQuery && product.colors?.length > 0) {
      const exactMatch = product.colors.find((c: any) => c.name.toLowerCase() === colorQuery.toLowerCase());
      if (exactMatch) {
        initialColor = exactMatch.name;
      } else {
        const partialMatch = product.colors.find((c: any) => 
          c.name.toLowerCase().includes(colorQuery.toLowerCase()) || 
          colorQuery.toLowerCase().includes(c.name.toLowerCase())
        );
        if (partialMatch) {
          initialColor = partialMatch.name;
        }
      }
    }
    
    if (!initialColor && product.colors?.length > 0) {
      // Fallback: try to match a color to the primary image (images[0])
      // This ensures if PLP shows Neon helmet, PDP defaults to the Neon swatch instead of arbitrary first color (Black).
      let matchedToFirstImage = "";
      if (product.images && product.images.length > 0) {
        const firstImg = product.images[0];
        const alt = (firstImg.altText || "").toLowerCase();
        const url = (firstImg.url || "").toLowerCase();
        
        // 1. Try to find a variant that explicitly uses this image URL
        if (product.rawVariants) {
          const matchingVariant = product.rawVariants.find(v => v.imageUrl && v.imageUrl.toLowerCase() === url);
          if (matchingVariant && matchingVariant.attributes) {
            const colorKey = Object.keys(matchingVariant.attributes).find(k => k.toLowerCase().includes('color') || k.toLowerCase().includes('colour'));
            if (colorKey && matchingVariant.attributes[colorKey]) {
              const vColor = matchingVariant.attributes[colorKey];
              // Ensure this color exists in product.colors
              const existingColor = product.colors.find((c: any) => c.name.toLowerCase() === vColor.toLowerCase());
              if (existingColor) matchedToFirstImage = existingColor.name;
            }
          }
        }
        
        // 2. If no variant match, fallback to text matching on URL/Alt
        if (!matchedToFirstImage) {
          for (const c of product.colors) {
            const tokens = c.name.toLowerCase().split(/[/\\&\-_+ ]/).filter(Boolean);
            const isMatch = tokens.length > 0 && tokens.every((t: string) => {
              const term = t === "flu." || t === "flu" ? "neon" : t;
              let m = alt.includes(term) || url.includes(term);
              if (t === "flu." && !m) m = alt.includes("flu") || url.includes("flu");
              if (term === "yellow" && !m) m = alt.includes("orange") || url.includes("orange") || alt.includes("green") || url.includes("green") || alt.includes("neon") || url.includes("neon");
              return m;
            });
            if (isMatch) {
              matchedToFirstImage = c.name;
              break;
            }
          }
        }
      }
      initialColor = matchedToFirstImage || product.colors[0].name;
    }

    setSelectedColor(initialColor);
    
    if (product.sizes?.length > 0) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize("");
    }
  }, [product.slug, colorQuery, product.colors, product.sizes]);

  // Calculate disabled colors based on variant stock
  const disabledColors = React.useMemo(() => {
    if (!product.rawVariants) return [];
    const validColors = new Set<string>();
    
    product.rawVariants.forEach(v => {
      if (v.stock > 0 || product.allowBackorders) {
        const attrs = v.attributes || {};
        const col = Object.entries(attrs).find(([k]) => {
          const kl = k.toLowerCase();
          return kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour');
        })?.[1];
        if (col) validColors.add(String(col).trim().toLowerCase());
      }
    });

    if (validColors.size === 0) return [];
    
    return (product.colors || []).map(c => c.name).filter(c => !validColors.has(c.toLowerCase()));
  }, [product.colors, product.rawVariants]);

  // Calculate disabled sizes for the CURRENTLY selected color based on variant existence AND stock
  const disabledSizes = React.useMemo(() => {
    if (!product.rawVariants) return [];
    const validSizesForColor = new Set<string>();
    
    product.rawVariants.forEach(v => {
      const attrs = v.attributes || {};
      const col = Object.entries(attrs).find(([k]) => {
        const kl = k.toLowerCase();
        return kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour');
      })?.[1] || "";
      
      if (!selectedColor || String(col).trim().toLowerCase() === selectedColor.toLowerCase()) {
        // Only mark size as valid if stock is strictly > 0 OR backorders are allowed
        if (v.stock > 0 || product.allowBackorders) {
          const sz = Object.entries(attrs).find(([k]) => {
            const kl = k.toLowerCase();
            const isColor = kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour');
            return !isColor;
          })?.[1];
          if (sz) validSizesForColor.add(String(sz).trim());
        }
      }
    });

    // If no size restrictions found for this color (e.g. all out of stock), disable all sizes
    if (validSizesForColor.size === 0) return product.sizes;

    // Disable sizes that are not in validSizesForColor
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
    const colorMatch = !selectedColor || Object.entries(attrs).some(([k, val]) => {
      const kl = k.toLowerCase();
      return (kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour')) && String(val).trim().toLowerCase() === selectedColor.toLowerCase();
    });
    const sizeMatch = !selectedSize || Object.entries(attrs).some(([k, val]) => {
      const kl = k.toLowerCase();
      const isColor = kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour');
      return !isColor && String(val).trim() === selectedSize;
    });
    return colorMatch && sizeMatch;
  });

  const baseNumericPrice = parseFloat(product.priceFormatted.replace(/[^0-9.]/g, "")) || 0;
  
  let activePrice = baseNumericPrice;
  let activeOriginalPriceFormatted = product.originalPriceFormatted;
  let activeDiscountBadge = product.discountBadge;

  if (activeVariant && activeVariant.price > 0) {
    const vBase = activeVariant.price;
    const vSpecial = activeVariant.specialPrice;
    if (vSpecial && vSpecial > 0 && vSpecial < vBase) {
      activePrice = vSpecial;
      activeOriginalPriceFormatted = new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(vBase);
      activeDiscountBadge = `${Math.round(((vBase - vSpecial) / vBase) * 100)}%`;
    } else {
      activePrice = vBase;
      activeOriginalPriceFormatted = undefined;
      activeDiscountBadge = undefined;
    }
  }

  const activePriceFormatted = activePrice > 0 
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(activePrice)
    : product.priceFormatted;

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
    <div className="w-full min-h-screen flex flex-col font-sans bg-white relative">
      
      {/* 1. Header Global Area */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />
      <div className="bg-white border-b border-neutral-200 relative z-[60]">
        <Navbar
          logoText="Store4Riders"
          theme="light"
          
        />
      </div>

      {/* Breadcrumbs matching URL structure: /products/[slug] */}
      <Breadcrumb items={[
        { label: "HOME", href: "/" },
        { label: "PRODUCTS", href: "/products" },
        ...(product.category ? [{ label: product.category, href: `/${product.category.toLowerCase().replace(/\s+/g, '-')}` }] : []),
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
              selectedSize={selectedSize}
              activeVariantImageUrl={activeVariant?.imageUrl}
            />
          </div>

          {/* Right: Info, Kit & Reviews (50% width on large screens) */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 md:pt-4 lg:pt-0 pb-2 md:pb-6">
            <ProductInfo 
              id={product.id}
              category={product.category}
              rating={product.rating}
              name={product.name}
              originalPriceFormatted={activeOriginalPriceFormatted}
              discountBadge={activeDiscountBadge}
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
          <div className="mt-4 md:mt-8">
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

      {/* 4. Global Footer with extra bottom padding for sticky bar */}
      <div className="bg-banner pb-32 md:pb-28">
        <Footer />
      </div>

      {/* 5. Sticky Add to Cart Bar */}
      <StickyFooterBar 
        productName={product.name}
        priceFormatted={activePriceFormatted}
        colors={product.colors}
        sizes={product.sizes}
        sizeLabel={product.sizeLabel}
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
