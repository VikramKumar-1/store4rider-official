"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useCartStore } from "@/stores/useCartStore";
import { useRecentViewsStore } from "@/stores/useRecentViewsStore";
import { useUIStore } from "@/stores/useUIStore";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductDetailProps } from "./types/product-detail.types";
import { ProductGallery } from "./components/ProductGallery";
import { normalizeColorKey } from "./components/ProductDetailPageModule";
import { detectImageColor, getPreferredInStockColor, isUtilityOrInfographicImage } from "@/core/utils/mediaUrlHelper";
import { ProductInfo } from "./components/ProductInfo";
import { StickyFooterBar } from "./components/StickyFooterBar";

// Lazy-load below-fold components — don't block initial page render
const CompleteKitSlider = dynamic(() => import("./components/CompleteKitSlider").then(m => ({ default: m.CompleteKitSlider })), { ssr: false });
const StoreReviews = dynamic(() => import("./components/StoreReviews").then(m => ({ default: m.StoreReviews })), { ssr: false });
const DetailAndReviews = dynamic(() => import("./components/DetailAndReviews").then(m => ({ default: m.DetailAndReviews })), { ssr: false });
const CustomerReviews = dynamic(() => import("./components/DetailAndReviews").then(m => ({ default: m.CustomerReviews })), { ssr: false });
const UpSellProducts = dynamic(() => import("./components/UpSellProducts").then(m => ({ default: m.UpSellProducts })), { ssr: false });

const resolveProductInitialColor = (product: any, colorQuery?: string | null): string => {
  if (colorQuery && product.colors?.length > 0) {
    const normQuery = normalizeColorKey(colorQuery);
    const exactMatch = product.colors.find((c: any) => normalizeColorKey(c.name) === normQuery);
    if (exactMatch) return exactMatch.name;
    const partialMatch = product.colors.find((c: any) => {
      const normC = normalizeColorKey(c.name);
      return normC.includes(normQuery) || normQuery.includes(normC);
    });
    if (partialMatch) return partialMatch.name;
  }

  if (product.colors?.length > 0) {
    const inStockColorName = getPreferredInStockColor(product);
    if (inStockColorName) {
      const normStock = normalizeColorKey(inStockColorName);
      const match = product.colors.find((c: any) => {
        const normC = normalizeColorKey(c.name);
        return normC === normStock || normC.includes(normStock) || normStock.includes(normC);
      });
      if (match) return match.name;
    }

    if (product.images?.length > 0) {
      const knownNames = product.colors.map((c: any) => c.name);
      const genuineImg = product.images.find((img: any) => !isUtilityOrInfographicImage(img)) || product.images[0];
      const detected = genuineImg?.detectedColor || detectImageColor(genuineImg, knownNames);
      if (detected) {
        const normDet = normalizeColorKey(detected);
        const match = product.colors.find((c: any) => {
          const normC = normalizeColorKey(c.name);
          return normC === normDet || normC.includes(normDet) || normDet.includes(normC);
        });
        if (match) return match.name;
      }
    }
    if (product.colors[0]) return product.colors[0].name;
  }
  return "";
};

const resolveProductInitialSize = (product: any, color: string): string => {
  if (!product.sizes || product.sizes.length === 0) return "";
  if (product.rawVariants && product.rawVariants.length > 0) {
    const colorVariants = product.rawVariants.filter((v: any) => {
      const attrs = v.attributes || {};
      const vColor = attrs.color || attrs.colour || "";
      return !color || !vColor || normalizeColorKey(vColor) === normalizeColorKey(color);
    });
    const inStockVar = colorVariants.find((v: any) => (Number(v.stock) || 0) > 0);
    if (inStockVar) {
      const vSize = inStockVar.attributes?.size || inStockVar.attributes?.eu_size_for_boots;
      if (vSize && product.sizes.includes(vSize)) return vSize;
    }
    if (colorVariants.length > 0) {
      const firstVar = colorVariants[0];
      const vSize = firstVar.attributes?.size || firstVar.attributes?.eu_size_for_boots;
      if (vSize && product.sizes.includes(vSize)) return vSize;
    }
  }
  return product.sizes[0] || "";
};

