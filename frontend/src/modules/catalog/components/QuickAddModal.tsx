"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { 
  XMarkIcon, 
  ShoppingBagIcon, 
  CheckIcon, 
  MinusIcon, 
  PlusIcon,
  ArrowRightIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { formatPrice } from "@store4riders/shared-utils";
import { useCartStore } from "@/stores/useCartStore";
import { useProductBySlug, IBackendProduct } from "@/core/hooks/useProducts";
import { CatalogProduct } from "../types/catalog.types";
import { 
  parseColorToBackground, 
  parseVariations,
  isValidCssSwatch
} from "@/modules/product-detail/components/ProductDetailPageModule";

export interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CatalogProduct;
  initialSelectedColor?: string | null;
}

const standardOrder = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "4XL", "5XL"];

const sortSizes = (sizesList: string[]): string[] => {
  return [...sizesList].sort((a, b) => {
    const aNorm = a.trim().toUpperCase();
    const bNorm = b.trim().toUpperCase();
    const aIdx = standardOrder.indexOf(aNorm);
    const bIdx = standardOrder.indexOf(bNorm);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.localeCompare(b);
  });
};

const isJunkVariantVal = (val?: string) =>
  Boolean(val && ["standard", "default", "none", "n/a", "na", "-", "--"].includes(val.trim().toLowerCase()));

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  product,
  initialSelectedColor = null,
}) => {
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [sizeError, setSizeError] = useState<boolean>(false);
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch full backend product with variants & configurable options if available
  const { data: fullProduct } = useProductBySlug(
    isOpen ? (product.rawSlug || "") : "",
    product.rawProduct as IBackendProduct | undefined
  );

  const activeProduct = fullProduct || product.rawProduct || (product as any);
  const rawVariants = useMemo(() => {
    return Array.isArray(activeProduct?.variants) ? activeProduct.variants : [];
  }, [activeProduct]);

  // 1. Resolve colors
  const colors = useMemo(() => {
    const map = new Map<string, { name: string; imageUrl?: string; background?: string }>();

    // From product.colors (pre-parsed in catalog)
    if (product.colors && Array.isArray(product.colors)) {
      product.colors.forEach((c) => {
        if (c.name && !isJunkVariantVal(c.name)) {
          map.set(c.name.trim().toLowerCase(), c);
        }
      });
    }

    // From rawVariants
    if (rawVariants.length > 0) {
      rawVariants.forEach((v: any) => {
        const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
        const cVal = attrs.color || attrs.colour;
        if (cVal && !isJunkVariantVal(cVal)) {
          const key = cVal.trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              name: cVal.trim(),
              imageUrl: v.imageUrl,
              background: parseColorToBackground(cVal.trim()),
            });
          } else if (!map.get(key)!.imageUrl && v.imageUrl) {
            map.get(key)!.imageUrl = v.imageUrl;
          }
        }
      });
    }

    // From legacy configurableVariations
    if (map.size === 0 && activeProduct?.configurableVariations) {
      const parsed = parseVariations(activeProduct.configurableVariations);
      parsed.colors.forEach((c) => {
        if (c && !isJunkVariantVal(c)) {
          const key = c.trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              name: c.trim(),
              background: parseColorToBackground(c.trim()),
            });
          }
        }
      });
    }

    return Array.from(map.values());
  }, [product.colors, rawVariants, activeProduct?.configurableVariations]);

  // 2. Resolve sizes
  const sizes = useMemo(() => {
    const set = new Set<string>();

    if (rawVariants.length > 0) {
      rawVariants.forEach((v: any) => {
        const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
        const sVal = attrs.size || attrs.eu_size || attrs.eu_size_for_boots;
        if (sVal && !isJunkVariantVal(sVal)) {
          set.add(sVal.trim());
        }
      });
    }

    if (set.size === 0 && activeProduct?.configurableVariations) {
      const parsed = parseVariations(activeProduct.configurableVariations);
      parsed.sizes.forEach((s) => {
        if (s && !isJunkVariantVal(s)) {
          set.add(s.trim());
        }
      });
    }

    return sortSizes(Array.from(set));
  }, [rawVariants, activeProduct?.configurableVariations]);

  // Initialize or reset selections whenever modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setSizeError(false);
      setQuantity(1);
      setIsAddedSuccess(false);

      // Initialize color
      if (initialSelectedColor && colors.some((c) => c.name.toLowerCase() === initialSelectedColor.toLowerCase())) {
        setSelectedColor(initialSelectedColor);
      } else if (colors.length > 0) {
        setSelectedColor(colors[0].name);
      } else {
        setSelectedColor("");
      }

      // Initialize size: If only 1 size option, auto-select it; otherwise leave empty to prompt user
      if (sizes.length === 1) {
        setSelectedSize(sizes[0]);
      } else {
        setSelectedSize("");
      }
    }
  }, [isOpen, product.id, initialSelectedColor, colors.length, sizes.length]);

  // 3. Size availability for the selected color
  const sizeAvailability = useMemo(() => {
    const availability: Record<string, { available: boolean; stock: number; variant?: any }> = {};

    sizes.forEach((size) => {
      const matching = rawVariants.filter((v: any) => {
        const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
        const vSize = attrs.size || attrs.eu_size || attrs.eu_size_for_boots;
        if (!vSize || vSize.trim().toLowerCase() !== size.trim().toLowerCase()) return false;
        if (!selectedColor) return true;
        const vColor = attrs.color || attrs.colour;
        return !vColor || vColor.trim().toLowerCase() === selectedColor.trim().toLowerCase();
      });

      if (matching.length > 0) {
        const totalStock = matching.reduce((acc: number, v: any) => acc + (typeof v.stock === "number" ? v.stock : 1), 0);
        availability[size] = {
          available: totalStock > 0 || Boolean(activeProduct?.allowBackorders),
          stock: totalStock,
          variant: matching[0],
        };
      } else {
        const isOverallInStock = activeProduct?.stockStatus !== 0;
        availability[size] = {
          available: isOverallInStock,
          stock: isOverallInStock ? 99 : 0,
        };
      }
    });

    return availability;
  }, [sizes, rawVariants, selectedColor, activeProduct?.allowBackorders, activeProduct?.stockStatus]);

  // 4. Resolve active variant when both color & size are selected
  const activeVariant = useMemo(() => {
    if (rawVariants.length === 0) return null;
    return rawVariants.find((v: any) => {
      const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
      const vColor = (attrs.color || attrs.colour || "").trim().toLowerCase();
      const vSize = (attrs.size || attrs.eu_size || attrs.eu_size_for_boots || "").trim().toLowerCase();
      const colorMatch = !selectedColor || vColor === selectedColor.trim().toLowerCase();
      const sizeMatch = !selectedSize || vSize === selectedSize.trim().toLowerCase();
      return colorMatch && sizeMatch;
    });
  }, [rawVariants, selectedColor, selectedSize]);

  // 5. Dynamic image matching the selected color
  const currentImage = useMemo(() => {
    if (activeVariant?.imageUrl) return activeVariant.imageUrl;

    if (selectedColor) {
      const colObj = colors.find((c) => c.name.toLowerCase() === selectedColor.toLowerCase());
      if (colObj?.imageUrl) return colObj.imageUrl;

      if (activeProduct?.colorImages) {
        const cMap = activeProduct.colorImages instanceof Map
          ? Object.fromEntries(activeProduct.colorImages)
          : activeProduct.colorImages;
        const matchKey = Object.keys(cMap).find((k) => k.toLowerCase() === selectedColor.toLowerCase());
        if (matchKey && cMap[matchKey]) return cMap[matchKey];
      }
    }

    return product.imageUrl || activeProduct?.images?.[0]?.url || "/no-image.svg";
  }, [activeVariant, selectedColor, colors, activeProduct, product.imageUrl]);

  // 6. Pricing resolution
  const { effectivePrice, originalPrice, hasDiscount, discountPercent } = useMemo(() => {
    let base = activeProduct?.basePrice || activeProduct?.price || 0;
    let special = activeProduct?.specialPrice || 0;

    if (activeVariant) {
      if (activeVariant.price && activeVariant.price > 0) base = activeVariant.price;
      if (activeVariant.specialPrice && activeVariant.specialPrice > 0) special = activeVariant.specialPrice;
    }

    if (base === 0 && product.priceFormatted) {
      base = parseFloat(product.priceFormatted.replace(/[^0-9.]/g, "")) || 0;
    }

    const eff = (special > 0 && special < base) ? special : base;
    const orig = (special > 0 && special < base) ? base : 0;
    const discount = orig > 0 ? Math.round(((orig - eff) / orig) * 100) : 0;

    return {
      effectivePrice: eff,
      originalPrice: orig,
      hasDiscount: discount > 0,
      discountPercent: discount,
    };
  }, [activeProduct, activeVariant, product.priceFormatted]);

  // Check if current selection is out of stock
  const isSelectedOutOfStock = useMemo(() => {
    if (selectedSize && sizeAvailability[selectedSize]) {
      return !sizeAvailability[selectedSize].available;
    }
    return activeProduct?.stockStatus === 0;
  }, [selectedSize, sizeAvailability, activeProduct?.stockStatus]);

  // Keyboard ESC and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Size validation
    if (sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      toast.error("Please choose a size to continue");
      return;
    }

    // Color validation
    if (colors.length > 0 && !selectedColor) {
      toast.error("Please choose a colour to continue");
      return;
    }

    // Stock check
    if (isSelectedOutOfStock) {
      toast.error("This variant is currently out of stock");
      return;
    }

    const hasColor = Boolean(colors.length > 0 && selectedColor);
    const hasSize = Boolean(sizes.length > 0 && selectedSize);
    const variantId = activeVariant?.sku || (hasColor || hasSize ? `${selectedColor || ''}-${selectedSize || ''}` : product.id);

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      quantity,
      variantId,
      image: currentImage,
      product: {
        _id: product.id,
        id: product.id,
        name: product.name,
        basePrice: effectivePrice,
        price: effectivePrice,
        image: currentImage,
        images: [{ url: currentImage, altText: product.name }],
        slug: product.rawSlug || product.productUrl.replace(/^\//, "").split("?")[0],
        selectedColor: hasColor ? selectedColor : undefined,
        selectedSize: hasSize ? selectedSize : undefined,
        isFreeShipping: Boolean((product as any).isFreeShipping),
      } as any,
    });

    setIsAddedSuccess(true);
    toast.success(`Added ${product.name} to cart!`);

    // Open cart drawer immediately for smooth shopping flow
    openDrawer();

    setTimeout(() => {
      setIsAddedSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-neutral-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-md md:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

        {/* Header / Product Preview Bar */}
        <div className="relative p-4 sm:p-5 border-b border-neutral-100 flex items-start gap-3 sm:gap-4 bg-neutral-50/60">
          {/* Product Thumbnail */}
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 bg-white rounded-xl border border-neutral-200/80 p-1 shrink-0 overflow-hidden shadow-2xs">
            <Image
              src={currentImage}
              alt={product.name}
              fill
              sizes="80px"
              className="object-contain mix-blend-multiply p-0.5"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
              {product.category || "MOTORCYCLE GEAR"}
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug mt-0.5">
              {product.name}
            </h2>

            {/* Price Row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-brand tracking-tight">
                {effectivePrice > 0 ? formatPrice(effectivePrice) : product.priceFormatted}
              </span>
              {hasDiscount && originalPrice > 0 && (
                <>
                  <span className="text-xs text-neutral-400 line-through font-semibold">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body: Color & Size Selections */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* 1. COLOUR SELECTION */}
          {colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <span>Colour:</span>
                  <span className="text-brand font-black capitalize">
                    {selectedColor || "Select Colour"}
                  </span>
                </label>
                <span className="text-[11px] font-semibold text-neutral-400">
                  {colors.length} {colors.length === 1 ? "Option" : "Options"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {colors.map((colorObj) => {
                  const isSelected = selectedColor.trim().toLowerCase() === colorObj.name.trim().toLowerCase();
                  return (
                    <button
                      key={colorObj.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(colorObj.name);
                      }}
                      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                          : "border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700"
                      }`}
                      title={colorObj.name}
                    >
                      <span 
                        className={`w-4 h-4 rounded-full border shrink-0 transition-transform ${
                          isSelected ? "border-white ring-1 ring-white/50 scale-105" : "border-black/15 group-hover:scale-105"
                        }`}
                        style={{ background: (colorObj.background && isValidCssSwatch(colorObj.background)) ? colorObj.background : parseColorToBackground(colorObj.name) }}
                      />
                      <span className="text-xs font-bold capitalize truncate max-w-[140px]">
                        {colorObj.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SIZE SELECTION */}
          {sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <span>Size:</span>
                  <span className={`font-black ${sizeError && !selectedSize ? "text-red-500 animate-pulse" : "text-brand"}`}>
                    {selectedSize || "Please Select"}
                  </span>
                </label>
                {sizeError && !selectedSize && (
                  <span className="text-[11px] font-bold text-red-500 animate-bounce">
                    Selection required *
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {sizes.map((size) => {
                  const isSelected = selectedSize.trim().toLowerCase() === size.trim().toLowerCase();
                  const info = sizeAvailability[size];
                  const isAvailable = info ? info.available : true;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={`relative py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-1"
                          : isAvailable
                          ? sizeError
                            ? "border-amber-400 bg-amber-50/50 text-neutral-900 hover:border-slate-900"
                            : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
                          : "border-dashed border-neutral-200 bg-neutral-100 text-neutral-300 cursor-not-allowed line-through"
                      }`}
                    >
                      <span>{size}</span>
                      {!isAvailable && (
                        <span className="text-[8px] font-semibold tracking-tighter text-neutral-400 uppercase leading-none mt-0.5">
                          Sold Out
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. QUANTITY & STOCK STATUS */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Qty:
              </span>
              <div className="inline-flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 shadow-2xs">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-neutral-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="w-3.5 h-3.5 text-neutral-700" />
                </button>
                <span className="px-3 text-xs font-black font-mono text-neutral-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="p-2 hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-neutral-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  <PlusIcon className="w-3.5 h-3.5 text-neutral-700" />
                </button>
              </div>
            </div>

            {/* Live Stock Badge */}
            <div className="flex items-center gap-1.5">
              {isSelectedOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Out of Stock</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ready to Ship</span>
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/60 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isSelectedOutOfStock}
            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
              isAddedSuccess
                ? "bg-emerald-600 text-white"
                : isSelectedOutOfStock
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none"
                : sizes.length > 0 && !selectedSize
                ? "bg-neutral-900 hover:bg-neutral-800 text-white shadow-neutral-900/20"
                : "bg-banner hover:bg-orange-600 text-white shadow-orange-500/25"
            }`}
          >
            {isAddedSuccess ? (
              <>
                <CheckIcon className="w-4 h-4 stroke-[3]" />
                <span>ADDED TO CART!</span>
              </>
            ) : isSelectedOutOfStock ? (
              <span>OUT OF STOCK</span>
            ) : sizes.length > 0 && !selectedSize ? (
              <>
                <ShoppingBagIcon className="w-4 h-4" />
                <span>CHOOSE SIZE TO ADD</span>
              </>
            ) : (
              <>
                <ShoppingBagIcon className="w-4 h-4" />
                <span>ADD TO CART &bull; {formatPrice(effectivePrice * quantity)}</span>
              </>
            )}
          </button>

          {/* Direct link to PDP for sizing charts, specs, or reviews */}
          <Link
            href={product.productUrl}
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-brand transition-colors pt-0.5"
          >
            <span>View full details &amp; size chart</span>
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default QuickAddModal;
