"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Eye, Layers, DollarSign, Image as ImageIcon, 
  Sliders, GitBranch, Share2, Search, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2 
} from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import { useBrands, useCreateBrand } from "@/core/hooks/useBrands";
import { useCategoryTree } from "@/core/hooks/useCategories";
import { useCreateProduct, useUpdateProduct, useProductBySlug } from "@/core/hooks/useProducts";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";

// Re-export constants & types for backwards compatibility
export * from "./product-form/product-form.types";
export * from "./product-form/product-specs.constants";

import { 
  ProductFormProps, ProductFormTab, ProductImage, ProductVariant, 
  CustomAttribute, ProductFaq 
} from "./product-form/product-form.types";
import { 
  CATEGORY_SPEC_DEFINITIONS, detectAttributeSetFromCategory, getCategoryBlueprint 
} from "./product-form/product-specs.constants";
import { 
  ProductFormProvider, ProductFormContextType 
} from "./product-form/ProductFormContext";
import { ProductBasicTab } from "./product-form/tabs/ProductBasicTab";
import { ProductPricingTab } from "./product-form/tabs/ProductPricingTab";
import { ProductMediaTab } from "./product-form/tabs/ProductMediaTab";
import { ProductSpecsTab } from "./product-form/tabs/ProductSpecsTab";
import { ProductVariantsTab } from "./product-form/tabs/ProductVariantsTab";
import { ProductRelationsTab } from "./product-form/tabs/ProductRelationsTab";
import { ProductSeoTab } from "./product-form/tabs/ProductSeoTab";
import { QuickAddBrandModal } from "./product-form/modals/QuickAddBrandModal";
import { VariantSettingsModal } from "./product-form/modals/VariantSettingsModal";
import { ProductReviewModal } from "./product-form/modals/ProductReviewModal";

