"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Save,
  Eye,
  FolderTree,
  Compass,
  Luggage,
  Instagram,
  MessageSquareQuote,
  Megaphone,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Layers,
  Tag,
  ExternalLink,
  Info,
  Search,
  Upload,
  Sliders,
  Trash2,
  Plus,
  RefreshCw,
  Box,
  ChevronDown,
  ChevronUp,
  Film,
  Play,
  Video,
  Heart,
} from "lucide-react";
import { useHomepageConfig, useUpdateHomepageSections } from "@/core/hooks/useHomepage";
import { IHomepageSectionsConfig, IBrowseProductItem, IInstagramReel } from "@store4riders/shared-types";
import { ImageUploadWebP } from "./ImageUploadWebP";
import { MultiImageUploadWebP } from "./MultiImageUploadWebP";
import { LinkSelectorInput } from "./LinkSelectorInput";
import { ProductCategoryPicker, SelectedItemData } from "./ProductCategoryPicker";
import { ReelEditorModal } from "./ReelEditorModal";
import { toast } from "sonner";

export function AdminHomepageSectionsModule() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { data: config, isLoading, isError } = useHomepageConfig();
  const updateMutation = useUpdateHomepageSections();

  const [activeSection, setActiveSection] = useState<string>(tabParam || "featuredCategories");

  useEffect(() => {
    if (tabParam) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  // Section 2: Browse Riding Gear Categories Modal & Edit State
  const [pickerSlotIdx, setPickerSlotIdx] = useState<number | null>(null);
  const [editingSlotIdx, setEditingSlotIdx] = useState<number | null>(null);

  // Section 4: Instagram Reels Modal & Edit State
  const [isReelModalOpen, setIsReelModalOpen] = useState<boolean>(false);
  const [editingReelIdx, setEditingReelIdx] = useState<number | null>(null);

  // Local state for all sections (excluding Hero)
  const [sectionsState, setSectionsState] = useState<IHomepageSectionsConfig>({
    topBanner: {
      message: "MID SEASON SALE: 20% OFF ALL GEAR",
      highlightText: "LIMITED TIME",
      isEnabled: true,
      linkUrl: "/products",
    },
    featuredCategories: {
      sectionTitle: "SHOP BY CATEGORY",
      helmets: {
        title: "HELMETS",
        imageUrl: "/helmetcat.jpg",
        linkUrl: "/motorcycle-helmets",
      },
      gloves: {
        title: "GLOVES",
        imageUrl: "/glovescat.jpg",
        linkUrl: "/riding-gear/riding-gloves",
      },
      jackets: {
        title: "JACKETS",
        imageUrl: "/jacketcat.jpg",
        linkUrl: "/riding-gear/riding-jackets",
      },
    },
    browseCategories: {
      sectionTitle: "BROWSE RIDING GEAR CATEGORIES",
      items: [],
    },
    touringGear: {
      sectionTitle: "BEST GEAR FOR TOURING",
      seeMoreText: "SEE MORE",
      seeMoreLink: "/products?q=touring",
    },
    socialMedia: {
      sectionTitle: "INSTA REELS",
      sectionSubtitle: "",
      instagramHandle: "store4riders",
      instagramProfileUrl: "https://www.instagram.com/store4riders/",
      reels: [],
      reelImages: [
        "/reel-1.jpg",
        "/reel-2.jpg",
        "/reel-3.jpg",
        "/reel-4.jpg",
        "/reel-5.jpg",
        "/reel-6.jpg",
      ],
      bannerTop: {
        imageUrl: "/banner-top.jpg",
        linkUrl: "/motorcycle-helmets",
        title: "",
        subtitle: "",
        description: "",
        buttonText: "SHOP NOW",
        imagePosition: "top" as "top" | "center" | "bottom",
      },
      bannerBottom: {
        imageUrl: "/banner-bottom.jpg",
        linkUrl: "/products?category=accessories",
        title: "ACCESSORIES",
        subtitle: "Complete Your Kit",
        description: "Up to 30% Off",
        buttonText: "EXPLORE NOW",
        imagePosition: "top" as "top" | "center" | "bottom",
      },
    },
    testimonials: {
      sectionTitle: "LOVED BY 50,000+ RIDERS",
    },
  });

  // Populate from fetched config
  useEffect(() => {
    if (config?.sections) {
      setSectionsState((prev) => {
        const loadedGloves = config.sections?.featuredCategories?.gloves;
        const normalizedGlovesUrl =
          !loadedGloves?.linkUrl ||
          loadedGloves.linkUrl === "/riding-gear/motorcycle-riding-gloves" ||
          loadedGloves.linkUrl === "/riding-gloves" ||
          loadedGloves.linkUrl === "/gloves"
            ? "/riding-gear/riding-gloves"
            : loadedGloves.linkUrl;

        const loadedJackets = config.sections?.featuredCategories?.jackets;
        const normalizedJacketsUrl =
          !loadedJackets?.linkUrl ||
          loadedJackets.linkUrl === "/riding-gear/riding-jacket" ||
          loadedJackets.linkUrl === "/riding-jackets" ||
          loadedJackets.linkUrl === "/jackets"
            ? "/riding-gear/riding-jackets"
            : loadedJackets.linkUrl === "/riding-gear/protectors-armour"
              ? "/riding-gear/riding-jackets/protectors-armour"
              : loadedJackets.linkUrl;

        return {
          ...prev,
          ...config.sections,
          featuredCategories: {
            ...prev.featuredCategories,
            ...config.sections?.featuredCategories,
            gloves: {
              ...prev.featuredCategories.gloves,
              ...loadedGloves,
              linkUrl: normalizedGlovesUrl,
            },
            jackets: {
              ...prev.featuredCategories.jackets,
              ...loadedJackets,
              linkUrl: normalizedJacketsUrl,
            },
          },
          browseCategories: {
            ...prev.browseCategories,
            ...config.sections?.browseCategories,
            items: config.sections?.browseCategories?.items || [],
          },
          socialMedia: {
            ...prev.socialMedia,
            ...config.sections?.socialMedia,
            bannerTop: {
              imageUrl: config.sections?.socialMedia?.bannerTop?.imageUrl ?? prev.socialMedia?.bannerTop?.imageUrl ?? "",
              linkUrl: config.sections?.socialMedia?.bannerTop?.linkUrl ?? prev.socialMedia?.bannerTop?.linkUrl ?? "",
              title: config.sections?.socialMedia?.bannerTop?.title ?? prev.socialMedia?.bannerTop?.title ?? "",
              subtitle: config.sections?.socialMedia?.bannerTop?.subtitle ?? prev.socialMedia?.bannerTop?.subtitle ?? "",
              description: config.sections?.socialMedia?.bannerTop?.description ?? prev.socialMedia?.bannerTop?.description ?? "",
              buttonText: config.sections?.socialMedia?.bannerTop?.buttonText ?? prev.socialMedia?.bannerTop?.buttonText ?? "",
              imagePosition: (config.sections?.socialMedia?.bannerTop?.imagePosition as "top" | "center" | "bottom") ?? "top",
            },
            bannerBottom: {
              imageUrl: config.sections?.socialMedia?.bannerBottom?.imageUrl ?? prev.socialMedia?.bannerBottom?.imageUrl ?? "",
              linkUrl: config.sections?.socialMedia?.bannerBottom?.linkUrl ?? prev.socialMedia?.bannerBottom?.linkUrl ?? "",
              title: config.sections?.socialMedia?.bannerBottom?.title ?? prev.socialMedia?.bannerBottom?.title ?? "",
              subtitle: config.sections?.socialMedia?.bannerBottom?.subtitle ?? prev.socialMedia?.bannerBottom?.subtitle ?? "",
              description: config.sections?.socialMedia?.bannerBottom?.description ?? prev.socialMedia?.bannerBottom?.description ?? "",
              buttonText: config.sections?.socialMedia?.bannerBottom?.buttonText ?? prev.socialMedia?.bannerBottom?.buttonText ?? "",
              imagePosition: (config.sections?.socialMedia?.bannerBottom?.imagePosition as "top" | "center" | "bottom") ?? "top",
            },
          },
        };
      });
    }
  }, [config]);

  // 8 slots for Browse Riding Gear Categories
  const currentBrowseItems: IBrowseProductItem[] = Array.from({ length: 8 }, (_, idx) => {
    const existing = sectionsState.browseCategories.items?.[idx];
    return {
      id: existing?.id || `slot-${idx + 1}`,
      name: existing?.name || "",
      priceFormatted: existing?.priceFormatted || "",
      imageUrl: existing?.imageUrl || "",
      category: existing?.category || "RIDING GEAR",
      productUrl: existing?.productUrl || "",
      rating: existing?.rating || 4.85,
    };
  });

  const handleUpdateSlot = (idx: number, patch: Partial<IBrowseProductItem>) => {
    const updated = [...currentBrowseItems];
    updated[idx] = { ...updated[idx], ...patch };
    setSectionsState((prev) => ({
      ...prev,
      browseCategories: {
        ...prev.browseCategories,
        items: updated,
      },
    }));
  };

  const handleClearSlot = (idx: number) => {
    const updated = [...currentBrowseItems];
    updated[idx] = {
      id: `slot-${idx + 1}`,
      name: "",
      priceFormatted: "",
      imageUrl: "",
      category: "RIDING GEAR",
      productUrl: "",
      rating: 4.85,
    };
    setSectionsState((prev) => ({
      ...prev,
      browseCategories: {
        ...prev.browseCategories,
        items: updated,
      },
    }));
    if (editingSlotIdx === idx) setEditingSlotIdx(null);
    toast.success(`Cleared Slot #${idx + 1}`);
  };

  const handleClearAllSlots = () => {
    const emptySlots: IBrowseProductItem[] = Array.from({ length: 8 }, (_, idx) => ({
      id: `slot-${idx + 1}`,
      name: "",
      priceFormatted: "",
      imageUrl: "",
      category: "RIDING GEAR",
      productUrl: "",
      rating: 4.85,
    }));
    setSectionsState((prev) => ({
      ...prev,
      browseCategories: {
        ...prev.browseCategories,
        items: emptySlots,
      },
    }));
    setEditingSlotIdx(null);
    toast.success("Reset all 8 slots. Carousel will use dynamic catalog fallback.");
  };

  const handleProductSelectedForSlot = (item: SelectedItemData) => {
    if (pickerSlotIdx === null) return;
    const updated = [...currentBrowseItems];
    updated[pickerSlotIdx] = {
      id: `slot-${pickerSlotIdx + 1}`,
      name: item.title,
      priceFormatted: item.priceFormatted || "",
      imageUrl: item.imageUrl || "",
      category: item.categoryName ? item.categoryName.toUpperCase() : "RIDING GEAR",
      productUrl: item.linkUrl,
      rating: 4.85,
    };
    setSectionsState((prev) => ({
      ...prev,
      browseCategories: {
        ...prev.browseCategories,
        items: updated,
      },
    }));
    toast.success(`Assigned "${item.title}" to Slot #${pickerSlotIdx + 1}!`);
    setPickerSlotIdx(null);
  };

  // Section 4: Instagram Reels Handlers
  // Section 4: Instagram Reels Handlers with Instant Database Persistence
  const handlePersistSections = (newSections: IHomepageSectionsConfig, successMsg?: string) => {
    setSectionsState(newSections);
    updateMutation.mutate(
      { sections: newSections },
      {
        onSuccess: () => {
          if (successMsg) toast.success(successMsg);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to update homepage in database");
        },
      }
    );
  };

  const handleOpenAddReel = () => {
    setEditingReelIdx(null);
    setIsReelModalOpen(true);
  };

  const handleOpenEditReel = (idx: number) => {
    setEditingReelIdx(idx);
    setIsReelModalOpen(true);
  };

  const handleSaveReel = (savedReel: IInstagramReel) => {
    const existingReels = sectionsState.socialMedia.reels ? [...sectionsState.socialMedia.reels] : [];
    if (editingReelIdx !== null && editingReelIdx >= 0) {
      existingReels[editingReelIdx] = savedReel;
    } else {
      existingReels.push({ ...savedReel, order: existingReels.length + 1 });
    }
    const updatedImages = existingReels.map((r) => r.thumbnailUrl).filter(Boolean);
    const updatedSections: IHomepageSectionsConfig = {
      ...sectionsState,
      socialMedia: {
        ...sectionsState.socialMedia,
        reels: existingReels,
        reelImages: updatedImages.length > 0 ? updatedImages : sectionsState.socialMedia.reelImages,
      },
    };
    handlePersistSections(
      updatedSections,
      editingReelIdx !== null ? "Reel updated & saved to homepage!" : "New reel added & saved to homepage!"
    );
  };

  const handleDeleteReel = (idx: number) => {
    const existingReels = sectionsState.socialMedia.reels ? [...sectionsState.socialMedia.reels] : [];
    existingReels.splice(idx, 1);
    const updatedImages = existingReels.map((r) => r.thumbnailUrl).filter(Boolean);
    const updatedSections: IHomepageSectionsConfig = {
      ...sectionsState,
      socialMedia: {
        ...sectionsState.socialMedia,
        reels: existingReels,
        reelImages: updatedImages.length > 0 ? updatedImages : sectionsState.socialMedia.reelImages,
      },
    };
    handlePersistSections(updatedSections, "Reel removed & homepage updated!");
  };

  const handleToggleReelActive = (idx: number) => {
    const existingReels = sectionsState.socialMedia.reels ? [...sectionsState.socialMedia.reels] : [];
    if (existingReels[idx]) {
      const willBeActive = existingReels[idx].isActive === false;
      existingReels[idx] = {
        ...existingReels[idx],
        isActive: willBeActive,
      };
      const updatedSections: IHomepageSectionsConfig = {
        ...sectionsState,
        socialMedia: {
          ...sectionsState.socialMedia,
          reels: existingReels,
        },
      };
      handlePersistSections(
        updatedSections,
        willBeActive ? "Reel activated on storefront!" : "Reel deactivated from storefront!"
      );
    }
  };

  const handleMoveReel = (idx: number, direction: "up" | "down") => {
    const existingReels = sectionsState.socialMedia.reels ? [...sectionsState.socialMedia.reels] : [];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= existingReels.length) return;
    const temp = existingReels[idx];
    existingReels[idx] = existingReels[targetIdx];
    existingReels[targetIdx] = temp;
    existingReels.forEach((r, i) => {
      r.order = i + 1;
    });
    const updatedSections: IHomepageSectionsConfig = {
      ...sectionsState,
      socialMedia: {
        ...sectionsState.socialMedia,
        reels: existingReels,
      },
    };
    handlePersistSections(updatedSections, "Reels reordered & saved!");
  };

  const handleSave = () => {
    updateMutation.mutate(
      { sections: sectionsState },
      {
        onSuccess: () => {
          toast.success("Homepage sections saved successfully!");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to update homepage sections");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-2" />
        <p className="text-sm font-semibold">Loading homepage configuration...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-3xl">
        <p className="font-bold">Failed to load homepage sections configuration.</p>
        <p className="text-xs mt-1">Please verify your connection and permissions.</p>
      </div>
    );
  }

  const sectionsNav = [
    { id: "featuredCategories", name: "Shop By Category", icon: FolderTree, desc: "Masonry category tiles" },
    { id: "browseCategories", name: "Browse Riding Gear", icon: Compass, desc: "Scrollable gear carousel" },
    { id: "touringGear", name: "Best Gear for Touring", icon: Luggage, desc: "Touring gear & See More" },
    { id: "socialMedia", name: "Insta Reels & Banners", icon: Instagram, desc: "Reels grid & promo cards" },
    { id: "testimonials", name: "Customer Reviews", icon: MessageSquareQuote, desc: "Testimonial section title" },
    { id: "topBanner", name: "Top Announcement Bar", icon: Megaphone, desc: "Header discount marquee" },
  ];

  return (
    <div className="space-y-4 w-full pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-brand w-5 h-5" />
            Homepage Section Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize section headlines, category tiles, SKU links, and promotional banners across your storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-xs shadow-brand/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span>{updateMutation.isPending ? "Saving..." : "Save All Sections"}</span>
        </button>
      </div>

      {/* Main Container: Sidebar Navigator + Section Workspace */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Side: Navigation Menu */}
        <div className="w-full lg:w-60 shrink-0 bg-white border border-slate-200 rounded-lg p-2 shadow-xs space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Sections to Edit
          </p>
          {sectionsNav.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-brand text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <sec.icon size={15} className={isActive ? "text-white" : "text-slate-400"} />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{sec.name}</span>
                  <span className={`text-[10px] truncate font-normal ${isActive ? "text-white/80" : "text-slate-400"}`}>
                    {sec.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Section Editor */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* ========================================================= */}
          {/* SECTION 1: SHOP BY CATEGORY (FEATURED CATEGORIES) */}
          {/* ========================================================= */}
          {activeSection === "featuredCategories" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4 text-brand" />
                    Shop By Category (Featured Masonry Grid)
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Manage the 3 category tiles on your homepage. You can link a store category, search a specific product by SKU/Title, or upload custom artwork.
                  </p>
                </div>

                {/* Section Title Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section Heading (Title)
                  </label>
                  <input
                    type="text"
                    value={sectionsState.featuredCategories.sectionTitle}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        featuredCategories: {
                          ...prev.featuredCategories,
                          sectionTitle: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-semibold shadow-2xs"
                  />
                </div>

                {/* 3 Categories Configuration */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  {/* Tile 1: Helmets (Top Left) */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                        Tile 1 (Top Left) — {sectionsState.featuredCategories.helmets.title || "Helmets"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Aspect 16:9
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Image Upload Column */}
                      <div className="md:col-span-4 lg:col-span-4">
                        <ImageUploadWebP
                          label="Tile Image"
                          value={sectionsState.featuredCategories.helmets.imageUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              featuredCategories: {
                                ...prev.featuredCategories,
                                helmets: { ...prev.featuredCategories.helmets, imageUrl: url },
                              },
                            }))
                          }
                          aspectRatio="aspect-[16/9]"
                          recommendedDimensions="800 × 450 px"
                          recommendedRatio="16:9 Landscape"
                          safeAreaNotice="Keep helmet & brand centered; bottom 25% has the dark title pill"
                          hint="Auto WebP (~80–150 KB). Fast mobile loading, zero storage bloat."
                        />
                      </div>

                      {/* Content Column */}
                      <div className="md:col-span-8 lg:col-span-8 space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Tile Display Title
                          </label>
                          <input
                            type="text"
                            value={sectionsState.featuredCategories.helmets.title}
                            onChange={(e) =>
                              setSectionsState((prev) => ({
                                ...prev,
                                featuredCategories: {
                                  ...prev.featuredCategories,
                                  helmets: { ...prev.featuredCategories.helmets, title: e.target.value },
                                },
                              }))
                            }
                            placeholder="e.g. MOTORCYCLE HELMETS"
                            className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand font-bold uppercase shadow-2xs"
                          />
                        </div>

                        <LinkSelectorInput
                          label="Category Destination Link"
                          mode="category-only"
                          value={sectionsState.featuredCategories.helmets.linkUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              featuredCategories: {
                                ...prev.featuredCategories,
                                helmets: { ...prev.featuredCategories.helmets, linkUrl: url },
                              },
                            }))
                          }
                          onAutoFill={(data) => {
                            const newTitle = data.categoryName
                              ? data.categoryName.toUpperCase()
                              : data.title
                              ? data.title.toUpperCase()
                              : "";
                            if (newTitle) {
                              setSectionsState((prev) => ({
                                ...prev,
                                featuredCategories: {
                                  ...prev.featuredCategories,
                                  helmets: {
                                    ...prev.featuredCategories.helmets,
                                    title: newTitle,
                                  },
                                },
                              }));
                            }
                          }}
                          placeholder="/motorcycle-helmets"
                        />

                        {/* Quick Suggested Category Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Suggested Category:</span>
                          {[
                            { label: "All Helmets", url: "/motorcycle-helmets", title: "MOTORCYCLE HELMETS" },
                            { label: "Full Face", url: "/motorcycle-helmets/full-face-helmets", title: "FULL FACE HELMETS" },
                            { label: "Modular", url: "/motorcycle-helmets/modular-helmets", title: "MODULAR HELMETS" },
                            { label: "Off Road", url: "/motorcycle-helmets/off-road-helmets", title: "OFF ROAD HELMETS" },
                          ].map((cat) => (
                            <button
                              key={cat.url}
                              type="button"
                              onClick={() => {
                                setSectionsState((prev) => ({
                                  ...prev,
                                  featuredCategories: {
                                    ...prev.featuredCategories,
                                    helmets: {
                                      ...prev.featuredCategories.helmets,
                                      linkUrl: cat.url,
                                      title: cat.title,
                                    },
                                  },
                                }));
                              }}
                              className={`text-[11px] px-2.5 py-0.5 rounded border transition-all cursor-pointer ${
                                sectionsState.featuredCategories.helmets.linkUrl === cat.url
                                  ? "bg-brand text-white border-brand font-bold shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-brand hover:text-brand"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tile 2: Gloves (Bottom Left) */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                        Tile 2 (Bottom Left) — {sectionsState.featuredCategories.gloves.title || "Gloves"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Aspect 16:9
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Image Upload Column */}
                      <div className="md:col-span-4 lg:col-span-4">
                        <ImageUploadWebP
                          label="Tile Image"
                          value={sectionsState.featuredCategories.gloves.imageUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              featuredCategories: {
                                ...prev.featuredCategories,
                                gloves: { ...prev.featuredCategories.gloves, imageUrl: url },
                              },
                            }))
                          }
                          aspectRatio="aspect-[16/9]"
                          recommendedDimensions="800 × 450 px"
                          recommendedRatio="16:9 Landscape"
                          safeAreaNotice="Keep gloves & product centered; bottom 25% has the dark title pill"
                          hint="Auto WebP (~80–150 KB). Fast mobile loading, zero storage bloat."
                        />
                      </div>

                      {/* Content Column */}
                      <div className="md:col-span-8 lg:col-span-8 space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Tile Display Title
                          </label>
                          <input
                            type="text"
                            value={sectionsState.featuredCategories.gloves.title}
                            onChange={(e) =>
                              setSectionsState((prev) => ({
                                ...prev,
                                featuredCategories: {
                                  ...prev.featuredCategories,
                                  gloves: { ...prev.featuredCategories.gloves, title: e.target.value },
                                },
                              }))
                            }
                            placeholder="e.g. RIDING GLOVES"
                            className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand font-bold uppercase shadow-2xs"
                          />
                        </div>

                        <LinkSelectorInput
                          label="Category Destination Link"
                          mode="category-only"
                          value={sectionsState.featuredCategories.gloves.linkUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              featuredCategories: {
                                ...prev.featuredCategories,
                                gloves: { ...prev.featuredCategories.gloves, linkUrl: url },
                              },
                            }))
                          }
                          onAutoFill={(data) => {
                            const newTitle = data.categoryName
                              ? data.categoryName.toUpperCase()
                              : data.title
                              ? data.title.toUpperCase()
                              : "";
                            if (newTitle) {
                              setSectionsState((prev) => ({
                                ...prev,
                                featuredCategories: {
                                  ...prev.featuredCategories,
                                  gloves: {
                                    ...prev.featuredCategories.gloves,
                                    title: newTitle,
                                  },
                                },
                              }));
                            }
                          }}
                          placeholder="/riding-gear/riding-gloves"
                        />

                        {/* Quick Suggested Category Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Suggested Category:</span>
                          {[
                            { label: "All Gloves", url: "/riding-gear/riding-gloves", title: "RIDING GLOVES" },
                            { label: "Full Gauntlet", url: "/riding-gear/full-gauntlet-gloves", title: "FULL GAUNTLET GLOVES" },
                            { label: "Semi Gauntlet", url: "/riding-gear/semi-gauntlet-gloves", title: "SEMI GAUNTLET GLOVES" },
                            { label: "Short Gloves", url: "/riding-gear/short-motorbike-gloves", title: "SHORT MOTORBIKE GLOVES" },
                          ].map((cat) => (
                            <button
                              key={cat.url}
                              type="button"
                              onClick={() => {
                                setSectionsState((prev) => ({
                                  ...prev,
                                  featuredCategories: {
                                    ...prev.featuredCategories,
                                    gloves: {
                                      ...prev.featuredCategories.gloves,
                                      linkUrl: cat.url,
                                      title: cat.title,
                                    },
                                  },
                                }));
                              }}
                              className={`text-[11px] px-2.5 py-0.5 rounded border transition-all cursor-pointer ${
                                sectionsState.featuredCategories.gloves.linkUrl === cat.url
                                  ? "bg-brand text-white border-brand font-bold shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-brand hover:text-brand"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tile 3: Jackets (Full Height Right) */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                        Tile 3 (Full Height Right) — {sectionsState.featuredCategories.jackets.title || "Jackets"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Aspect 4:3
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Image Upload Column */}
                      <div className="md:col-span-4 lg:col-span-4">
                        <ImageUploadWebP
                          label="Tile Image"
                          value={sectionsState.featuredCategories.jackets.imageUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              featuredCategories: {
                                ...prev.featuredCategories,
                                jackets: { ...prev.featuredCategories.jackets, imageUrl: url },
                              },
                            }))
                          }
                          aspectRatio="aspect-[4/3]"
                          recommendedDimensions="800 × 600 px"
                          recommendedRatio="4:3 Portrait / Vertical Stack"
                          safeAreaNotice="Tall card spanning both rows. Keep rider torso centered."
                          hint="Auto WebP (~90–160 KB). Fast mobile loading, zero storage bloat."
                        />
                      </div>

                      {/* Content Column */}
                      <div className="md:col-span-8 lg:col-span-8 space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Tile Display Title
                          </label>
                          <input
                            type="text"
                            value={sectionsState.featuredCategories.jackets.title}
                            onChange={(e) =>
                              setSectionsState((prev) => ({
                                ...prev,
                                featuredCategories: {
                                  ...prev.featuredCategories,
                                  jackets: { ...prev.featuredCategories.jackets, title: e.target.value },
                                },
                              }))
                            }
                            placeholder="e.g. MOTORCYCLE JACKETS"
                            className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand font-bold uppercase shadow-2xs"
                          />
                        </div>

                        <LinkSelectorInput
                          label="Category Destination Link"
                          mode="category-only"
                          value={sectionsState.featuredCategories.jackets.linkUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              featuredCategories: {
                                ...prev.featuredCategories,
                                jackets: { ...prev.featuredCategories.jackets, linkUrl: url },
                              },
                            }))
                          }
                          onAutoFill={(data) => {
                            const newTitle = data.categoryName
                              ? data.categoryName.toUpperCase()
                              : data.title
                              ? data.title.toUpperCase()
                              : "";
                            if (newTitle) {
                              setSectionsState((prev) => ({
                                ...prev,
                                featuredCategories: {
                                  ...prev.featuredCategories,
                                  jackets: {
                                    ...prev.featuredCategories.jackets,
                                    title: newTitle,
                                  },
                                },
                              }));
                            }
                          }}
                          placeholder="/riding-gear/riding-jackets"
                        />

                        {/* Quick Suggested Category Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Suggested Category:</span>
                          {[
                            { label: "Riding Jackets", url: "/riding-gear/riding-jackets", title: "RIDING JACKETS" },
                            { label: "Protectors / Armour", url: "/riding-gear/riding-jackets/protectors-armour", title: "PROTECTORS / ARMOUR" },
                            { label: "Riding Pants", url: "/riding-gear/riding-pants", title: "RIDING PANTS" },
                            { label: "Riding Boots", url: "/riding-gear/motorcycle-riding-boots", title: "RIDING BOOTS" },
                          ].map((cat) => (
                            <button
                              key={cat.url}
                              type="button"
                              onClick={() => {
                                setSectionsState((prev) => ({
                                  ...prev,
                                  featuredCategories: {
                                    ...prev.featuredCategories,
                                    jackets: {
                                      ...prev.featuredCategories.jackets,
                                      linkUrl: cat.url,
                                      title: cat.title,
                                    },
                                  },
                                }));
                              }}
                              className={`text-[11px] px-2.5 py-0.5 rounded border transition-all cursor-pointer ${
                                sectionsState.featuredCategories.jackets.linkUrl === cat.url
                                  ? "bg-brand text-white border-brand font-bold shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-brand hover:text-brand"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Storefront Visual Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Eye size={13} className="text-brand" />
                    Live Masonry Layout Preview
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Storefront Appearance
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs max-w-md mx-auto">
                  <div className="text-center mb-2">
                    <p className="text-xs font-extrabold text-neutral-900 uppercase">
                      {sectionsState.featuredCategories.sectionTitle}
                    </p>
                    <div className="w-8 h-0.5 bg-brand mx-auto mt-0.5 rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 h-36">
                    {/* Left stack */}
                    <div className="flex flex-col gap-1.5 h-full">
                      <div className="relative flex-1 bg-slate-900 rounded overflow-hidden group">
                        <Image
                          src={sectionsState.featuredCategories.helmets.imageUrl}
                          alt="Helmets"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {sectionsState.featuredCategories.helmets.title}
                        </span>
                      </div>
                      <div className="relative flex-1 bg-slate-900 rounded overflow-hidden group">
                        <Image
                          src={sectionsState.featuredCategories.gloves.imageUrl}
                          alt="Gloves"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {sectionsState.featuredCategories.gloves.title}
                        </span>
                      </div>
                    </div>

                    {/* Right tall */}
                    <div className="relative h-full bg-slate-900 rounded overflow-hidden group">
                      <Image
                        src={sectionsState.featuredCategories.jackets.imageUrl}
                        alt="Jackets"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                        {sectionsState.featuredCategories.jackets.title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 2: BROWSE RIDING GEAR CATEGORIES */}
          {/* ========================================================= */}
          {activeSection === "browseCategories" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-brand" />
                      Browse Riding Gear Categories (8 Featured Products)
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select and assign 8 products for the scrollable carousel on the storefront, or upload custom images and details.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearAllSlots}
                      className="text-[11px] px-2.5 py-1 rounded border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer flex items-center gap-1 font-medium bg-slate-50"
                      title="Reset all slots to empty (uses automatic catalog items)"
                    >
                      <Trash2 size={12} />
                      <span>Reset All Slots</span>
                    </button>
                  </div>
                </div>

                {/* Section Title Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section Heading (Title)
                  </label>
                  <input
                    type="text"
                    value={sectionsState.browseCategories.sectionTitle}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        browseCategories: {
                          ...prev.browseCategories,
                          sectionTitle: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. BROWSE RIDING GEAR CATEGORIES"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-semibold shadow-2xs"
                  />
                </div>

                {/* Notice & Mode Info */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Info size={13} className="text-brand" />
                    <span>How Product Slots Work:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Click <strong>"Select Product from Catalog"</strong> to search any product by SKU or name — this auto-fills the product name, price, photo, and link. You can also click <strong>"Custom Upload / Edit"</strong> to upload custom photos, edit badge text, or alter prices. Empty slots gracefully fall back to trending non-helmet store items.
                  </p>
                </div>

                {/* 8 Product Slots Grid */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-brand" />
                      8 Carousel Product Slots
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {currentBrowseItems.filter((it) => it.name && (it.imageUrl || it.productUrl)).length} of 8 Assigned
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {currentBrowseItems.map((slot, idx) => {
                      const isAssigned = Boolean(slot.name && (slot.imageUrl || slot.productUrl));
                      const isEditing = editingSlotIdx === idx;

                      return (
                        <div
                          key={slot.id || idx}
                          className={`border rounded-lg p-3 space-y-2.5 transition-all shadow-2xs ${
                            isAssigned
                              ? "bg-white border-slate-300 hover:border-brand/50"
                              : "bg-slate-50/70 border-dashed border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {/* Slot Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                              Slot #{idx + 1}
                            </span>

                            {isAssigned ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Assigned
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleClearSlot(idx)}
                                  className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                                  title="Clear this slot"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                Empty (Auto)
                              </span>
                            )}
                          </div>

                          {/* Slot Display or Empty Callouts */}
                          {isAssigned && !isEditing ? (
                            <div className="space-y-2">
                              {/* Thumbnail and Details */}
                              <div className="flex items-start gap-2.5">
                                <div className="relative w-14 h-14 bg-slate-100 rounded border border-slate-200 shrink-0 overflow-hidden p-1">
                                  <Image
                                    src={slot.imageUrl || "/no-image.svg"}
                                    alt={slot.name || `Slot ${idx + 1}`}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                    {slot.category || "RIDING GEAR"}
                                  </span>
                                  <p className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5" title={slot.name}>
                                    {slot.name}
                                  </p>
                                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                    {slot.priceFormatted || "₹ 0"}
                                  </p>
                                </div>
                              </div>

                              <div className="text-[10px] text-slate-500 font-mono truncate bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                                <ExternalLink size={10} className="shrink-0 text-slate-400" />
                                <span className="truncate">{slot.productUrl || "/products"}</span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setPickerSlotIdx(idx)}
                                  className="font-bold text-brand hover:text-brand/80 flex items-center gap-1 cursor-pointer"
                                >
                                  <Search size={11} />
                                  <span>Replace</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSlotIdx(idx)}
                                  className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Sliders size={11} />
                                  <span>Custom Edit</span>
                                </button>
                              </div>
                            </div>
                          ) : isEditing ? (
                            /* Expanded Custom Editor / Upload Form */
                            <div className="space-y-2.5 bg-slate-50/50 p-2 rounded border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700 uppercase">Custom Upload & Overrides</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingSlotIdx(null)}
                                  className="text-[10px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>

                              {/* Image Upload WebP */}
                              <ImageUploadWebP
                                label="Custom Product Photo"
                                value={slot.imageUrl}
                                onChange={(url) => handleUpdateSlot(idx, { imageUrl: url })}
                                aspectRatio="aspect-square"
                                hint="Converts to WebP. 1:1 square ratio."
                              />

                              {/* Product Name */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                  Product Name
                                </label>
                                <input
                                  type="text"
                                  value={slot.name}
                                  onChange={(e) => handleUpdateSlot(idx, { name: e.target.value })}
                                  placeholder="e.g. Rynox Air GT Jacket"
                                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-2.5 py-1 rounded focus:outline-none focus:border-brand font-medium shadow-2xs"
                                />
                              </div>

                              {/* Price & Category Side-by-Side */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                    Display Price
                                  </label>
                                  <input
                                    type="text"
                                    value={slot.priceFormatted}
                                    onChange={(e) => handleUpdateSlot(idx, { priceFormatted: e.target.value })}
                                    placeholder="e.g. ₹ 5,499"
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-2 py-1 rounded focus:outline-none focus:border-brand font-bold shadow-2xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                    Badge Category
                                  </label>
                                  <input
                                    type="text"
                                    value={slot.category}
                                    onChange={(e) => handleUpdateSlot(idx, { category: e.target.value })}
                                    placeholder="e.g. JACKETS"
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-2 py-1 rounded focus:outline-none focus:border-brand font-bold uppercase shadow-2xs"
                                  />
                                </div>
                              </div>

                              {/* Quick Category Badges */}
                              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                {["JACKETS", "GLOVES", "BOOTS", "PANTS", "ARMOR", "LUGGAGE"].map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleUpdateSlot(idx, { category: cat })}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                      slot.category?.toUpperCase() === cat
                                        ? "bg-brand text-white border-brand font-bold"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-brand"
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>

                              {/* Destination Link */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                  Product Destination URL
                                </label>
                                <input
                                  type="text"
                                  value={slot.productUrl}
                                  onChange={(e) => handleUpdateSlot(idx, { productUrl: e.target.value })}
                                  placeholder="e.g. /products/rynox-air-gt"
                                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-2.5 py-1 rounded focus:outline-none focus:border-brand font-mono text-[11px] shadow-2xs"
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => setPickerSlotIdx(idx)}
                                  className="text-[10px] font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Search size={10} /> Search Catalog
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSlotIdx(null)}
                                  className="text-[10px] px-2.5 py-0.5 bg-slate-900 text-white font-medium rounded hover:bg-brand cursor-pointer transition-colors"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Completely Empty Slot State */
                            <div className="space-y-2 py-1">
                              <button
                                type="button"
                                onClick={() => setPickerSlotIdx(idx)}
                                className="w-full bg-white hover:bg-red-50/20 border border-slate-300 hover:border-brand rounded-md p-3 text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-red-50 text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Search size={13} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-800 group-hover:text-brand transition-colors">
                                  Search Store Catalog
                                </span>
                                <span className="text-[9px] text-slate-500">
                                  Auto-fill SKU, title, price, photo
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingSlotIdx(idx)}
                                className="w-full py-1 text-center text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Upload size={10} />
                                <span>Or Custom Upload</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live Carousel Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Eye size={13} className="text-brand" />
                    Live Storefront Carousel Preview
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Horizontal Scrollable Carousel
                  </span>
                </div>

                <div className="bg-neutral-100 p-4 rounded-lg border border-slate-200">
                  <div className="text-center mb-3">
                    <h3 className="text-sm font-extrabold text-neutral-900 uppercase">
                      {sectionsState.browseCategories.sectionTitle || "BROWSE RIDING GEAR CATEGORIES"}
                    </h3>
                    <div className="w-10 h-0.5 bg-brand mx-auto mt-1 rounded-full" />
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {currentBrowseItems.map((slot, idx) => {
                      const title = slot.name || `Sample Product ${idx + 1}`;
                      const price = slot.priceFormatted || "₹ 4,999";
                      const category = slot.category || "RIDING GEAR";
                      const image = slot.imageUrl || "/no-image.svg";

                      return (
                        <div
                          key={slot.id || idx}
                          className="w-[140px] shrink-0 bg-white rounded-lg p-2.5 border border-slate-200 shadow-2xs flex flex-col space-y-1.5"
                        >
                          <div className="relative aspect-square w-full bg-[#f4f4f4] rounded overflow-hidden flex items-center justify-center">
                            <Image
                              src={image}
                              alt={title}
                              fill
                              className="object-contain p-2"
                            />
                            <span className="absolute top-1 right-1 bg-[#FF5429] text-white text-[8px] font-bold px-1 rounded-full">
                              ★ 4.8
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase">{category}</span>
                            <p className="text-[11px] font-bold text-slate-900 truncate">{title}</p>
                            <p className="text-[11px] font-semibold text-neutral-700">{price}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Category Picker Modal for Catalog Search */}
              <ProductCategoryPicker
                isOpen={pickerSlotIdx !== null}
                onClose={() => setPickerSlotIdx(null)}
                onSelect={handleProductSelectedForSlot}
                mode="product-only"
                title={pickerSlotIdx !== null ? `Select Product for Slot #${pickerSlotIdx + 1}` : "Select Product"}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 3: BEST GEAR FOR TOURING */}
          {/* ========================================================= */}
          {activeSection === "touringGear" && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Luggage className="w-4 h-4 text-brand" />
                  Best Gear for Touring
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Grid showcase of touring and adventure motorcycle gear with a custom See More button.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section Heading (Title)
                  </label>
                  <input
                    type="text"
                    value={sectionsState.touringGear.sectionTitle}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        touringGear: {
                          ...prev.touringGear,
                          sectionTitle: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. BEST GEAR FOR TOURING"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-semibold shadow-2xs"
                  />
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      "See More" Button Label
                    </label>
                    <input
                      type="text"
                      value={sectionsState.touringGear.seeMoreText}
                      onChange={(e) =>
                        setSectionsState((prev) => ({
                          ...prev,
                          touringGear: {
                            ...prev.touringGear,
                            seeMoreText: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
                    />
                  </div>

                  <div>
                    <LinkSelectorInput
                      label="See More Destination Link"
                      value={sectionsState.touringGear.seeMoreLink}
                      onChange={(url) =>
                        setSectionsState((prev) => ({
                          ...prev,
                          touringGear: {
                            ...prev.touringGear,
                            seeMoreLink: url,
                          },
                        }))
                      }
                      placeholder="e.g. /products?q=touring or click 'Browse Catalog'"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 4: INSTA REELS & PROMO BANNERS */}
          {/* ========================================================= */}
          {activeSection === "socialMedia" && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-brand" />
                  Insta Reels & Side Promo Banners
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload vertical reel images (converts to WebP) and configure the 2 right-side promotional banners.
                </p>
              </div>

              {/* Section Meta Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section Heading (Title)
                  </label>
                  <input
                    type="text"
                    value={sectionsState.socialMedia.sectionTitle}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          sectionTitle: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-semibold shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Section Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={sectionsState.socialMedia.sectionSubtitle || ""}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          sectionSubtitle: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Tag @store4riders to be featured. Catch gear reviews & ride action!"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={sectionsState.socialMedia.instagramHandle || "store4riders"}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          instagramHandle: e.target.value,
                        },
                      }))
                    }
                    placeholder="store4riders"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Instagram Profile Link
                  </label>
                  <input
                    type="text"
                    value={sectionsState.socialMedia.instagramProfileUrl || "https://www.instagram.com/store4riders/"}
                    onChange={(e) =>
                      setSectionsState((prev) => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          instagramProfileUrl: e.target.value,
                        },
                      }))
                    }
                    placeholder="https://www.instagram.com/store4riders/"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Instagram Video Reels Manager */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Film size={14} className="text-brand" />
                      <span>Instagram Video Reels</span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono">
                        {sectionsState.socialMedia.reels?.length || 0} configured
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add video reels via Instagram Embed Link or direct Video File Upload (.mp4/.webm). Customers can click any reel on the storefront homepage to play it in a video modal.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePersistSections(sectionsState, "Instagram reels saved successfully!")}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Save Reels</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddReel}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all w-fit cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Reel</span>
                    </button>
                  </div>
                </div>

                {/* Reels Grid */}
                {(!sectionsState.socialMedia.reels || sectionsState.socialMedia.reels.length === 0) ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Film className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No Instagram Reels Configured</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mt-0.5 mb-3">
                      Add your Instagram reels or uploaded videos to display them on the storefront homepage with video playback modal.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddReel}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-brand text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-brand" />
                      <span>Add First Reel</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {sectionsState.socialMedia.reels.map((reel, idx) => (
                      <div
                        key={reel._id || reel.videoUrl || idx}
                        className={`group relative rounded-xl overflow-hidden border bg-white flex flex-col shadow-2xs transition-all ${
                          reel.isActive === false ? "opacity-60 border-slate-200" : "border-slate-300 hover:border-brand hover:shadow-xs"
                        }`}
                      >
                        {/* Thumbnail Container (9:16) */}
                        <div className="relative aspect-[9/16] w-full bg-slate-900 overflow-hidden">
                          {reel.thumbnailUrl ? (
                            <Image
                              src={reel.thumbnailUrl}
                              alt={reel.title || `Reel ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="160px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Film className="w-6 h-6" />
                            </div>
                          )}

                          {/* Source Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white backdrop-blur-xs flex items-center gap-0.5 shadow-xs ${
                              reel.videoType === "upload" ? "bg-amber-600/90" : "bg-[#e1306c]/90"
                            }`}>
                              {reel.videoType === "upload" ? (
                                <>
                                  <Video className="w-2.5 h-2.5" />
                                  <span>MP4</span>
                                </>
                              ) : (
                                <>
                                  <Instagram className="w-2.5 h-2.5" />
                                  <span>Embed</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Active Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleReelActive(idx)}
                            title={reel.isActive === false ? "Click to Activate" : "Click to Deactivate"}
                            className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
                          >
                            <span className={`w-2 h-2 rounded-full ${reel.isActive === false ? "bg-slate-400" : "bg-emerald-400"}`} />
                          </button>

                          {/* Views Badge */}
                          <div className="absolute bottom-1.5 left-2 z-10 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-md">
                            <Play className="w-2.5 h-2.5 fill-current text-banner" />
                            <span>{reel.views || "10K"}</span>
                          </div>
                        </div>

                        {/* Card Info & Actions */}
                        <div className="p-2 flex flex-col justify-between flex-1 bg-white">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight mb-2" title={reel.title}>
                            {reel.title || "Untitled Reel"}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                            {/* Reorder arrows */}
                            <div className="flex items-center gap-1 text-slate-400">
                              <button
                                type="button"
                                onClick={() => handleMoveReel(idx, "up")}
                                disabled={idx === 0}
                                className="hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                                title="Move Earlier"
                              >
                                ◀
                              </button>
                              <span className="font-mono text-slate-500 font-semibold">{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleMoveReel(idx, "down")}
                                disabled={!sectionsState.socialMedia.reels || idx === sectionsState.socialMedia.reels.length - 1}
                                className="hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                                title="Move Later"
                              >
                                ▶
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditReel(idx)}
                                className="p-1 text-slate-600 hover:text-brand hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                title="Edit Reel"
                              >
                                <Sliders className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReel(idx)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Remove Reel"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Banners with SKU / Category Search */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={14} className="text-brand" />
                  Side Promotional Banners
                </h3>

                <div className="space-y-4">
                  {/* Top Promo Banner */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                        Top Promo Banner
                      </span>
                      <span className="text-[10px] font-mono font-medium text-brand bg-brand/5 px-2.5 py-0.5 rounded border border-brand/20">
                        Banner ~16:7 (1200×500 px)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      <div className="md:col-span-4 lg:col-span-4">
                        <ImageUploadWebP
                          label="Banner Image"
                          value={sectionsState.socialMedia.bannerTop.imageUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              socialMedia: {
                                ...prev.socialMedia,
                                bannerTop: { ...prev.socialMedia.bannerTop, imageUrl: url },
                              },
                            }))
                          }
                          aspectRatio="aspect-[16/7]"
                          recommendedDimensions="1200 × 500 px (Retina: 1920 × 800)"
                          recommendedRatio="~16:7 Banner (2.4 : 1)"
                          safeAreaNotice="Keep heads, faces & helmets in top 70%. Bottom 30% has card title."
                          hint="Auto WebP (~100–180 KB). Auto Focal Alignment preserves faces & helmets."
                        />
                      </div>

                      <div className="md:col-span-8 lg:col-span-8 space-y-3.5">
                        <LinkSelectorInput
                          label="Banner Destination Link"
                          value={sectionsState.socialMedia.bannerTop.linkUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              socialMedia: {
                                ...prev.socialMedia,
                                bannerTop: { ...prev.socialMedia.bannerTop, linkUrl: url },
                              },
                            }))
                          }
                          placeholder="e.g. /products or click 'Browse Catalog'"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Card Title (Optional)
                            </label>
                            <input
                              type="text"
                              value={sectionsState.socialMedia.bannerTop.title || ""}
                              onChange={(e) =>
                                setSectionsState((prev) => ({
                                  ...prev,
                                  socialMedia: {
                                    ...prev.socialMedia,
                                    bannerTop: { ...prev.socialMedia.bannerTop, title: e.target.value },
                                  },
                                }))
                              }
                              placeholder="e.g. TRACK READY HELMETS"
                              className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Card Description (Optional)
                            </label>
                            <input
                              type="text"
                              value={sectionsState.socialMedia.bannerTop.description || ""}
                              onChange={(e) =>
                                setSectionsState((prev) => ({
                                  ...prev,
                                  socialMedia: {
                                    ...prev.socialMedia,
                                    bannerTop: { ...prev.socialMedia.bannerTop, description: e.target.value },
                                  },
                                }))
                              }
                              placeholder="e.g. ECE 22.06 & DOT Certified Helmets"
                              className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#FF5429]" />
                              Orange CTA Button Text (Optional)
                            </label>
                            <input
                              type="text"
                              value={sectionsState.socialMedia.bannerTop.buttonText || ""}
                              onChange={(e) =>
                                setSectionsState((prev) => ({
                                  ...prev,
                                  socialMedia: {
                                    ...prev.socialMedia,
                                    bannerTop: { ...prev.socialMedia.bannerTop, buttonText: e.target.value },
                                  },
                                }))
                              }
                              placeholder="e.g. SHOP NOW"
                              className="w-full bg-white border border-[#FF5429]/40 text-[#FF5429] text-xs px-3 py-2 rounded-md focus:outline-none focus:border-[#FF5429] focus:ring-1 focus:ring-[#FF5429]/20 shadow-2xs font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Auto Focal Alignment (Prevents Heads & Helmets from Cropping)
                          </label>
                          <select
                            value={sectionsState.socialMedia.bannerTop.imagePosition || "top"}
                            onChange={(e) =>
                              setSectionsState((prev) => ({
                                ...prev,
                                socialMedia: {
                                  ...prev.socialMedia,
                                  bannerTop: {
                                    ...prev.socialMedia.bannerTop,
                                    imagePosition: e.target.value as "top" | "center" | "bottom",
                                  },
                                },
                              }))
                            }
                            className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs font-medium"
                          >
                            <option value="top">Top Focus (Recommended — Keeps faces, heads & helmets safe)</option>
                            <option value="center">Center Focus (Standard)</option>
                            <option value="bottom">Bottom Focus</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Promo Banner with Badge Card */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                        Bottom Promo Banner with Badge Card
                      </span>
                      <span className="text-[10px] font-mono font-medium text-brand bg-brand/5 px-2.5 py-0.5 rounded border border-brand/20">
                        Banner ~16:7 (1200×500 px)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      <div className="md:col-span-4 lg:col-span-4">
                        <ImageUploadWebP
                          label="Banner Image"
                          value={sectionsState.socialMedia.bannerBottom.imageUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              socialMedia: {
                                ...prev.socialMedia,
                                bannerBottom: { ...prev.socialMedia.bannerBottom, imageUrl: url },
                              },
                            }))
                          }
                          aspectRatio="aspect-[16/7]"
                          recommendedDimensions="1200 × 500 px (Retina: 1920 × 800)"
                          recommendedRatio="~16:7 Banner (2.4 : 1)"
                          safeAreaNotice="Keep heads, faces & helmets in top 70%. Bottom 30% has card title."
                          hint="Auto WebP (~100–180 KB). Auto Focal Alignment preserves faces & helmets."
                        />
                      </div>

                      <div className="md:col-span-8 lg:col-span-8 space-y-3.5">
                        <LinkSelectorInput
                          label="Banner Destination Link"
                          value={sectionsState.socialMedia.bannerBottom.linkUrl}
                          onChange={(url) =>
                            setSectionsState((prev) => ({
                              ...prev,
                              socialMedia: {
                                ...prev.socialMedia,
                                bannerBottom: { ...prev.socialMedia.bannerBottom, linkUrl: url },
                              },
                            }))
                          }
                          onAutoFill={(data) => {
                            const itemTitle = data.title;
                            const catTitle = data.categoryName;
                            if (itemTitle || catTitle) {
                              setSectionsState((prev) => ({
                                ...prev,
                                socialMedia: {
                                  ...prev.socialMedia,
                                  bannerBottom: {
                                    ...prev.socialMedia.bannerBottom,
                                    ...(itemTitle ? { title: itemTitle } : {}),
                                    ...(catTitle ? { subtitle: catTitle } : {}),
                                  },
                                },
                              }));
                            }
                          }}
                          placeholder="e.g. /products or click 'Browse Catalog'"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Badge Title (Optional)
                            </label>
                            <input
                              type="text"
                              value={sectionsState.socialMedia.bannerBottom.title}
                              onChange={(e) =>
                                setSectionsState((prev) => ({
                                  ...prev,
                                  socialMedia: {
                                    ...prev.socialMedia,
                                    bannerBottom: { ...prev.socialMedia.bannerBottom, title: e.target.value },
                                  },
                                }))
                              }
                              placeholder="e.g. NEW ARRIVALS"
                              className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Badge Subtitle / Desc (Optional)
                            </label>
                            <input
                              type="text"
                              value={sectionsState.socialMedia.bannerBottom.subtitle}
                              onChange={(e) =>
                                setSectionsState((prev) => ({
                                  ...prev,
                                  socialMedia: {
                                    ...prev.socialMedia,
                                    bannerBottom: { ...prev.socialMedia.bannerBottom, subtitle: e.target.value },
                                  },
                                }))
                              }
                              placeholder="e.g. Explore Now"
                              className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#FF5429]" />
                              Orange CTA Button Text (Optional)
                            </label>
                            <input
                              type="text"
                              value={sectionsState.socialMedia.bannerBottom.buttonText || ""}
                              onChange={(e) =>
                                setSectionsState((prev) => ({
                                  ...prev,
                                  socialMedia: {
                                    ...prev.socialMedia,
                                    bannerBottom: { ...prev.socialMedia.bannerBottom, buttonText: e.target.value },
                                  },
                                }))
                              }
                              placeholder="e.g. EXPLORE NOW"
                              className="w-full bg-white border border-[#FF5429]/40 text-[#FF5429] text-xs px-3 py-2 rounded-md focus:outline-none focus:border-[#FF5429] focus:ring-1 focus:ring-[#FF5429]/20 shadow-2xs font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Auto Focal Alignment (Prevents Heads & Helmets from Cropping)
                          </label>
                          <select
                            value={sectionsState.socialMedia.bannerBottom.imagePosition || "top"}
                            onChange={(e) =>
                              setSectionsState((prev) => ({
                                ...prev,
                                socialMedia: {
                                  ...prev.socialMedia,
                                  bannerBottom: {
                                    ...prev.socialMedia.bannerBottom,
                                    imagePosition: e.target.value as "top" | "center" | "bottom",
                                  },
                                },
                              }))
                            }
                            className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs font-medium"
                          >
                            <option value="top">Top Focus (Recommended — Keeps faces, heads & helmets safe)</option>
                            <option value="center">Center Focus (Standard)</option>
                            <option value="bottom">Bottom Focus</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dedicated Save Action Bar for Promotional Cards */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Ready to publish?</span> Card text, titles, links, and orange CTA buttons will update on the storefront immediately.
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePersistSections(sectionsState, "Promotional banner cards saved successfully!")}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center gap-1.5 bg-[#FF5429] hover:bg-[#e0451d] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-md shadow-xs shadow-[#FF5429]/25 transition-all cursor-pointer shrink-0"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    <span>{updateMutation.isPending ? "Saving..." : "Save Promotional Cards"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 5: CUSTOMER REVIEWS */}
          {/* ========================================================= */}
          {activeSection === "testimonials" && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-brand" />
                  Customer Reviews Section
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Headline for the customer testimonials slider on your storefront.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Section Heading (Title)
                </label>
                <input
                  type="text"
                  value={sectionsState.testimonials.sectionTitle}
                  onChange={(e) =>
                    setSectionsState((prev) => ({
                      ...prev,
                      testimonials: {
                        ...prev.testimonials,
                        sectionTitle: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. LOVED BY 50,000+ RIDERS"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-semibold shadow-2xs"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <p className="font-bold flex items-center gap-1.5 mb-0.5 text-blue-800">
                  <Info size={13} className="text-blue-600" />
                  Verified Review Stream:
                </p>
                <p className="text-[11px] text-blue-700">
                  Reviews are automatically synced from live customer submissions in the Review Module and Google Reviews integration.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 6: TOP ANNOUNCEMENT BAR */}
          {/* ========================================================= */}
          {activeSection === "topBanner" && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-brand" />
                  Top Announcement Bar (Header Banner)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Marquee notice bar shown at the absolute top of the website.
                </p>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={sectionsState.topBanner.isEnabled}
                  onChange={(e) =>
                    setSectionsState((prev) => ({
                      ...prev,
                      topBanner: {
                        ...prev.topBanner,
                        isEnabled: e.target.checked,
                      },
                    }))
                  }
                  className="w-3.5 h-3.5 text-brand rounded border-slate-300 focus:ring-brand"
                />
                <label htmlFor="bannerActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Enable Announcement Bar on Storefront
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={sectionsState.topBanner.message}
                  onChange={(e) =>
                    setSectionsState((prev) => ({
                      ...prev,
                      topBanner: {
                        ...prev.topBanner,
                        message: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. MID SEASON SALE: 20% OFF ALL GEAR"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
                />
              </div>

              <div>
                <LinkSelectorInput
                  label="Announcement Destination Link"
                  value={sectionsState.topBanner.linkUrl || ""}
                  onChange={(url) =>
                    setSectionsState((prev) => ({
                      ...prev,
                      topBanner: {
                        ...prev.topBanner,
                        linkUrl: url,
                      },
                    }))
                  }
                  placeholder="e.g. /products or /sale"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instagram Reel Editor Modal */}
      <ReelEditorModal
        isOpen={isReelModalOpen}
        onClose={() => setIsReelModalOpen(false)}
        initialReel={
          editingReelIdx !== null && sectionsState.socialMedia.reels
            ? sectionsState.socialMedia.reels[editingReelIdx] || null
            : null
        }
        onSave={handleSaveReel}
      />
    </div>
  );
}
