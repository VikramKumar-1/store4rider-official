"use client";

import { memo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@store4riders/shared-utils";
import { ShoppingCart, Check, Star, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";

import { toast } from "sonner";
import { apiClient } from "@/core/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useWishlist } from "@/core/hooks/useWishlist";

import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";

interface ProductCardProps {
  product: any;
  showBuyNow?: boolean;
}

const ProductCard = ({ product, showBuyNow = false }: ProductCardProps) => {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const queryClient = useQueryClient();
  const { data: wishlistIds = [] } = useWishlist();
  const productId = product.id || product._id;

  useEffect(() => {
    setIsWishlisted(wishlistIds.includes(productId));
  }, [wishlistIds, productId]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: crypto.randomUUID(),
      productId: product.id || product._id,
      quantity: 1,
      product: product,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: crypto.randomUUID(),
      productId: product.id || product._id,
      quantity: 1,
      product: product,
    });

    router.push("/checkout");
  };

  const searchParams = useSearchParams();
  const activeColorParam = searchParams?.get("colour");
  const activeColors = activeColorParam ? activeColorParam.split(",").map(c => c.trim().toLowerCase()) : [];

  let bestRawUrl = product.images?.[0]?.url || product.image || "/no-image.svg";

  // If a color filter is active, try to find an image that matches the color
  if (activeColors.length > 0 && product.images && product.images.length > 0) {
    const matchedImage = product.images.find((img: any) => {
      const altText = (img.altText || "").toLowerCase();
      const urlText = (img.url || "").toLowerCase();
      return activeColors.some(color => altText.includes(color) || urlText.includes(color.replace(/\s+/g, '-')));
    });
    if (matchedImage) {
      bestRawUrl = matchedImage.url;
    }
  }

  // Ensure compressed parameters on CDN URLs for lightning fast load
  const imageUrl = bestRawUrl.includes("unsplash.com") && !bestRawUrl.includes("q=75")
    ? `${bestRawUrl.split("?")[0]}?q=75&w=600&auto=format&fit=crop`
    : bestRawUrl;

  const FALLBACK_IMAGE = "/no-image.svg";
  const [imgSrc, setImgSrc] = useState(imageUrl);

  // Update image if URL changes (e.g. filter changes)
  useEffect(() => {
    setImgSrc(imageUrl);
  }, [imageUrl]);

  const basePrice = product.basePrice || product.price || 0;
  const specialPrice = product.specialPrice || 0;
  const price = (specialPrice > 0 && specialPrice < basePrice) ? specialPrice : basePrice;
  const originalPrice = specialPrice > 0 && specialPrice < basePrice ? basePrice : Math.round(price * 1.25);

  // Extract unique colors for swatches
  const colorNames = new Set<string>();
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((v: any) => {
      if (v.attributes) {
        const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes;
        const colorKey = Object.keys(attrs).find(k => k.toLowerCase().includes('color') || k.toLowerCase().includes('colour'));
        if (colorKey && attrs[colorKey]) colorNames.add(attrs[colorKey]);
      }
    });
  }
  if (colorNames.size === 0 && product.configurableVariations) {
    const variants = product.configurableVariations.split("|");
    variants.forEach((variant: string) => {
      const attrs = variant.split(",");
      attrs.forEach((attr: string) => {
        const [key, value] = attr.split("=");
        if (key && value && (key.trim().toLowerCase().includes('color') || key.trim().toLowerCase().includes('colour'))) {
          colorNames.add(value.trim());
        }
      });
    });
  }
  if (colorNames.size === 0 && product.colorImages) {
    Object.keys(product.colorImages).forEach(color => colorNames.add(color));
  }
  if (colorNames.size === 0 && product.attributes) {
     const attrs = product.attributes instanceof Map ? Object.fromEntries(product.attributes) : product.attributes;
     const colorKey = Object.keys(attrs).find(k => k.toLowerCase().includes('color') || k.toLowerCase().includes('colour'));
     if (colorKey && attrs[colorKey]) colorNames.add(attrs[colorKey]);
  }
  const uniqueColors = Array.from(colorNames);

  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <div
        className="group relative flex flex-col rounded-2xl bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 overflow-hidden h-full"
      >
        {/* Top Section: Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f4f4f4]">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
            className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />

          {/* Sleek Liquid Glassmorphism Rating Badge */}
          <div className="absolute top-2.5 left-2.5 bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-neutral-900 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10 transition-transform hover:scale-105">
            <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>4.9</span>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const prev = isWishlisted;
              setIsWishlisted(!prev);

              apiClient.post("/wishlist/toggle", { productId })
                .then((res) => {
                  queryClient.invalidateQueries({ queryKey: ["wishlist_ids"] });
                  queryClient.invalidateQueries({ queryKey: ["wishlist"] });
                  if (res.data?.data?.added || !prev) {
                    toast.success("Saved to wishlist!");
                  } else {
                    toast.error("Removed from wishlist");
                  }
                })
                .catch((err) => {
                  setIsWishlisted(prev); // revert on error
                  if (err.response?.status === 401) {
                    toast.error("Please login to save to wishlist");
                  } else {
                    toast.error("Failed to update wishlist");
                  }
                });
            }}
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-20 transition-all duration-200 active:scale-90 ${isWishlisted
                ? "bg-red-50 text-red-500 border border-red-200"
                : "bg-white/80 backdrop-blur-md text-neutral-400 hover:text-brand hover:bg-white"
              }`}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={isWishlisted ? 0 : 2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          {/* Hover Overlay: Color Swatches */}
          {uniqueColors.length > 0 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <div className="flex flex-wrap gap-1.5 bg-white/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm border border-white/40">
                {uniqueColors.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/products/${product.slug || product.id}?color=${encodeURIComponent(color)}`);
                    }}
                    className="w-4 h-4 sm:w-4 sm:h-4 border border-black/80 shadow-sm transition-transform hover:scale-110"
                    style={{ background: parseColorToBackground(color) }}
                    title={color}
                    aria-label={`View ${color} variant`}
                  />
                ))}
                {uniqueColors.length > 5 && (
                  <span className="text-[10px] text-slate-800 self-center font-bold pl-1">+{uniqueColors.length - 5}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Text Content */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors mb-3">
            {product.name}
          </h3>

          {/* Pricing & Action */}
          <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col">
              {price > 0 && (
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 line-through mb-0.5">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-sm sm:text-base font-black text-brand tracking-tight leading-none">
                {price > 0 ? formatPrice(price) : "Contact for Price"}
              </span>
            </div>

            {/* Add to Cart / Buy Now Action Area */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                aria-label="Add to cart"
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md ${isAdded
                    ? "bg-green-500 text-white shadow-green-500/20"
                    : "bg-brand text-white hover:bg-brand-dark hover:scale-105 hover:shadow-brand/20 active:scale-95"
                  }`}
              >
                {isAdded ? <Check size={14} strokeWidth={3} /> : <ShoppingCart size={14} strokeWidth={2.5} />}
              </button>

              {showBuyNow && (
                <button
                  onClick={handleBuyNow}
                  className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-slate-900 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-md active:scale-95 shrink-0"
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default memo(ProductCard);