export function ProductForm({ mode, initialSlugOrId }: ProductFormProps) {
  const router = useRouter();
  const { data: brands = [] } = useBrands();
  const createBrand = useCreateBrand();
  const { data: categoryTree = [] } = useCategoryTree();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // If edit mode, load product data
  const { data: existingProduct, isLoading: isLoadingProduct } = useProductBySlug(
    mode === "edit" ? (initialSlugOrId || "") : ""
  );

  const [activeTab, setActiveTab] = useState<ProductFormTab>("basic");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form State: Basic
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandSlug, setNewBrandSlug] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const [newBrandShowInMenu, setNewBrandShowInMenu] = useState(true);
  const [newBrandMenuGroup, setNewBrandMenuGroup] = useState("Featured Brands");
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);
  const brandLogoInputRef = useRef<HTMLInputElement | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [productType, setProductType] = useState<"simple" | "configurable">("simple");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [visibility, setVisibility] = useState("Catalog, Search");
  const [countryOfManufacture, setCountryOfManufacture] = useState("");
  const [taxClassName, setTaxClassName] = useState("Taxable Goods (GST 18%)");
  const [hsnCode, setHsnCode] = useState("6506");
  const [isCustomTaxRate, setIsCustomTaxRate] = useState(false);
  const [customTaxRateInput, setCustomTaxRateInput] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "g" | "ml" | "L">("kg");
  const [isFeatured, setIsFeatured] = useState(false);
  const [showFeaturedBadge, setShowFeaturedBadge] = useState(false);
  const [isFreeShipping, setIsFreeShipping] = useState(false);

  // Pricing & Inventory
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [specialPrice, setSpecialPrice] = useState<number | "">("");
  const [specialPriceFromDate, setSpecialPriceFromDate] = useState("");
  const [specialPriceToDate, setSpecialPriceToDate] = useState("");
  const [mapPrice, setMapPrice] = useState<number | "">("");
  const [msrpPrice, setMsrpPrice] = useState<number | "">("");
  const [stockStatus, setStockStatus] = useState<number>(1);
  const [qty, setQty] = useState<number | "">(10);
  const [outOfStockQty, setOutOfStockQty] = useState<number | "">(0);
  const [minCartQty, setMinCartQty] = useState<number | "">(1);
  const [maxCartQty, setMaxCartQty] = useState<number | "">(10);
  const [notifyOnStockBelow, setNotifyOnStockBelow] = useState<number | "">(2);
  const [allowBackorders, setAllowBackorders] = useState(false);
  const [shippingFee, setShippingFee] = useState<number | "">("");

  // Images & Media
  const [images, setImages] = useState<ProductImage[]>([]);
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [manualImageAlt, setManualImageAlt] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionBadge, setCompressionBadge] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Specs & Attributes
  const [attributeSetCode, setAttributeSetCode] = useState<string>("");
  const [gender, setGender] = useState("");
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantImageModalIndex, setVariantImageModalIndex] = useState<number | null>(null);
  const [isUploadingVariantImage, setIsUploadingVariantImage] = useState(false);
  const [applyToAllSameColor, setApplyToAllSameColor] = useState(true);

  // Relations
  const [relatedSkusInput, setRelatedSkusInput] = useState("");
  const [upsellSkusInput, setUpsellSkusInput] = useState("");
  const [crosssellSkusInput, setCrosssellSkusInput] = useState("");

  // Content, SEO & FAQs
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [sizeChart, setSizeChart] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [faqs, setFaqs] = useState<ProductFaq[]>([]);

  // Apply Quick Size Preset
  const applySizePreset = (type: "volume" | "apparel" | "footwear" | "waist") => {
    let sizes: string[] = [];
    if (type === "volume") sizes = ["50ml", "100ml", "150ml", "250ml", "500ml", "1L"];
    if (type === "apparel") sizes = ["XS", "S", "M", "L", "XL", "2XL"];
    if (type === "footwear") sizes = ["EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"];
    if (type === "waist") sizes = ["30", "32", "34", "36", "38", "40"];

    const currentColor = variants[0]?.color || "Standard";
    const existingVariantPhoto = variants.find(
      (v) => (v.color || "").trim().toLowerCase() === currentColor.trim().toLowerCase() && v.imageUrl
    );

    const newVariants = sizes.map((s) => ({
      id: crypto.randomUUID(),
      sku: `${sku || "SKU"}-${s.replace(/\s+/g, "")}`,
      color: currentColor,
      size: s,
      price: basePrice || 0,
      stock: 10,
      imageUrl: existingVariantPhoto?.imageUrl,
      altText: existingVariantPhoto?.altText,
      images: existingVariantPhoto?.images,
    }));
    setVariants((prev) => [...prev, ...newVariants]);
  };

  const getAttr = (key: string): string => {
    const found = customAttributes.find((a) => a.key.toLowerCase() === key.toLowerCase());
    return found ? found.value : "";
  };

  const setAttr = (key: string, value: string) => {
    setCustomAttributes((prev) => {
      const idx = prev.findIndex((a) => a.key.toLowerCase() === key.toLowerCase());
      if (idx !== -1) {
        if (!value.trim()) {
          return prev.filter((_, i) => i !== idx);
        }
        return prev.map((item, i) => (i === idx ? { ...item, value: value.trim() } : item));
      } else {
        if (!value.trim()) return prev;
        return [...prev, { key, value: value.trim() }];
      }
    });
  };

  const selectedCategoryNode = useMemo(() => {
    if (!categoryId) return null;
    const findNode = (nodes: any[]): any => {
      for (const n of nodes) {
        if (n._id === categoryId || n.id === categoryId || n.slug === categoryId) return n;
        if (n.children && n.children.length > 0) {
          const found = findNode(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(categoryTree);
  }, [categoryId, categoryTree]);

  const categoryCustomSpecDef = useMemo(() => {
    if (!selectedCategoryNode?.specDefinitions || selectedCategoryNode.specDefinitions.length === 0) return null;
    return {
      title: `${selectedCategoryNode.name} Specifications & Attributes`,
      subtitle: `Custom category specifications defined in Categories Manager`,
      icon: "sliders" as const,
      fields: selectedCategoryNode.specDefinitions,
    };
  }, [selectedCategoryNode]);

  const activeTemplate = useMemo(() => {
    if (attributeSetCode && attributeSetCode !== "Default" && attributeSetCode !== "CategoryCustom") {
      const lower = attributeSetCode.toLowerCase();
      if (lower.includes("helmet")) return "Helmets";
      if (lower.includes("jacket") || lower.includes("pant") || lower.includes("suit") || lower.includes("racing")) return "Jackets";
      if (lower.includes("glove")) return "Gloves";
      if (lower.includes("boot")) return "Boots";
      if (lower.includes("saddle") || lower.includes("tank") || lower.includes("hydration") || lower.includes("bag")) return "Saddle Bag";
      if (lower.includes("lube") || lower.includes("liquid") || lower.includes("care") || lower.includes("oil")) return "Chain Lubes / Liquids";
      if (lower.includes("spare") || lower.includes("exhaust") || lower.includes("cover")) return "Spares, Accessories, Exhausts";
      if (lower.includes("communicator") || lower.includes("gadget")) return "Communicator";
      return attributeSetCode;
    }
    if (categoryCustomSpecDef) {
      return "CategoryCustom";
    }
    return detectAttributeSetFromCategory(categoryId, categoryTree);
  }, [attributeSetCode, categoryId, categoryTree, categoryCustomSpecDef]);

  const activeBlueprint = useMemo(() => {
    return getCategoryBlueprint(categoryId, categoryTree);
  }, [categoryId, categoryTree]);

  const applyCategoryBlueprint = (catIdOrSlug: string) => {
    if (!catIdOrSlug) return;
    const blueprint = getCategoryBlueprint(catIdOrSlug, categoryTree);
    if (blueprint) {
      setAttributeSetCode(blueprint.attributeSet);
      setHsnCode(blueprint.defaultHsn);
      setTaxClassName(blueprint.defaultTaxClass);
      setIsCustomTaxRate(false);
      setWeightUnit(blueprint.defaultWeightUnit);
      toast.success(`⚡ Blueprint Applied: ${blueprint.description}`);
    }
  };

  const currentSpecDefinition = useMemo(() => {
    if ((attributeSetCode === "CategoryCustom" || !attributeSetCode) && categoryCustomSpecDef) {
      return categoryCustomSpecDef;
    }
    return CATEGORY_SPEC_DEFINITIONS[activeTemplate] || categoryCustomSpecDef || CATEGORY_SPEC_DEFINITIONS.Default;
  }, [attributeSetCode, categoryCustomSpecDef, activeTemplate]);

  const activeCategoryFieldKeys = useMemo(() => {
    if (!currentSpecDefinition) return [];
    return currentSpecDefinition.fields.map((f: any) => f.key.toLowerCase());
  }, [currentSpecDefinition]);

  const additionalCustomAttributes = useMemo(() => {
    return customAttributes.filter(
      (a) => !activeCategoryFieldKeys.includes(a.key.trim().toLowerCase())
    );
  }, [customAttributes, activeCategoryFieldKeys]);

  // Populate data on edit mode
  useEffect(() => {
    if (mode === "edit" && existingProduct) {
      setName(existingProduct.name || "");
      setSku(existingProduct.sku || "");
      setSlug(existingProduct.slug || "");
      setBrand(existingProduct.brand || "");
      setCategoryId(existingProduct.categoryId || "");
      const slugs = Array.isArray(existingProduct.categorySlugs) && existingProduct.categorySlugs.length > 0
        ? existingProduct.categorySlugs
        : (existingProduct.categoryId ? [existingProduct.categoryId] : []);
      setCategorySlugs(slugs);
      setProductType((existingProduct.productType as any) || "simple");
      setStatus(existingProduct.status || "published");
      setVisibility(existingProduct.visibility || "Catalog, Search");
      setCountryOfManufacture(existingProduct.countryOfManufacture || "");
      const loadedTax = existingProduct.taxClassName || "Taxable Goods (GST 18%)";
      setTaxClassName(loadedTax);
      const taxMatch = loadedTax.match(/(\d+(?:\.\d+)?)/);
      if (taxMatch) {
        const rate = parseFloat(taxMatch[1]);
        const standardRates = [0, 5, 12, 18, 28];
        if (!standardRates.includes(rate)) {
          setIsCustomTaxRate(true);
          setCustomTaxRateInput(rate);
        } else {
          setIsCustomTaxRate(false);
        }
      }
      setHsnCode(existingProduct.hsnCode || "6506");
      setWeight(existingProduct.weight ?? "");
      setIsFeatured(Boolean(existingProduct.isFeatured));
      setShowFeaturedBadge(
        Boolean(
          (existingProduct as any).showFeaturedBadge ||
          (existingProduct.attributes as any)?.show_featured_badge === "true" ||
          (existingProduct.attributes as any)?.show_featured_badge === true
        )
      );
      setIsFreeShipping(Boolean(existingProduct.isFreeShipping));

      setBasePrice(existingProduct.basePrice ?? "");
      setSpecialPrice(existingProduct.specialPrice ?? "");
      setSpecialPriceFromDate(
        existingProduct.specialPriceFromDate
          ? new Date(existingProduct.specialPriceFromDate).toISOString().split("T")[0]
          : ""
      );
      setSpecialPriceToDate(
        existingProduct.specialPriceToDate
          ? new Date(existingProduct.specialPriceToDate).toISOString().split("T")[0]
          : ""
      );
      setMapPrice(existingProduct.mapPrice ?? "");
      setMsrpPrice(existingProduct.msrpPrice ?? "");
      setStockStatus(existingProduct.stockStatus ?? 1);
      setQty(existingProduct.qty ?? 10);
      setOutOfStockQty(existingProduct.outOfStockQty ?? 0);
      setMinCartQty(existingProduct.minCartQty ?? 1);
      setMaxCartQty(existingProduct.maxCartQty ?? 10);
      setNotifyOnStockBelow(existingProduct.notifyOnStockBelow ?? 2);
      setAllowBackorders(Boolean(existingProduct.allowBackorders));

      // Images
      if (existingProduct.images && existingProduct.images.length > 0) {
        setImages(
          existingProduct.images.map((img: any, i: number) => ({
            id: img.id || crypto.randomUUID(),
            url: img.url,
            altText: img.altText || "",
            isBase: i === 0,
          }))
        );
      }
      setVideoUrl(existingProduct.videoUrl || "");

      // Attributes
      if (existingProduct.attributes) {
        const raw = existingProduct.attributes;
        const mappedAttrs: Array<{ key: string; value: string }> = [];
        Object.entries(raw).forEach(([k, v]) => {
          if (k === "attribute_set_code") setAttributeSetCode(String(v));
          else if (k === "gender") setGender(String(v));
          else if (k === "weight_unit") setWeightUnit(v as any);
          else if (k === "ship_cost") setShippingFee(Number(v) || "");
          else if (k !== "brand") {
            mappedAttrs.push({ key: k, value: String(v) });
          }
        });
        setCustomAttributes(mappedAttrs);
      }

      // Variants
      if (existingProduct.variants && existingProduct.variants.length > 0) {
        setVariants(
          existingProduct.variants.map((v: any) => {
            const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
            const colorVal = attrs.color || attrs.colour || "";
            const sizeVal = attrs.size || attrs.eu_size || attrs.eu_size_for_boots || "";
            let primaryVariantImg = v.imageUrl || v.images?.[0]?.url || "";

            // Check colorImages fallback if variant has no direct imageUrl
            if (!primaryVariantImg && colorVal && existingProduct.colorImages) {
              const cMap = existingProduct.colorImages instanceof Map
                ? Object.fromEntries(existingProduct.colorImages)
                : existingProduct.colorImages;
              const matchKey = Object.keys(cMap).find((k) => k.trim().toLowerCase() === colorVal.trim().toLowerCase());
              if (matchKey && cMap[matchKey]) {
                primaryVariantImg = cMap[matchKey];
              }
            }

            const primaryVariantAlt =
              v.altText ||
              v.images?.[0]?.altText ||
              (primaryVariantImg && colorVal ? `${existingProduct.name} - ${colorVal}` : "");

            return {
              id: v.id || crypto.randomUUID(),
              sku: v.sku,
              color: colorVal,
              size: sizeVal,
              price: v.price ?? existingProduct.basePrice,
              specialPrice: v.specialPrice ?? "",
              stock: v.stock ?? 0,
              imageUrl: primaryVariantImg,
              altText: primaryVariantAlt,
              weight: v.weight ?? "",
              status: v.status || "enabled",
              visibility: v.visibility || "Catalog, Search",
              images: (v.images && v.images.length > 0)
                ? v.images
                : (primaryVariantImg ? [{ id: crypto.randomUUID(), url: primaryVariantImg, altText: primaryVariantAlt }] : []),
            };
          })
        );
      }

      // Relations
      setRelatedSkusInput(existingProduct.relatedSkus?.join(", ") || "");
      setUpsellSkusInput(existingProduct.upsellSkus?.join(", ") || "");
      setCrosssellSkusInput(existingProduct.crosssellSkus?.join(", ") || "");

      // Content & SEO
      setShortDescription(existingProduct.shortDescription || "");
      setDescription(existingProduct.description || "");
      setSizeChart(existingProduct.sizeChart || existingProduct.size_chart || "");
      setMetaTitle(existingProduct.metaTitle || "");
      setMetaDescription(existingProduct.metaDescription || "");
      setMetaKeywords(existingProduct.metaKeywords || "");
      setFaqs(existingProduct.faqs || []);
    }
  }, [mode, existingProduct]);

  // Gallery handlers
  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsCompressing(true);
    setCompressionBadge("Compressing to WebP (0.85 quality)...");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { file: webpFile, originalSize, compressedSize } = await compressImageToWebP(file, 1600, 0.85);
        const origKb = Math.round(originalSize / 1024);
        const compKb = Math.round(compressedSize / 1024);
        setCompressionBadge(`Compressed: ${origKb} KB ➔ ${compKb} KB (WebP). Uploading...`);

        let finalUrl = "";
        try {
          finalUrl = await uploadImageToS3(webpFile);
        } catch (uploadErr) {
          finalUrl = URL.createObjectURL(webpFile);
          toast.warning("S3 credentials inactive. Image saved with temporary URL.");
        }

        setImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            url: finalUrl,
            altText: name || file.name.replace(/\.[^/.]+$/, ""),
            isBase: prev.length === 0,
          },
        ]);
      }
      toast.success("Images compressed and attached successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process images");
    } finally {
      setIsCompressing(false);
      setCompressionBadge(null);
    }
  };

  const handleManualAddImage = () => {
    if (!manualImageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: manualImageUrl.trim(),
        altText: manualImageAlt.trim() || name,
        isBase: prev.length === 0,
      },
    ]);
    setManualImageUrl("");
    setManualImageAlt("");
    toast.success("Image URL added to gallery");
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length > 0 && !updated.some((img) => img.isBase)) {
        updated[0].isBase = true;
      }
      return updated;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isBase: i === index,
      }))
    );
  };

  const handleDragStart = (idx: number) => setDraggedImgIdx(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetIdx: number) => {
    if (draggedImgIdx === null || draggedImgIdx === targetIdx) return;
    setImages((prev) => {
      const next = [...prev];
      const item = next.splice(draggedImgIdx, 1)[0];
      next.splice(targetIdx, 0, item);
      return next;
    });
    setDraggedImgIdx(null);
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetColor?: string) => {
    if (variantImageModalIndex === null) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVariantImage(true);
    try {
      const { file: webpFile } = await compressImageToWebP(file, 1200, 0.85);
      let finalUrl = "";
      try {
        finalUrl = await uploadImageToS3(webpFile);
      } catch (uploadErr) {
        finalUrl = URL.createObjectURL(webpFile);
      }

      setVariants((prev) =>
        prev.map((v, i) => {
          if (i === variantImageModalIndex) return { ...v, imageUrl: finalUrl };
          if (applyToAllSameColor && targetColor && v.color.toLowerCase() === targetColor.toLowerCase()) {
            return { ...v, imageUrl: finalUrl };
          }
          return v;
        })
      );
      toast.success(
        applyToAllSameColor && targetColor
          ? `Variant image updated for all "${targetColor}" variants!`
          : "Variant image updated!"
      );
      setVariantImageModalIndex(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload variant image");
    } finally {
      setIsUploadingVariantImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Validation of mandatory fields required for saving to DB
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!name.trim()) missing.push("Product Name");
    if (!sku.trim()) missing.push("SKU");
    if (!categoryId.trim()) missing.push("Primary Category");
    if (basePrice === "" || Number(basePrice) <= 0) missing.push("Base Price (> ₹0)");
    return missing;
  }, [name, sku, categoryId, basePrice]);

  const isFormValid = missingFields.length === 0;

  // 7-Step Navigation Definitions
  const tabItems: Array<{
    id: ProductFormTab;
    label: string;
    shortLabel: string;
    icon: any;
    badge?: string;
    isCompleted: boolean;
    isRequired?: boolean;
  }> = [
    {
      id: "basic",
      label: "Basic Info",
      shortLabel: "Basic",
      icon: Layers,
      isCompleted: Boolean(name.trim().length >= 2 && sku.trim().length >= 3 && categoryId.trim()),
      isRequired: true,
    },
    {
      id: "pricing",
      label: "Pricing & Stock",
      shortLabel: "Pricing",
      icon: DollarSign,
      isCompleted: Boolean(basePrice !== "" && Number(basePrice) > 0),
      isRequired: true,
    },
    {
      id: "media",
      label: "Images & Media",
      shortLabel: "Media",
      icon: ImageIcon,
      badge: images.length ? String(images.length) : undefined,
      isCompleted: images.length > 0,
    },
    {
      id: "specs",
      label: "Technical Specs",
      shortLabel: "Specs",
      icon: Sliders,
      badge: customAttributes.length ? String(customAttributes.length) : undefined,
      isCompleted: customAttributes.length > 0,
    },
    {
      id: "variants",
      label: "Variants Matrix",
      shortLabel: "Variants",
      icon: GitBranch,
      badge: variants.length ? String(variants.length) : undefined,
      isCompleted: variants.length > 0,
    },
    {
      id: "relations",
      label: "Kit & Cross-Sell",
      shortLabel: "Relations",
      icon: Share2,
      isCompleted: Boolean(relatedSkusInput.trim() || upsellSkusInput.trim() || crosssellSkusInput.trim()),
    },
    {
      id: "seo",
      label: "SEO & Content",
      shortLabel: "SEO",
      icon: Search,
      isCompleted: Boolean(metaTitle.trim() || metaDescription.trim() || description.trim() || shortDescription.trim()),
    },
  ];

  const currentTabIndex = tabItems.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? tabItems[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < tabItems.length - 1 ? tabItems[currentTabIndex + 1] : null;

  const handleTabChange = (targetTab: ProductFormTab) => {
    setActiveTab(targetTab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextTab = () => {
    if (nextTab) {
      handleTabChange(nextTab.id);
    }
  };

  const handlePrevTab = () => {
    if (prevTab) {
      handleTabChange(prevTab.id);
    }
  };

  // Submit Handler: Validates and opens Final Review Modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required (Step 1: Basic Info)");
      handleTabChange("basic");
      return;
    }

    if (!sku.trim()) {
      toast.error("Product SKU is required (Step 1: Basic Info)");
      handleTabChange("basic");
      return;
    }

    if (!categoryId.trim()) {
      toast.error("Primary category is required (Step 1: Basic Info)");
      handleTabChange("basic");
      return;
    }

    if (basePrice === "" || Number(basePrice) <= 0) {
      toast.error("Valid base price (> ₹0) is required (Step 2: Pricing & Stock)");
      handleTabChange("pricing");
      return;
    }

    setIsReviewModalOpen(true);
  };

  // Final Execution: Called when Admin clicks "Confirm & Save Product" in Review Modal
  const executeSave = async () => {
    if (!name.trim() || !sku.trim() || !categoryId.trim() || basePrice === "" || Number(basePrice) <= 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
      setIsReviewModalOpen(false);
      return;
    }

    // Build Attributes Map
    const attributesMap: Record<string, string> = {};
    if (attributeSetCode) attributesMap.attribute_set_code = attributeSetCode;
    if (brand) attributesMap.brand = brand;
    if (gender) attributesMap.gender = gender;
    if (weightUnit) attributesMap.weight_unit = weightUnit;

    if (shippingFee !== "" && Number(shippingFee) > 0) {
      attributesMap.ship_cost = String(shippingFee);
    }

    customAttributes.forEach((attr) => {
      const k = attr.key.trim();
      const v = attr.value.trim();
      if (k && v) {
        attributesMap[k] = v;
      }
    });

    if (isFeatured && showFeaturedBadge) {
      attributesMap.show_featured_badge = "true";
    }

    const sortedImages = [...images].sort((a, b) => (b.isBase ? 1 : 0) - (a.isBase ? 1 : 0));

    // 1. Build colorImages map for storefront color swatches & gallery navigation
    const colorImagesMap: Record<string, string> = {};
    variants.forEach((v) => {
      const vImg = v.imageUrl || v.images?.[0]?.url;
      if (v.color && vImg) {
        colorImagesMap[v.color.trim()] = vImg;
      }
    });

    // 2. Synchronize variant images into the parent gallery with their Alt Text
    const parentImageUrls = new Set(sortedImages.map((img) => img.url));
    const mergedParentImages = [...sortedImages];

    variants.forEach((v) => {
      const vUrl = v.imageUrl || v.images?.[0]?.url;
      const vAlt =
        v.images?.[0]?.altText ||
        v.altText ||
        (v.color ? `${name.trim()} - ${v.color.trim()}` : `${name.trim()} Variant`);

      if (vUrl && !parentImageUrls.has(vUrl)) {
        parentImageUrls.add(vUrl);
        mergedParentImages.push({
          id: crypto.randomUUID(),
          url: vUrl,
          altText: vAlt,
          isBase: false,
        });
      }
    });

    const payload: any = {
      name: name.trim(),
      sku: sku.trim(),
      slug: slug.trim() || undefined,
      brand: brand.trim() || undefined,
      categoryId: categoryId || undefined,
      categorySlugs: categorySlugs.length > 0 ? categorySlugs : (categoryId ? [categoryId] : undefined),
      attributeSetCode,
      productType,
      status,
      visibility,
      countryOfManufacture: countryOfManufacture.trim() || undefined,
      taxClassName: taxClassName.trim() || undefined,
      hsnCode: hsnCode.trim() || undefined,
      weight: weight !== "" ? Number(weight) : undefined,
      isFeatured,
      showFeaturedBadge: Boolean(isFeatured && showFeaturedBadge),
      isFreeShipping: (shippingFee !== "" && Number(shippingFee) > 0) ? false : isFreeShipping,

      basePrice: Number(basePrice),
      specialPrice: specialPrice !== "" ? Number(specialPrice) : undefined,
      specialPriceFromDate: specialPriceFromDate ? new Date(specialPriceFromDate) : undefined,
      specialPriceToDate: specialPriceToDate ? new Date(specialPriceToDate) : undefined,
      mapPrice: mapPrice !== "" ? Number(mapPrice) : undefined,
      msrpPrice: msrpPrice !== "" ? Number(msrpPrice) : undefined,
      stockStatus: Number(stockStatus),
      qty: qty !== "" ? Number(qty) : 0,
      outOfStockQty: outOfStockQty !== "" ? Number(outOfStockQty) : undefined,
      minCartQty: minCartQty !== "" ? Number(minCartQty) : undefined,
      maxCartQty: maxCartQty !== "" ? Number(maxCartQty) : undefined,
      notifyOnStockBelow: notifyOnStockBelow !== "" ? Number(notifyOnStockBelow) : undefined,
      allowBackorders,

      images: mergedParentImages.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || name.trim(),
      })),
      colorImages: Object.keys(colorImagesMap).length > 0 ? colorImagesMap : undefined,
      videoUrl: videoUrl.trim() || undefined,

      attributes: attributesMap,
      gender: gender.trim() || undefined,

      variants: variants.map((v) => {
        const vUrl = v.imageUrl || v.images?.[0]?.url;
        const vAlt =
          v.images?.[0]?.altText ||
          v.altText ||
          (v.color ? `${name.trim()} - ${v.color.trim()}` : `${name.trim()} Variant`);

        const vImages = (v.images && v.images.length > 0)
          ? v.images.map((img: any) => ({
              id: img.id || crypto.randomUUID(),
              url: img.url,
              altText: img.altText || vAlt,
            }))
          : (vUrl ? [{ id: crypto.randomUUID(), url: vUrl, altText: vAlt }] : []);

        return {
          id: v.id || crypto.randomUUID(),
          sku: v.sku.trim(),
          price: v.price !== "" ? Number(v.price) : Number(basePrice),
          specialPrice: v.specialPrice !== "" && v.specialPrice !== undefined ? Number(v.specialPrice) : undefined,
          stock: v.stock !== "" ? Number(v.stock) : 0,
          imageUrl: vUrl,
          altText: vAlt,
          weight: v.weight !== "" && v.weight !== undefined ? Number(v.weight) : undefined,
          status: v.status || "enabled",
          visibility: v.visibility || "Catalog, Search",
          images: vImages,
          attributes: {
            ...(v.color ? { color: v.color.trim() } : {}),
            ...(v.size ? { size: v.size.trim() } : {}),
          },
        };
      }),

      relatedSkus: relatedSkusInput.split(",").map((s) => s.trim()).filter(Boolean),
      upsellSkus: upsellSkusInput.split(",").map((s) => s.trim()).filter(Boolean),
      crosssellSkus: crosssellSkusInput.split(",").map((s) => s.trim()).filter(Boolean),

      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || "",
      sizeChart: sizeChart.trim() || undefined,

      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaKeywords: metaKeywords.trim() || undefined,
      faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
    };

    try {
      if (mode === "create") {
        await createProduct.mutateAsync(payload);
        toast.success("Product created successfully!");
        setIsReviewModalOpen(false);
        router.push("/admin/products");
      } else {
        const id = existingProduct?._id || initialSlugOrId;
        if (!id) throw new Error("Product ID not found for update");
        await updateProduct.mutateAsync({ id, data: payload });
        toast.success("Product updated successfully!");
        setIsReviewModalOpen(false);
        router.push("/admin/products");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to save product");
    }
  };

  const contextValue: ProductFormContextType = {
    mode,
    initialSlugOrId,
    existingProduct,
    isLoadingProduct,
    activeTab,
    setActiveTab,
    isReviewModalOpen,
    setIsReviewModalOpen,

    // Basic
    name,
    setName,
    sku,
    setSku,
    slug,
    setSlug,
    brand,
    setBrand,
    isAddBrandOpen,
    setIsAddBrandOpen,
    newBrandName,
    setNewBrandName,
    newBrandSlug,
    setNewBrandSlug,
    newBrandLogo,
    setNewBrandLogo,
    newBrandShowInMenu,
    setNewBrandShowInMenu,
    newBrandMenuGroup,
    setNewBrandMenuGroup,
    isUploadingBrandLogo,
    setIsUploadingBrandLogo,
    brandLogoInputRef,
    brands,
    createBrand,
    categoryId,
    setCategoryId,
    categorySlugs,
    setCategorySlugs,
    applyCategoryBlueprint,
    activeBlueprint,
    categoryTree,
    productType,
    setProductType,
    status,
    setStatus,
    visibility,
    setVisibility,
    countryOfManufacture,
    setCountryOfManufacture,
    taxClassName,
    setTaxClassName,
    hsnCode,
    setHsnCode,
    isCustomTaxRate,
    setIsCustomTaxRate,
    customTaxRateInput,
    setCustomTaxRateInput,
    weight,
    setWeight,
    weightUnit,
    setWeightUnit,
    isFeatured,
    setIsFeatured,
    showFeaturedBadge,
    setShowFeaturedBadge,
    isFreeShipping,
    setIsFreeShipping,

    // Pricing
    basePrice,
    setBasePrice,
    specialPrice,
    setSpecialPrice,
    specialPriceFromDate,
    setSpecialPriceFromDate,
    specialPriceToDate,
    setSpecialPriceToDate,
    mapPrice,
    setMapPrice,
    msrpPrice,
    setMsrpPrice,
    stockStatus,
    setStockStatus,
    qty,
    setQty,
    outOfStockQty,
    setOutOfStockQty,
    minCartQty,
    setMinCartQty,
    maxCartQty,
    setMaxCartQty,
    notifyOnStockBelow,
    setNotifyOnStockBelow,
    allowBackorders,
    setAllowBackorders,
    shippingFee,
    setShippingFee,

    // Media
    images,
    setImages,
    draggedImgIdx,
    setDraggedImgIdx,
    manualImageUrl,
    setManualImageUrl,
    manualImageAlt,
    setManualImageAlt,
    isCompressing,
    setIsCompressing,
    compressionBadge,
    setCompressionBadge,
    videoUrl,
    setVideoUrl,
    handleUploadImages,
    handleManualAddImage,
    handleRemoveImage,
    setPrimaryImage,
    handleDragStart,
    handleDragOver,
    handleDrop,

    // Specs
    attributeSetCode,
    setAttributeSetCode,
    activeTemplate,
    currentSpecDefinition,
    categoryCustomSpecDef,
    selectedCategoryNode,
    gender,
    setGender,
    customAttributes,
    setCustomAttributes,
    getAttr,
    setAttr,
    additionalCustomAttributes,

    // Variants
    variants,
    setVariants,
    variantImageModalIndex,
    setVariantImageModalIndex,
    isUploadingVariantImage,
    setIsUploadingVariantImage,
    applyToAllSameColor,
    setApplyToAllSameColor,
    applySizePreset,
    handleVariantImageUpload,

    // Relations
    relatedSkusInput,
    setRelatedSkusInput,
    upsellSkusInput,
    setUpsellSkusInput,
    crosssellSkusInput,
    setCrosssellSkusInput,

    // SEO
    shortDescription,
    setShortDescription,
    description,
    setDescription,
    sizeChart,
    setSizeChart,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    metaKeywords,
    setMetaKeywords,
    faqs,
    setFaqs,

    // Step Wizard & Validation status
    isFormValid,
    missingFields,
    handleNextTab,
    handlePrevTab,
    handleTabChange,

    // Actions
    handleSubmit,
    executeSave,
    createProduct,
    updateProduct,
  };

  if (mode === "edit" && isLoadingProduct) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium">Loading product details...</p>
      </div>
    );
  }

  return (
    <ProductFormProvider value={contextValue}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-28">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/products"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">
                  {mode === "create" ? "Add New Product" : `Edit Product: ${existingProduct?.name || ""}`}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Step {currentTabIndex + 1} of 7: {tabItems[currentTabIndex]?.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Enterprise Catalog Manager — Step-by-step product specifications & gear attributes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {prevTab && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevTab}
                className="text-xs flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </Button>
            )}
            {nextTab && (
              <Button
                type="button"
                size="sm"
                onClick={handleNextTab}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Preview Card & Review</span>
              <span className="sm:hidden">Preview</span>
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createProduct.isPending || updateProduct.isPending}
              title={
                !isFormValid
                  ? `Please fill in required fields to save: ${missingFields.join(", ")}`
                  : mode === "create" ? "Save & publish product" : "Update product"
              }
              className={`font-semibold px-4 text-xs flex items-center space-x-1.5 shadow-sm transition-all ${
                isFormValid && !createProduct.isPending && !updateProduct.isPending
                  ? "bg-brand hover:bg-brand/90 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
              }`}
            >
              <Save size={14} />
              <span>
                {createProduct.isPending || updateProduct.isPending
                  ? "Saving..."
                  : mode === "create"
                  ? "Save Product"
                  : "Update Product"}
              </span>
            </Button>
          </div>
        </div>

        {/* 7-Tab Navigation Bar with Step Numbers & Completion Indicators */}
        <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-px">
          {tabItems.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCompleted = tab.isCompleted;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "border-brand text-brand bg-brand/5 rounded-t-lg font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold transition-colors ${
                    isActive
                      ? "bg-brand text-white shadow-sm"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {isCompleted && !isActive ? "✓" : idx + 1}
                </span>
                <Icon size={14} className={isActive ? "text-brand" : "text-slate-400"} />
                <span>{tab.label}</span>
                {tab.isRequired && !isCompleted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" title="Required step" />
                )}
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {activeTab === "basic" && <ProductBasicTab />}
        {activeTab === "pricing" && <ProductPricingTab />}
        {activeTab === "media" && <ProductMediaTab />}
        {activeTab === "specs" && <ProductSpecsTab />}
        {activeTab === "variants" && <ProductVariantsTab />}
        {activeTab === "relations" && <ProductRelationsTab />}
        {activeTab === "seo" && <ProductSeoTab />}

        {/* In-page Step Navigation Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            {prevTab ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevTab}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Back: {prevTab.label}</span>
              </Button>
            ) : (
              <span className="text-xs text-slate-400 italic">Step 1 of 7: Start with basic info</span>
            )}
          </div>

          <div className="flex items-center">
            {!isFormValid ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span>
                  Required to Save: <strong className="font-semibold">{missingFields.join(", ")}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span className="font-medium">All required details complete! Ready to save.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {nextTab ? (
              <Button
                type="button"
                onClick={handleNextTab}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Next: {nextTab.label}</span>
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!isFormValid || createProduct.isPending || updateProduct.isPending}
                className={`font-semibold px-5 text-xs flex items-center gap-1.5 shadow-sm ${
                  isFormValid && !createProduct.isPending && !updateProduct.isPending
                    ? "bg-brand hover:bg-brand/90 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                }`}
              >
                <Save size={15} />
                <span>Review & Save Product</span>
              </Button>
            )}
          </div>
        </div>

        {/* Floating Save & Wizard Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 sm:px-8 z-30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${isFormValid ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
              <span className="truncate max-w-[180px] sm:max-w-xs">
                Editing: <strong className="text-slate-800">{name || "Untitled Product"}</strong>
              </span>
            </div>

            {!isFormValid ? (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertCircle size={13} className="text-amber-600 shrink-0" />
                <span>Missing: <strong className="font-semibold">{missingFields.join(", ")}</strong></span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span className="font-medium">Ready to save</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              className="text-xs"
            >
              Cancel
            </Button>

            {prevTab && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevTab}
                className="text-xs flex items-center gap-1 text-slate-700 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Back: {prevTab.shortLabel}</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}

            {nextTab && (
              <Button
                type="button"
                onClick={handleNextTab}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 text-xs flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <span>Next: {nextTab.shortLabel}</span>
                <ChevronRight size={14} />
              </Button>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || createProduct.isPending || updateProduct.isPending}
              title={
                !isFormValid
                  ? `Please fill in required fields to save: ${missingFields.join(", ")}`
                  : mode === "create" ? "Save & publish product" : "Update product"
              }
              className={`font-semibold px-5 text-xs flex items-center gap-1.5 shadow-md transition-all ${
                isFormValid && !createProduct.isPending && !updateProduct.isPending
                  ? "bg-brand hover:bg-brand/90 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
              }`}
            >
              <Save size={14} />
              <span>
                {createProduct.isPending || updateProduct.isPending
                  ? "Saving..."
                  : mode === "create"
                  ? "Save Product"
                  : "Update Product"}
              </span>
            </Button>
          </div>
        </div>

        {/* Modals */}
        <QuickAddBrandModal />
        <VariantSettingsModal />
        <ProductReviewModal />
      </form>
    </ProductFormProvider>
  );
}
export default ProductForm;
