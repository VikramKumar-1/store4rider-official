"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/core/api/client";
import { formatPrice } from "@store4riders/shared-utils";
import { 
  XMarkIcon, 
  ArrowTopRightOnSquareIcon, 
  PencilSquareIcon,
  TagIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

interface OrderItemGalleryModalProps {
  item: {
    productId?: string;
    variantId?: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice?: number;
    image?: string;
    slug?: string;
    size?: string;
    color?: string;
    variantAttributes?: Record<string, string>;
  };
  onClose: () => void;
  hideFinancials?: boolean;
}

export const OrderItemGalleryModal: React.FC<OrderItemGalleryModalProps> = ({ 
  item, 
  onClose, 
  hideFinancials = false 
}) => {
  // Try fetching live product details from backend by SKU or Slug/ID
  const { data: product, isLoading } = useQuery({
    queryKey: ["order-item-product", item.sku, item.slug, item.productId],
    queryFn: async () => {
      // 1. Try by SKU first (most specific for order items)
      if (item.sku) {
        try {
          const res = await apiClient.get(`/products/by-skus?skus=${encodeURIComponent(item.sku)}`);
          if (res.data?.data && res.data.data.length > 0) {
            return res.data.data[0];
          }
        } catch (e) {
          // ignore and fallback
        }
      }

      // 2. Try by Slug
      if (item.slug) {
        try {
          const res = await apiClient.get(`/products/${item.slug}`);
          if (res.data?.data) {
            return res.data.data;
          }
        } catch (e) {
          // ignore
        }
      }

      // 3. Try by productId
      if (item.productId && /^[0-9a-fA-F]{24}$/.test(item.productId)) {
        try {
          const res = await apiClient.get(`/products/${item.productId}`);
          if (res.data?.data) {
            return res.data.data;
          }
        } catch (e) {
          // ignore
        }
      }

      return null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Extract all gallery images
  const fallbackImage = item.image || "/no-image.svg";
  const productImages: string[] = [];

  if (product?.images && Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      const url = typeof img === "string" ? img : img.url;
      if (url && !productImages.includes(url)) {
        productImages.push(url);
      }
    });
  }

  // Ensure item image is in gallery
  if (item.image && !productImages.includes(item.image)) {
    productImages.unshift(item.image);
  }

  // If no images found, use fallback
  if (productImages.length === 0) {
    productImages.push(fallbackImage);
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const currentImage = productImages[activeImageIndex] || productImages[0] || fallbackImage;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const brandName = product?.brand || "Store4Riders Genuine";
  const stockQty = typeof product?.qty === "number" ? product.qty : (product?.stockStatus !== 0 ? 10 : 0);
  const isOutOfStock = product?.stockStatus === 0 || stockQty <= 0;
  const isLowStock = !isOutOfStock && stockQty <= 3;
  const productSlug = product?.slug || item.slug;
  const productId = product?._id || product?.id || item.productId;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/90">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-neutral-900 text-white">
              <CubeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 tracking-tight line-clamp-1" title={item.name}>
                {item.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                <span>SKU: {item.sku || "N/A"}</span>
                {item.variantId && <span>• Variant: {item.variantId}</span>}
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body: Left Gallery & Description + Right Details */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto overscroll-contain grid grid-cols-1 md:grid-cols-12 gap-6 custom-scrollbar">
          
          {/* Left Column: Interactive Image Gallery & Full Description (7 cols on desktop) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            
            {/* Hero Main Image with Next/Prev Controls */}
            <div className="relative w-full aspect-square bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden p-4 flex items-center justify-center group shadow-inner">
              <Image
                src={currentImage}
                alt={item.name}
                fill
                className="object-contain p-2 transition-transform duration-200 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 500px"
                priority
              />

              {/* Prev/Next arrows if multiple images */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md border border-neutral-200 text-neutral-800 hover:bg-white transition-opacity opacity-0 group-hover:opacity-100"
                    title="Previous photo"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md border border-neutral-200 text-neutral-800 hover:bg-white transition-opacity opacity-0 group-hover:opacity-100"
                    title="Next photo"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Counter badge */}
              {productImages.length > 1 && (
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-neutral-900/70 text-white text-[11px] font-mono font-bold">
                  {activeImageIndex + 1} / {productImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
                {productImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 bg-white p-1 transition-all ${
                      activeImageIndex === idx 
                        ? "border-brand ring-2 ring-brand/30 shadow-sm" 
                        : "border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-0.5"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Overview, Short Description & Rich Features Description */}
            {(product?.shortDescription || product?.description || isLoading) && (
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2.5 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                  <span>Product Description &amp; Technical Highlights</span>
                  {isLoading && (
                    <span className="text-brand font-normal">Loading live catalog details...</span>
                  )}
                </div>

                {product?.shortDescription && (
                  <p className="text-neutral-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-neutral-200/60">
                    {product.shortDescription}
                  </p>
                )}

                {product?.description ? (
                  <div 
                    className="text-neutral-600 prose prose-xs max-w-none text-xs leading-relaxed max-h-56 overflow-y-auto overscroll-contain pr-1 custom-scrollbar border-t border-neutral-200/60 pt-2"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : !isLoading ? (
                  <p className="text-neutral-400 italic text-[11px]">No extended description available for this item.</p>
                ) : null}
              </div>
            )}

          </div>

          {/* Right Column: Specs, Inventory, and Quick Actions (5 cols on desktop) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4">
              
              {/* Brand & Stock Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                  <TagIcon className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{brandName}</span>
                </span>

                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    <span>Out of Stock</span>
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                    <span>Low Stock ({stockQty} left)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    <span>In Stock ({stockQty} units)</span>
                  </span>
                )}
              </div>

              {/* Title & SKU Box */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Ordered Product
                </div>
                <h3 className="font-bold text-neutral-900 text-sm leading-snug">
                  {item.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-neutral-600 font-mono pt-1 border-t border-neutral-200/80">
                  <span>SKU: {item.sku}</span>
                  <span className="font-bold text-neutral-900">Qty: {item.quantity}</span>
                </div>
                {item.variantId && (
                  <div className="text-xs text-neutral-600 font-mono">
                    Variant: <strong className="text-neutral-900">{item.variantId}</strong>
                  </div>
                )}
                {(item.size || item.color || item.variantAttributes) && (
                  <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                    {(item.size || item.variantAttributes?.size) && (
                      <span className="px-2 py-0.5 rounded bg-white border border-neutral-200 font-semibold text-neutral-800">
                        Size: {item.size || item.variantAttributes?.size}
                      </span>
                    )}
                    {(item.color || item.variantAttributes?.color) && (
                      <span className="px-2 py-0.5 rounded bg-white border border-neutral-200 font-semibold text-neutral-800">
                        Color: {item.color || item.variantAttributes?.color}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Product Specifications Grid */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Specifications &amp; Classification
                </div>

                <div className="grid grid-cols-2 gap-2 text-neutral-600">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Product Type</span>
                    <strong className="text-neutral-800 capitalize">{product?.productType || "Simple"}</strong>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">HSN Code</span>
                    <strong className="text-neutral-800 font-mono">{product?.hsnCode || "650610"}</strong>
                  </div>

                  {product?.weight && (
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Weight</span>
                      <strong className="text-neutral-800">{product.weight} kg</strong>
                    </div>
                  )}

                  {product?.gender && (
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Rider Gender</span>
                      <strong className="text-neutral-800 capitalize">{product.gender}</strong>
                    </div>
                  )}
                </div>

                {product?.magentoCategories && (
                  <div className="pt-1.5 border-t border-neutral-200/80">
                    <span className="text-neutral-400 block text-[10px] uppercase">Category Path</span>
                    <span className="text-neutral-700 font-medium text-[11px] truncate block">
                      {product.magentoCategories.replace(/\//g, " › ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Pricing Breakdown
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-emerald-900">Unit Order Price:</span>
                  <strong className="text-base font-black font-mono text-emerald-950">
                    {formatPrice(item.unitPrice || product?.specialPrice || product?.basePrice || 0)}
                  </strong>
                </div>
                {product?.basePrice && product?.specialPrice && product.basePrice > product.specialPrice && (
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>MRP (Original):</span>
                    <span className="line-through">{formatPrice(product.basePrice)}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Direct Action Links */}
            <div className="pt-3 border-t border-neutral-200 flex flex-col gap-2">
              {productSlug && (
                <a
                  href={`/products/${productSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase transition-colors shadow-sm"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  <span>View Live on Storefront</span>
                </a>
              )}

              {productId && (
                <a
                  href={`/admin/products/${productId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  <span>Edit in Admin Catalog</span>
                </a>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-between">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <SparklesIcon className="w-4 h-4 text-brand" />
            <span>Click any thumbnail to preview photos</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm"
          >
            Close Gallery
          </button>
        </div>

      </div>
    </div>
  );
};
