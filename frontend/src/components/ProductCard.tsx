"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@store4riders/shared-utils";
import { ShoppingCart, Check, Star, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";

interface ProductCardProps {
  product: any;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

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

  const rawUrl = product.images?.[0]?.url || product.image || "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=75&w=600&auto=format&fit=crop";
  // Ensure compressed parameters on CDN URLs for lightning fast load
  const imageUrl = rawUrl.includes("unsplash.com") && !rawUrl.includes("q=75")
    ? `${rawUrl.split("?")[0]}?q=75&w=600&auto=format&fit=crop`
    : rawUrl;

  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=75&w=600&auto=format&fit=crop";
  const [imgSrc, setImgSrc] = useState(imageUrl);

  const price = product.basePrice || product.price || 0;
  const originalPrice = Math.round(price * 1.25);

  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <div 
        className="group relative flex flex-col rounded-2xl bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 overflow-hidden h-full"
      >
        {/* Top Section: Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          
          {/* Review Badge over Image */}
          <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-200/50">
            <span className="text-[10px] font-black text-slate-900 leading-none mt-0.5">4.9</span>
            <Star size={10} fill="currentColor" className="text-amber-500 mb-0.5" />
          </div>
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
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 line-through mb-0.5">
                {formatPrice(originalPrice)}
              </span>
              <span className="text-sm sm:text-base font-black text-brand tracking-tight leading-none">
                {formatPrice(price)}
              </span>
            </div>

            {/* Add to Cart Icon Button */}
            <button
              onClick={handleAddToCart}
              aria-label="Add to cart"
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md ${
                isAdded 
                  ? "bg-green-500 text-white shadow-green-500/20" 
                  : "bg-brand text-white hover:bg-brand-dark hover:scale-105 hover:shadow-brand/20 active:scale-95"
              }`}
            >
              {isAdded ? <Check size={14} strokeWidth={3} /> : <ShoppingCart size={14} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default memo(ProductCard);
