"use client";

import React from "react";
import { Eye, Save, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { StorefrontCardPreview } from "@/modules/admin/components/StorefrontCardPreview";
import { useProductFormContext } from "../ProductFormContext";

export function ProductReviewModal() {
  const {
    isReviewModalOpen,
    setIsReviewModalOpen,
    isFormValid,
    missingFields,
    mode,
    name,
    sku,
    brand,
    basePrice,
    specialPrice,
    images,
    variants,
    setPrimaryImage,
    setVariantImageModalIndex,
    categoryId,
    createProduct,
    updateProduct,
    executeSave,
  } = useProductFormContext();

  return (
    <Modal
      isOpen={isReviewModalOpen}
      onClose={() => setIsReviewModalOpen(false)}
      title="Final Review & Confirm Save"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">
              {mode === "create"
                ? "Reviewing new product before publishing:"
                : "Reviewing product changes before saving:"}{" "}
              <strong>{name || "Untitled"}</strong>
            </span>
          </div>
          <span className="text-slate-500 font-mono">SKU: {sku}</span>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Eye size={14} className="text-brand" />
            Customer Storefront Card Appearance
          </h4>
          <StorefrontCardPreview
            name={name}
            brand={brand}
            basePrice={basePrice}
            specialPrice={specialPrice}
            images={images}
            variants={variants}
            onSetPrimaryImage={(idx) => setPrimaryImage(idx)}
            onSelectColorPhoto={(targetColor) => {
              const idx = variants.findIndex(
                (v) => (v.color || "Standard").toLowerCase() === targetColor.toLowerCase()
              );
              if (idx !== -1) {
                setVariantImageModalIndex(idx);
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
            <span className="font-semibold text-slate-800 truncate block">
              {categoryId || "Default Catalog"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pricing</span>
            <span className="font-semibold text-slate-800 block">
              ₹{basePrice || 0} {specialPrice ? `(Sale: ₹${specialPrice})` : ""}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Gallery Photos</span>
            <span className="font-semibold text-slate-800 block">
              {images.length} photos {images.some((i) => i.isBase) ? "✓ Primary Set" : "⚠ Auto First"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Variants</span>
            <span className="font-semibold text-slate-800 block">{variants.length} items</span>
          </div>
        </div>

        {!isFormValid && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              Cannot save yet. Please fill in the following required fields:{" "}
              <strong>{missingFields.join(", ")}</strong>
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsReviewModalOpen(false)}
            className="text-xs"
          >
            Back to Editing
          </Button>
          <Button
            type="button"
            disabled={!isFormValid || createProduct.isPending || updateProduct.isPending}
            onClick={executeSave}
            title={
              !isFormValid
                ? `Required fields missing: ${missingFields.join(", ")}`
                : "Confirm and save product"
            }
            className={`font-semibold px-6 text-xs flex items-center gap-2 shadow-md transition-all ${
              createProduct.isPending || updateProduct.isPending
                ? "bg-brand text-white opacity-95 cursor-wait shadow-sm"
                : isFormValid
                ? "bg-brand hover:bg-brand/90 text-white cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
            }`}
          >
            {createProduct.isPending || updateProduct.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="font-bold text-white">
                  {mode === "create" ? "Publishing Product..." : "Updating Product..."}
                </span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>
                  {mode === "create"
                    ? "Confirm & Publish Product"
                    : "Confirm & Save Changes"}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
