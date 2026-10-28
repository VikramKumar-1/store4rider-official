"use client";

import React, { createContext, useContext, Dispatch, SetStateAction, RefObject } from "react";
import { ProductFormTab, ProductImage, ProductVariant, CustomAttribute, ProductFaq } from "./product-form.types";

export interface ProductFormContextType {
  mode: "create" | "edit";
  initialSlugOrId?: string;
  existingProduct?: any;
  isLoadingProduct: boolean;
  activeTab: ProductFormTab;
  setActiveTab: (tab: ProductFormTab) => void;
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;

  // Basic Info
  name: string;
  setName: (v: string) => void;
  sku: string;
  setSku: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  isAddBrandOpen: boolean;
  setIsAddBrandOpen: (v: boolean) => void;
  newBrandName: string;
  setNewBrandName: (v: string) => void;
  newBrandSlug: string;
  setNewBrandSlug: (v: string) => void;
  newBrandLogo: string;
  setNewBrandLogo: (v: string) => void;
  newBrandShowInMenu: boolean;
  setNewBrandShowInMenu: (v: boolean) => void;
  newBrandMenuGroup: string;
  setNewBrandMenuGroup: (v: string) => void;
  isUploadingBrandLogo: boolean;
  setIsUploadingBrandLogo: (v: boolean) => void;
  brandLogoInputRef: RefObject<HTMLInputElement | null>;
  brands: any[];
  createBrand: any;
  categoryId: string;
  setCategoryId: (v: string) => void;
  categorySlugs: string[];
  setCategorySlugs: Dispatch<SetStateAction<string[]>>;
  applyCategoryBlueprint: (catIdOrSlug: string) => void;
  activeBlueprint?: any;
  categoryTree: any[];
  productType: "simple" | "configurable";
  setProductType: (v: "simple" | "configurable") => void;
  status: "draft" | "published" | "archived";
  setStatus: (v: "draft" | "published" | "archived") => void;
  visibility: string;
  setVisibility: (v: string) => void;
  countryOfManufacture: string;
  setCountryOfManufacture: (v: string) => void;
  taxClassName: string;
  setTaxClassName: (v: string) => void;
  hsnCode: string;
  setHsnCode: (v: string) => void;
  isCustomTaxRate: boolean;
  setIsCustomTaxRate: (v: boolean) => void;
  customTaxRateInput: number | "";
  setCustomTaxRateInput: (v: number | "") => void;
  weight: number | "";
  setWeight: (v: number | "") => void;
  weightUnit: "kg" | "g" | "ml" | "L";
  setWeightUnit: (v: "kg" | "g" | "ml" | "L") => void;
  isFeatured: boolean;
  setIsFeatured: (v: boolean) => void;
  showFeaturedBadge: boolean;
  setShowFeaturedBadge: (v: boolean) => void;
  isFreeShipping: boolean;
  setIsFreeShipping: (v: boolean) => void;

  // Pricing & Stock
  basePrice: number | "";
  setBasePrice: (v: number | "") => void;
  specialPrice: number | "";
  setSpecialPrice: (v: number | "") => void;
  specialPriceFromDate: string;
  setSpecialPriceFromDate: (v: string) => void;
  specialPriceToDate: string;
  setSpecialPriceToDate: (v: string) => void;
  mapPrice: number | "";
  setMapPrice: (v: number | "") => void;
  msrpPrice: number | "";
  setMsrpPrice: (v: number | "") => void;
  stockStatus: number;
  setStockStatus: (v: number) => void;
  qty: number | "";
  setQty: (v: number | "") => void;
  outOfStockQty: number | "";
  setOutOfStockQty: (v: number | "") => void;
  minCartQty: number | "";
  setMinCartQty: (v: number | "") => void;
  maxCartQty: number | "";
  setMaxCartQty: (v: number | "") => void;
  notifyOnStockBelow: number | "";
  setNotifyOnStockBelow: (v: number | "") => void;
  allowBackorders: boolean;
  setAllowBackorders: (v: boolean) => void;
  shippingFee: number | "";
  setShippingFee: (v: number | "") => void;

  // Media
  images: ProductImage[];
  setImages: Dispatch<SetStateAction<ProductImage[]>>;
  draggedImgIdx: number | null;
  setDraggedImgIdx: (v: number | null) => void;
  manualImageUrl: string;
  setManualImageUrl: (v: string) => void;
  manualImageAlt: string;
  setManualImageAlt: (v: string) => void;
  isCompressing: boolean;
  setIsCompressing: (v: boolean) => void;
  compressionBadge: string | null;
  setCompressionBadge: (v: string | null) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  handleUploadImages: (files: FileList | null) => Promise<void>;
  handleManualAddImage: () => void;
  handleRemoveImage: (idx: number) => void;
  setPrimaryImage: (idx: number) => void;
  handleDragStart: (idx: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (targetIdx: number) => void;

  // Specs
  attributeSetCode: string;
  setAttributeSetCode: (v: string) => void;
  activeTemplate: string;
  currentSpecDefinition: any;
  categoryCustomSpecDef?: any;
  selectedCategoryNode?: any;
  gender: string;
  setGender: (v: string) => void;
  customAttributes: CustomAttribute[];
  setCustomAttributes: Dispatch<SetStateAction<CustomAttribute[]>>;
  getAttr: (key: string) => string;
  setAttr: (key: string, value: string) => void;
  additionalCustomAttributes: CustomAttribute[];

  // Variants
  variants: ProductVariant[];
  setVariants: Dispatch<SetStateAction<ProductVariant[]>>;
  colorSwatches: Record<string, string>;
  setColorSwatches: Dispatch<SetStateAction<Record<string, string>>>;
  variantImageModalIndex: number | null;
  setVariantImageModalIndex: (v: number | null) => void;
  isUploadingVariantImage: boolean;
  setIsUploadingVariantImage: (v: boolean) => void;
  applyToAllSameColor: boolean;
  setApplyToAllSameColor: (v: boolean) => void;
  applySizePreset: (type: "volume" | "apparel" | "footwear" | "waist") => void;
  handleVariantImageUpload: (e: React.ChangeEvent<HTMLInputElement>, targetColor?: string) => Promise<void>;

  // Relations
  relatedSkusInput: string;
  setRelatedSkusInput: (v: string) => void;
  upsellSkusInput: string;
  setUpsellSkusInput: (v: string) => void;
  crosssellSkusInput: string;
  setCrosssellSkusInput: (v: string) => void;

  // SEO & Content
  shortDescription: string;
  setShortDescription: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  sizeChart: string;
  setSizeChart: (v: string) => void;
  metaTitle: string;
  setMetaTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
  metaKeywords: string;
  setMetaKeywords: (v: string) => void;
  faqs: ProductFaq[];
  setFaqs: Dispatch<SetStateAction<ProductFaq[]>>;

  // Step Wizard & Validation status
  isFormValid: boolean;
  missingFields: string[];
  handleNextTab: () => void;
  handlePrevTab: () => void;
  handleTabChange: (targetTab: ProductFormTab) => void;

  // Actions
  handleSubmit: (e: React.FormEvent) => void;
  executeSave: () => Promise<void>;
  createProduct: any;
  updateProduct: any;
}

const ProductFormContext = createContext<ProductFormContextType | null>(null);

export function ProductFormProvider({
  value,
  children,
}: {
  value: ProductFormContextType;
  children: React.ReactNode;
}) {
  return <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>;
}

export function useProductFormContext(): ProductFormContextType {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error("useProductFormContext must be used within a ProductFormProvider");
  }
  return context;
}
