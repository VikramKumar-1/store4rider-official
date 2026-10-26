"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Share2,
  Plus,
  Trash2,
  Box,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useProductFormContext } from "../ProductFormContext";
import {
  AddRelatedProductsModal,
  RelationType,
} from "../modals/AddRelatedProductsModal";
import { useProductsBySkus, IBackendProduct } from "@/core/hooks/useProducts";
import { toast } from "sonner";

export function ProductRelationsTab() {
  const {
    sku: currentProductSku,
    relatedSkusInput,
    setRelatedSkusInput,
    upsellSkusInput,
    setUpsellSkusInput,
    crosssellSkusInput,
    setCrosssellSkusInput,
  } = useProductFormContext();

  // Modal State
  const [activeModalRelation, setActiveModalRelation] = useState<RelationType | null>(null);

  // Collapsible manual SKU raw editor
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  // Local cache for products added via modal before server refetch
  const [cachedProducts, setCachedProducts] = useState<Map<string, IBackendProduct>>(
    new Map()
  );

  // Parse SKUs into string arrays
  const relatedSkus = useMemo(
    () =>
      relatedSkusInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [relatedSkusInput]
  );

  const upsellSkus = useMemo(
    () =>
      upsellSkusInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [upsellSkusInput]
  );

  const crosssellSkus = useMemo(
    () =>
      crosssellSkusInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [crosssellSkusInput]
  );

  // Fetch product metadata for linked SKUs
  const { data: serverRelatedProducts, isLoading: isLoadingRelated } = useProductsBySkus(relatedSkus);
  const { data: serverUpsellProducts, isLoading: isLoadingUpsell } = useProductsBySkus(upsellSkus);
  const { data: serverCrosssellProducts, isLoading: isLoadingCrosssell } = useProductsBySkus(crosssellSkus);

  // Combine server data + local cached data so new selections show immediately
  const resolveProducts = (skus: string[], serverList?: IBackendProduct[]) => {
    const map = new Map<string, IBackendProduct>();
    serverList?.forEach((p) => map.set(p.sku, p));
    cachedProducts.forEach((p, s) => {
      if (!map.has(s)) map.set(s, p);
    });

    return skus.map((s) => {
      if (map.has(s)) return map.get(s)!;
      // Fallback placeholder if DB hasn't indexed yet
      return {
        _id: s,
        sku: s,
        name: `SKU: ${s}`,
        basePrice: 0,
        images: [],
      } as unknown as IBackendProduct;
    });
  };

  const resolvedRelated = resolveProducts(relatedSkus, serverRelatedProducts);
  const resolvedUpsell = resolveProducts(upsellSkus, serverUpsellProducts);
  const resolvedCrosssell = resolveProducts(crosssellSkus, serverCrosssellProducts);

  // Handle adding products from the Magento-style modal
  const handleAddSelected = (relation: RelationType, selected: IBackendProduct[]) => {
    if (selected.length === 0) return;

    // Cache products locally
    setCachedProducts((prev) => {
      const next = new Map(prev);
      selected.forEach((p) => next.set(p.sku, p));
      return next;
    });

    const newSkus = selected.map((p) => p.sku);

    if (relation === "related") {
      const combined = Array.from(new Set([...relatedSkus, ...newSkus]));
      setRelatedSkusInput(combined.join(", "));
      toast.success(`Added ${selected.length} Related product(s)`);
    } else if (relation === "upsell") {
      const combined = Array.from(new Set([...upsellSkus, ...newSkus]));
      setUpsellSkusInput(combined.join(", "));
      toast.success(`Added ${selected.length} Up-Sell product(s)`);
    } else if (relation === "crosssell") {
      const combined = Array.from(new Set([...crosssellSkus, ...newSkus]));
      setCrosssellSkusInput(combined.join(", "));
      toast.success(`Added ${selected.length} Cross-Sell product(s)`);
    }
  };

  // Handle removing a single product
  const handleRemoveProduct = (relation: RelationType, skuToRemove: string) => {
    if (relation === "related") {
      const filtered = relatedSkus.filter((s) => s !== skuToRemove);
      setRelatedSkusInput(filtered.join(", "));
    } else if (relation === "upsell") {
      const filtered = upsellSkus.filter((s) => s !== skuToRemove);
      setUpsellSkusInput(filtered.join(", "));
    } else if (relation === "crosssell") {
      const filtered = crosssellSkus.filter((s) => s !== skuToRemove);
      setCrosssellSkusInput(filtered.join(", "));
    }
    toast.info(`Removed SKU ${skuToRemove}`);
  };

  // Render a relation section matching Magento 2 admin layout
  const renderRelationSection = (
    title: string,
    subtitle: string,
    relation: RelationType,
    productsList: IBackendProduct[],
    isLoading: boolean,
    alreadySkus: string[]
  ) => {
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        {/* Section Top Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>{title}</span>
              {productsList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand">
                  {productsList.length}
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => setActiveModalRelation(relation)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Add {title}</span>
          </button>
        </div>

        {/* Section Grid Content */}
        {isLoading && productsList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <span>Loading linked products...</span>
          </div>
        ) : productsList.length === 0 ? (
          <div className="p-8 text-center bg-white">
            <Box size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">No {title.toLowerCase()} linked yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &quot;Add {title}&quot; to search and attach products from your store catalog.
            </p>
            <button
              type="button"
              onClick={() => setActiveModalRelation(relation)}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand bg-brand/5 hover:bg-brand/10 border border-brand/20 rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add {title}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#3E3835] text-white">
                <tr>
                  <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider w-12">#</th>
                  <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider w-14">Thumbnail</th>
                  <th className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider">Attribute Set</th>
                  <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-right">Price</th>
                  <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {productsList.map((product, idx) => {
                  const thumbnail = product.images?.[0]?.url;
                  const isProductDisabled =
                    product.status === "draft" ||
                    product.status === "archived" ||
                    product.stockStatus === 0;

                  return (
                    <tr key={product.sku || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                      <td className="px-3 py-2">
                        <div className="relative w-9 h-9 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                          {thumbnail ? (
                            <Image
                              src={thumbnail}
                              alt={product.name}
                              fill
                              sizes="36px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Box size={14} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2">
                        <p className="font-semibold text-slate-800 line-clamp-1">{product.name}</p>
                        <p className="text-[10px] text-slate-400">{product.brand || "Store4Riders"}</p>
                      </td>

                      <td className="px-4 py-2 text-slate-600">
                        {product.attributeSetCode ||
                          (product as any).attributes?.attribute_set_code ||
                          "Default"}
                      </td>

                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            !isProductDisabled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {!isProductDisabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>

                      <td className="px-4 py-2 text-slate-600 capitalize">
                        {product.productType === "configurable" ? "Configurable" : "Simple"}
                      </td>

                      <td className="px-4 py-2 font-mono text-slate-800 font-medium">
                        {product.sku}
                      </td>

                      <td className="px-4 py-2 text-right font-medium text-slate-800">
                        ₹{(product.specialPrice || product.basePrice || 0).toFixed(2)}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(relation, product.sku)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Share2 className="text-brand" size={18} />
              Related Products, Up-Sells, and Cross-Sells
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Link complementary riding gear and upgrades directly using the Magento catalog modal picker.
            </p>
          </div>
        </div>

        {/* 3 Relation Sections */}
        <div className="space-y-6 mt-6">
          {renderRelationSection(
            "Related Products",
            "Shown to customers on PDP as 'Complete Your Kit' complementary riding gear.",
            "related",
            resolvedRelated,
            isLoadingRelated,
            relatedSkus
          )}

          {renderRelationSection(
            "Up-Sell Products",
            "Offered as a higher-end or premium alternative to the product currently viewed.",
            "upsell",
            resolvedUpsell,
            isLoadingUpsell,
            upsellSkus
          )}

          {renderRelationSection(
            "Cross-Sell Products",
            "Impulse-buy products shown on the Cart page before checkout.",
            "crosssell",
            resolvedCrosssell,
            isLoadingCrosssell,
            crosssellSkus
          )}
        </div>

        {/* Collapsible Manual SKU Entry for Power Users */}
        <div className="mt-8 pt-5 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setIsManualInputOpen(!isManualInputOpen)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {isManualInputOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Manual SKU Direct Entry (Advanced / Bulk CSV Paste)</span>
          </button>

          {isManualInputOpen && (
            <div className="mt-4 space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in slide-in-from-top-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Related SKUs (comma-separated)
                </label>
                <input
                  type="text"
                  value={relatedSkusInput}
                  onChange={(e) => setRelatedSkusInput(e.target.value)}
                  placeholder="e.g. AX-VISOR-01, BL-BALAC-02"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Up-Sell SKUs (comma-separated)
                </label>
                <input
                  type="text"
                  value={upsellSkusInput}
                  onChange={(e) => setUpsellSkusInput(e.target.value)}
                  placeholder="e.g. AX-CARBON-PRO, MT-THUNDER-4"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cross-Sell SKUs (comma-separated)
                </label>
                <input
                  type="text"
                  value={crosssellSkusInput}
                  onChange={(e) => setCrosssellSkusInput(e.target.value)}
                  placeholder="e.g. RAIN-COVER-01, CHAIN-CLEAN-500"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Magento Catalog Picker Modal */}
      {activeModalRelation && (
        <AddRelatedProductsModal
          isOpen={true}
          onClose={() => setActiveModalRelation(null)}
          relationType={activeModalRelation}
          currentProductSku={currentProductSku}
          alreadyLinkedSkus={
            activeModalRelation === "related"
              ? relatedSkus
              : activeModalRelation === "upsell"
              ? upsellSkus
              : crosssellSkus
          }
          onAddSelected={(selected) => handleAddSelected(activeModalRelation, selected)}
        />
      )}
    </div>
  );
}
