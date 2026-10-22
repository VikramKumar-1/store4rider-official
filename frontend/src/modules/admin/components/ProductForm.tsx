"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Eye, Layers, DollarSign, Image as ImageIcon, 
  Sliders, GitBranch, Share2, Search 
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
  CATEGORY_SPEC_DEFINITIONS, detectAttributeSetFromCategory 
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
    const newVariants = sizes.map((s) => ({
      id: crypto.randomUUID(),
      sku: `${sku || "SKU"}-${s.replace(/\s+/g, "")}`,
      color: currentColor,
      size: s,
      price: basePrice || 0,
      stock: 10,
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

  const activeTemplate = useMemo(() => {
    if (attributeSetCode && attributeSetCode !== "Default") {
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
    return detectAttributeSetFromCategory(categoryId, categoryTree);
  }, [attributeSetCode, categoryId, categoryTree]);

  const currentSpecDefinition = CATEGORY_SPEC_DEFINITIONS[activeTemplate] || CATEGORY_SPEC_DEFINITIONS.Default;

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
          existingProduct.variants.map((v: any) => ({
            id: v.id || crypto.randomUUID(),
            sku: v.sku,
            color: v.attributes?.color || "",
            size: v.attributes?.size || "",
            price: v.price ?? existingProduct.basePrice,
            specialPrice: v.specialPrice ?? "",
            stock: v.stock ?? 0,
            imageUrl: v.imageUrl || "",
            weight: v.weight ?? "",
            status: v.status || "enabled",
            visibility: v.visibility || "Catalog, Search",
            images: v.images || [],
          }))
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

  // Submit Handler: Validates and opens Final Review Modal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      setActiveTab("basic");
      return;
    }

    if (!sku.trim()) {
      toast.error("Product SKU is required");
      setActiveTab("basic");
      return;
    }

    if (basePrice === "" || Number(basePrice) < 0) {
      toast.error("Valid base price is required");
      setActiveTab("pricing");
      return;
    }

    setIsReviewModalOpen(true);
  };

  // Final Execution: Called when Admin clicks "Confirm & Save Product" in Review Modal
  const executeSave = async () => {
    if (!name.trim() || !sku.trim() || basePrice === "" || Number(basePrice) < 0) {
      toast.error("Please fill in all required fields (Name, SKU, Base Price)");
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

    const payload: any = {
      name: name.trim(),
      sku: sku.trim(),
      slug: slug.trim() || undefined,
      brand: brand.trim() || undefined,
      categoryId: categoryId || undefined,
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

      images: sortedImages.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText || name,
      })),
      videoUrl: videoUrl.trim() || undefined,

      attributes: attributesMap,
      gender: gender.trim() || undefined,

      variants: variants.map((v) => ({
        id: v.id || crypto.randomUUID(),
        sku: v.sku.trim(),
        price: v.price !== "" ? Number(v.price) : Number(basePrice),
        specialPrice: v.specialPrice !== "" && v.specialPrice !== undefined ? Number(v.specialPrice) : undefined,
        stock: v.stock !== "" ? Number(v.stock) : 0,
        imageUrl: v.imageUrl,
        weight: v.weight !== "" && v.weight !== undefined ? Number(v.weight) : undefined,
        status: v.status || "enabled",
        visibility: v.visibility || "Catalog, Search",
        images: v.images || [],
        attributes: {
          ...(v.color ? { color: v.color } : {}),
          ...(v.size ? { size: v.size } : {}),
        },
      })),

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

  const tabItems: Array<{
    id: ProductFormTab;
    label: string;
    icon: any;
    badge?: string;
  }> = [
    { id: "basic", label: "Basic Info", icon: Layers },
    { id: "pricing", label: "Pricing & Stock", icon: DollarSign },
    { id: "media", label: "Images & Media", icon: ImageIcon, badge: images.length ? String(images.length) : undefined },
    { id: "specs", label: "Technical Specs", icon: Sliders, badge: customAttributes.length ? String(customAttributes.length) : undefined },
    { id: "variants", label: "Variants Matrix", icon: GitBranch, badge: variants.length ? String(variants.length) : undefined },
    { id: "relations", label: "Kit & Cross-Sell", icon: Share2 },
    { id: "seo", label: "SEO & Content", icon: Search },
  ];

  return (
    <ProductFormProvider value={contextValue}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-24">
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
              <h1 className="text-2xl font-bold text-slate-900">
                {mode === "create" ? "Add New Product" : `Edit Product: ${existingProduct?.name || ""}`}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Enterprise Catalog Manager — Complete product specifications & multi-category gear attributes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
            >
              <Eye size={14} />
              <span>Preview Card & Review</span>
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
              className="bg-brand hover:bg-brand/90 text-white font-semibold px-5 text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Save size={14} />
              <span>{createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}</span>
            </Button>
          </div>
        </div>

        {/* 7-Tab Navigation Bar */}
        <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-px">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ProductFormTab)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "border-brand text-brand bg-brand/5 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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

        {/* Floating Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-8 z-30 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>
              Editing: <strong className="text-slate-800">{name || "Untitled Product"}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
              className="bg-brand hover:bg-brand/90 text-white font-semibold px-6 text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save size={14} />
              <span>{createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}</span>
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