export const ProductDetailModule: React.FC<ProductDetailProps> = ({ product }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const colorQuery = searchParams.get("color");
  const [selectedColor, setSelectedColor] = useState<string>(() => resolveProductInitialColor(product, colorQuery));
  const [selectedSize, setSelectedSize] = useState<string>(() => resolveProductInitialSize(product, resolveProductInitialColor(product, colorQuery)));
  const [availableSizes, setAvailableSizes] = useState<string[]>(product.sizes || []);
  const addItem = useCartStore((state) => state.addItem);
  const recentViews = useRecentViewsStore((state) => state.items);
  const setCurrentProductName = useUIStore((state) => state.setCurrentProductName);

  // Sync current product name into global UI store for WhatsApp & sticky widgets
  useEffect(() => {
    if (product?.name) {
      setCurrentProductName(product.name);
    }
    return () => {
      setCurrentProductName(null);
    };
  }, [product?.name, setCurrentProductName]);

  // Sync defaults when product or color query changes
  useEffect(() => {
    const targetColor = resolveProductInitialColor(product, colorQuery);
    setSelectedColor(targetColor);
    setSelectedSize(resolveProductInitialSize(product, targetColor));
  }, [product.slug, colorQuery]);

  // Calculate disabled colors based on variant stock
  const disabledColors = React.useMemo(() => {
    if (!product.rawVariants || product.rawVariants.length === 0) return [];
    if (product.allowBackorders) return [];
    const validColors = new Set<string>();
    
    product.rawVariants.forEach(v => {
      if (v.stock > 0 || product.allowBackorders) {
        const attrs = v.attributes || {};
        const col = Object.entries(attrs).find(([k]) => {
          const kl = k.toLowerCase();
          return kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour');
        })?.[1];
        if (col) validColors.add(normalizeColorKey(String(col)));
      }
    });

    if (validColors.size === 0) return [];
    
    return (product.colors || []).map(c => c.name).filter(c => !validColors.has(normalizeColorKey(c)));
  }, [product.colors, product.rawVariants, product.allowBackorders]);

  // Calculate disabled sizes for the CURRENTLY selected color based on variant existence AND stock
  const disabledSizes = React.useMemo(() => {
    if (!product.rawVariants || product.rawVariants.length === 0) return [];
    if (product.allowBackorders) return [];
    const validSizesForColor = new Set<string>();
    
    product.rawVariants.forEach(v => {
      const attrs = v.attributes || {};
      const col = Object.entries(attrs).find(([k]) => {
        const kl = k.toLowerCase();
        return kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour');
      })?.[1] || "";
      
      const colStr = String(col).trim();
      const isColStandard = !colStr || ["standard", "default", "none", "n/a", "na", "-", "--"].includes(colStr.toLowerCase());

      if (!selectedColor || isColStandard || normalizeColorKey(colStr) === normalizeColorKey(selectedColor)) {
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
    if (validSizesForColor.size === 0) {
      const hasAnyStock = product.rawVariants.some(v => v.stock > 0 || product.allowBackorders);
      if (!hasAnyStock) return product.sizes || [];
      return [];
    }

    // Disable sizes that are not in validSizesForColor
    return (product.sizes || []).filter(s => !validSizesForColor.has(s));
  }, [selectedColor, product.sizes, product.rawVariants, product.allowBackorders]);

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
      const valStr = String(val).trim().toLowerCase();
      const isColStandard = ["standard", "default", "none", "n/a", "na", "-", "--"].includes(valStr);
      return (kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour')) &&
        (valStr === selectedColor.toLowerCase() || (!selectedColor && isColStandard));
    });
    const sizeMatch = !selectedSize || Object.entries(attrs).some(([k, val]) => {
      const kl = k.toLowerCase();
      const isColor = kl === 'color' || kl === 'colour' || kl.includes('color') || kl.includes('colour');
      const valStr = String(val).trim().toLowerCase();
      const isSzStandard = ["standard", "default", "none", "n/a", "na", "-", "--"].includes(valStr);
      return !isColor && (String(val).trim() === selectedSize || (!selectedSize && isSzStandard));
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
    const hasColor = Boolean(product.colors && product.colors.length > 0 && color);
    const hasSize = Boolean(product.sizes && product.sizes.length > 0 && size);

    // 1. Resolve variant image for the selected color & size
    let variantImageUrl: string | undefined = activeVariant?.imageUrl || (activeVariant as any)?.images?.[0]?.url;

    if (!variantImageUrl && color) {
      // Check product.colors array
      const colorObj = product.colors?.find(
        (c) => c.name.trim().toLowerCase() === color.trim().toLowerCase()
      );
      if (colorObj?.imageUrl) {
        variantImageUrl = colorObj.imageUrl;
      }

      // Check product.colorImages map
      if (!variantImageUrl && product.colorImages) {
        const cMap = product.colorImages instanceof Map
          ? Object.fromEntries(product.colorImages)
          : product.colorImages;
        const matchKey = Object.keys(cMap).find(
          (k) => k.trim().toLowerCase() === color.trim().toLowerCase()
        );
        if (matchKey && cMap[matchKey]) {
          variantImageUrl = cMap[matchKey];
        }
      }

      // Check product.images matching color
      if (!variantImageUrl && product.images && product.images.length > 0) {
        const normColor = color.trim().toLowerCase();
        const knownColors = (product.colors || []).map((c) => c.name);
        const matchingImg = product.images.find((img) => {
          const detected = img.detectedColor || detectImageColor(img, knownColors);
          if (detected && detected.trim().toLowerCase() === normColor) return true;
          const alt = (img.altText || "").toLowerCase();
          const url = (img.url || "").toLowerCase();
          return (
            alt.split(/[-_/\s]+/).includes(normColor) ||
            alt.includes(normColor) ||
            url.includes(normColor)
          );
        });
        if (matchingImg?.url) {
          variantImageUrl = matchingImg.url;
        }
      }
    }

    if (!variantImageUrl && product.images && product.images.length > 0) {
      variantImageUrl = product.images[0]?.url;
    }

    const reorderedImages = variantImageUrl
      ? [
          { url: variantImageUrl, altText: `${product.name} - ${color || ""}` },
          ...(product.images || []).filter((img) => img.url !== variantImageUrl),
        ]
      : product.images;

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity: 1,
      variantId: activeVariant?.sku || (hasColor || hasSize ? `${color}-${size}` : product.id),
      image: variantImageUrl,
      product: {
        _id: product.id,
        id: product.id,
        name: product.name,
        basePrice: activePrice,
        price: activePrice,
        image: variantImageUrl,
        images: reorderedImages,
        slug: product.slug,
        selectedColor: hasColor ? color : undefined,
        selectedSize: hasSize ? size : undefined,
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

      {/* Breadcrumbs matching URL structure: /products/[slug] (Category hierarchy strictly) */}
      <Breadcrumb items={[
        { label: "HOME", href: "/" },
        { label: "PRODUCTS", href: "/products" },
        ...(product.category ? [{ 
          label: product.category.toUpperCase(), 
          href: product.categorySlug ? (product.categorySlug.startsWith("/") ? product.categorySlug : `/${product.categorySlug}`) : `/${product.category.toLowerCase().replace(/\s+/g, '-')}` 
        }] : []),
        ...(product.subCategory ? [{ 
          label: product.subCategory.toUpperCase(), 
          href: product.subCategorySlug ? (product.subCategorySlug.startsWith("/") ? product.subCategorySlug : `/${product.subCategorySlug}`) : `/${product.subCategory.toLowerCase().replace(/\s+/g, '-')}` 
        }] : []),
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
              colorImages={product.colorImages}
              colors={product.colors}
              productTitle={product.name}
              videoUrl={product.videoUrl}
              onColorChange={setSelectedColor}
            />
          </div>

          {/* Right: Info, Kit & Reviews (50% width on large screens) */}
          <div className="w-full lg:w-1/2 flex flex-col pt-2 md:pt-4 lg:pt-0 pb-2 md:pb-6">
            <ProductInfo 
              id={product.id}
              category={product.category}
              brand={product.brand}
              brandSlug={product.brandSlug}
              brandLogo={product.brandLogo}
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
            brand={product.brand}
            brandSlug={product.brandSlug}
            brandLogo={product.brandLogo} 
            reviews={product.productReviews} 
            productId={product.id}
            productName={product.name}
            attributes={product.attributes}
          />
        </div>
        
        {/* Up-Sell: You May Also Like */}
        {product.upSellProducts && product.upSellProducts.length > 0 && (
          <UpSellProducts products={product.upSellProducts} title="You May Also Like" />
        )}

        

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
          <CustomerReviews 
            reviews={product.productReviews} 
            productId={product.id}
            productName={product.name}
          />
        </div>

      </main>

      {/* 4. Global Footer with extra bottom padding for sticky bar */}
      <div className="bg-neutral-950 pb-32 md:pb-28">
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
        onAddToCart={handleAddToCart}
        stockStatus={product.stockStatus}
        allowBackorders={product.allowBackorders}
      />

    </div>
  );
};
