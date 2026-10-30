"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useHomepageConfig,
  useUpdateHomepageSections,
} from "@/core/hooks/useHomepage";
import { useSyncInstagramFeed } from "@/core/hooks/useInstagramSync";
import {
  IInstagramReel,
  ISocialMediaSectionConfig,
} from "@store4riders/shared-types";
import { ReelEditorModal } from "./ReelEditorModal";
import { ImageUploadWebP } from "./ImageUploadWebP";
import { LinkSelectorInput } from "./LinkSelectorInput";
import {
  Instagram,
  Video,
  Film,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  Clock,
  Play,
  Heart,
  Loader2,
  ExternalLink,
  Save,
  Tag,
  ArrowLeft,
  RefreshCw,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export function AdminInstaReelsModule() {
  const { data: config, isLoading, isError } = useHomepageConfig();
  const updateMutation = useUpdateHomepageSections();
  const syncInstagramMutation = useSyncInstagramFeed();

  // Reel modal state
  const [isReelModalOpen, setIsReelModalOpen] = useState<boolean>(false);
  const [editingReelIdx, setEditingReelIdx] = useState<number | null>(null);

  // Local state for social media section
  const [socialState, setSocialState] = useState<ISocialMediaSectionConfig>({
    sectionTitle: "Store4Riders on Insta",
    sectionSubtitle: "",
    instagramHandle: "store4riders",
    instagramProfileUrl: "https://www.instagram.com/store4riders/",
    reels: [],
    lastSyncedAt: "",
    reelImages: [],
    bannerTop: {
      imageUrl: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/f/o/forma-viper-urban-motorcycle-riding-boots-black.jpg",
      linkUrl: "/riding-gear/motorcycle-riding-boots",
      title: "RIDING BOOTS",
      subtitle: "CE Certified Protection",
      description: "Explore track, adventure, and urban riding boots from top brands.",
      buttonText: "SHOP NOW",
      imagePosition: "center" as "top" | "center" | "bottom",
    },
    bannerBottom: {
      imageUrl: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/b/b/bbg_hybrid_tail_bag.jpg",
      linkUrl: "/motorcycle-bags-bike-luggage",
      title: "MOTORCYCLE LUGGAGE",
      subtitle: "Tail Bags, Saddlebags & Tank Bags",
      description: "Heavy-duty waterproof luggage engineered for touring and daily rides.",
      buttonText: "EXPLORE NOW",
      imagePosition: "center" as "top" | "center" | "bottom",
    },
  });

  // Populate from fetched config
  useEffect(() => {
    if (config?.sections?.socialMedia) {
      const sm = config.sections.socialMedia;
      setSocialState({
        sectionTitle: sm.sectionTitle && sm.sectionTitle.toUpperCase() !== "INSTA REELS" ? sm.sectionTitle : "Store4Riders on Insta",
        sectionSubtitle: sm.sectionSubtitle || "",
        instagramHandle: sm.instagramHandle || "store4riders",
        instagramProfileUrl:
          sm.instagramProfileUrl || "https://www.instagram.com/store4riders/",
        followersCount: sm.followersCount,
        followingCount: sm.followingCount,
        postsCount: sm.postsCount,
        profileAvatarUrl: sm.profileAvatarUrl,
        reels: Array.isArray(sm.reels) ? sm.reels : [],
        lastSyncedAt: sm.lastSyncedAt || "",
        reelImages: Array.isArray(sm.reelImages) ? sm.reelImages : [],
        bannerTop: {
          imageUrl: sm.bannerTop?.imageUrl || "",
          linkUrl: sm.bannerTop?.linkUrl || "",
          title: sm.bannerTop?.title || "",
          subtitle: sm.bannerTop?.subtitle || "",
          description: sm.bannerTop?.description || "",
          buttonText: sm.bannerTop?.buttonText || "SHOP NOW",
          imagePosition:
            (sm.bannerTop?.imagePosition as "top" | "center" | "bottom") ||
            "top",
        },
        bannerBottom: {
          imageUrl: sm.bannerBottom?.imageUrl || "",
          linkUrl: sm.bannerBottom?.linkUrl || "",
          title: sm.bannerBottom?.title || "",
          subtitle: sm.bannerBottom?.subtitle || "",
          description: sm.bannerBottom?.description || "",
          buttonText: sm.bannerBottom?.buttonText || "EXPLORE NOW",
          imagePosition:
            (sm.bannerBottom?.imagePosition as "top" | "center" | "bottom") ||
            "top",
        },
      });
    }
  }, [config]);

  // Persist helper
  const handlePersist = (
    updatedSocial: ISocialMediaSectionConfig,
    successMsg = "Changes saved successfully!"
  ) => {
    if (!config?.sections) return;
    updateMutation.mutate(
      {
        sections: {
          ...config.sections,
          socialMedia: updatedSocial,
        },
      },
      {
        onSuccess: () => {
          toast.success(successMsg);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to save changes"
          );
        },
      }
    );
  };

  // Open modal to add new reel
  const handleOpenAddReel = () => {
    setEditingReelIdx(null);
    setIsReelModalOpen(true);
  };

  // Open modal to edit existing reel
  const handleOpenEditReel = (idx: number) => {
    setEditingReelIdx(idx);
    setIsReelModalOpen(true);
  };

  // Save reel from modal
  const handleSaveReel = (savedReel: IInstagramReel) => {
    const existingReels = socialState.reels ? [...socialState.reels] : [];

    if (editingReelIdx !== null && editingReelIdx >= 0) {
      existingReels[editingReelIdx] = {
        ...existingReels[editingReelIdx],
        ...savedReel,
      };
    } else {
      savedReel.order = existingReels.length + 1;
      existingReels.unshift(savedReel);
      existingReels.forEach((r, i) => {
        r.order = i + 1;
      });
    }

    const updatedImages = existingReels
      .map((r) => r.thumbnailUrl)
      .filter(Boolean)
      .slice(0, 6);

    const updatedSocial: ISocialMediaSectionConfig = {
      ...socialState,
      reels: existingReels,
      reelImages: updatedImages.length > 0 ? updatedImages : socialState.reelImages,
    };

    setSocialState(updatedSocial);
    setIsReelModalOpen(false);
    handlePersist(
      updatedSocial,
      editingReelIdx !== null ? "Reel updated!" : "New reel added!"
    );
  };

  // Delete reel
  const handleDeleteReel = (idx: number) => {
    const existingReels = socialState.reels ? [...socialState.reels] : [];
    existingReels.splice(idx, 1);
    existingReels.forEach((r, i) => {
      r.order = i + 1;
    });

    const updatedImages = existingReels
      .map((r) => r.thumbnailUrl)
      .filter(Boolean)
      .slice(0, 6);

    const updatedSocial: ISocialMediaSectionConfig = {
      ...socialState,
      reels: existingReels,
      reelImages: updatedImages,
    };

    setSocialState(updatedSocial);
    handlePersist(updatedSocial, "Reel removed!");
  };

  // Toggle active/inactive
  const handleToggleReelActive = (idx: number) => {
    const existingReels = socialState.reels ? [...socialState.reels] : [];
    if (!existingReels[idx]) return;

    existingReels[idx] = {
      ...existingReels[idx],
      isActive: existingReels[idx].isActive === false ? true : false,
    };

    const updatedSocial: ISocialMediaSectionConfig = {
      ...socialState,
      reels: existingReels,
    };

    setSocialState(updatedSocial);
    handlePersist(
      updatedSocial,
      existingReels[idx].isActive ? "Reel activated!" : "Reel deactivated!"
    );
  };

  // Move reel order
  const handleMoveReel = (idx: number, direction: "up" | "down") => {
    const existingReels = socialState.reels ? [...socialState.reels] : [];
    if (direction === "up" && idx > 0) {
      const temp = existingReels[idx];
      existingReels[idx] = existingReels[idx - 1];
      existingReels[idx - 1] = temp;
    } else if (direction === "down" && idx < existingReels.length - 1) {
      const temp = existingReels[idx];
      existingReels[idx] = existingReels[idx + 1];
      existingReels[idx + 1] = temp;
    } else {
      return;
    }

    existingReels.forEach((r, i) => {
      r.order = i + 1;
    });

    const updatedSocial: ISocialMediaSectionConfig = {
      ...socialState,
      reels: existingReels,
    };

    setSocialState(updatedSocial);
    handlePersist(updatedSocial, "Reel sequence updated!");
  };

  // Save all changes
  const handleSaveAll = () => {
    handlePersist(socialState, "Instagram Reels settings saved successfully!");
  };

  // Sync Instagram Live handler
  const handleSyncInstagram = () => {
    syncInstagramMutation.mutate(
      {},
      {
        onSuccess: (data) => {
          if (data?.sections?.socialMedia) {
            const sm = data.sections.socialMedia;
            setSocialState({
              sectionTitle: sm.sectionTitle && sm.sectionTitle.toUpperCase() !== "INSTA REELS" ? sm.sectionTitle : "Store4Riders on Insta",
              sectionSubtitle: sm.sectionSubtitle || "",
              instagramHandle: sm.instagramHandle || "store4riders",
              instagramProfileUrl:
                sm.instagramProfileUrl || "https://www.instagram.com/store4riders/",
              followersCount: sm.followersCount,
              followingCount: sm.followingCount,
              postsCount: sm.postsCount,
              profileAvatarUrl: sm.profileAvatarUrl,
              reels: Array.isArray(sm.reels) ? sm.reels : [],
              lastSyncedAt: sm.lastSyncedAt || new Date().toISOString(),
              reelImages: Array.isArray(sm.reelImages) ? sm.reelImages : [],
              bannerTop: {
                imageUrl: sm.bannerTop?.imageUrl || "",
                linkUrl: sm.bannerTop?.linkUrl || "",
                title: sm.bannerTop?.title || "",
                subtitle: sm.bannerTop?.subtitle || "",
                description: sm.bannerTop?.description || "",
                buttonText: sm.bannerTop?.buttonText || "SHOP NOW",
                imagePosition:
                  (sm.bannerTop?.imagePosition as "top" | "center" | "bottom") ||
                  "top",
              },
              bannerBottom: {
                imageUrl: sm.bannerBottom?.imageUrl || "",
                linkUrl: sm.bannerBottom?.linkUrl || "",
                title: sm.bannerBottom?.title || "",
                subtitle: sm.bannerBottom?.subtitle || "",
                description: sm.bannerBottom?.description || "",
                buttonText: sm.bannerBottom?.buttonText || "EXPLORE NOW",
                imagePosition:
                  (sm.bannerBottom?.imagePosition as "top" | "center" | "bottom") ||
                  "top",
              },
            });
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-2" />
        <p className="text-sm font-semibold">Loading Instagram Reels configuration...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-3xl">
        <p className="font-bold">Failed to load Instagram configuration.</p>
        <p className="text-xs mt-1">Please verify your connection and permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              href="/admin/homepage/sections"
              className="hover:text-brand flex items-center gap-1 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Homepage</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">Store4Riders on Insta</span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-xs">
              <Instagram className="w-4.5 h-4.5" />
            </div>
            <span>Instagram Reels & Social Media</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage storefront video reels, live Instagram sync, real-time views, and promotional side banners.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSyncInstagram}
            disabled={syncInstagramMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {syncInstagramMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Sync Instagram Live</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddReel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-brand" />
            <span>Add New Reel</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-brand/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Instagram Profile & Account Overview Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#FF5429] bg-slate-900 shrink-0">
            {socialState.profileAvatarUrl ? (
              <Image
                src={socialState.profileAvatarUrl}
                alt="Instagram Profile"
                fill
                className="object-cover"
                sizes="48px"
                unoptimized={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50">
                <Instagram className="w-6 h-6" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 font-mono">
                @{socialState.instagramHandle}
              </span>
              <svg className="w-4 h-4 text-[#0095f6] fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4-8 8z" />
              </svg>
              <a
                href={socialState.instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-brand transition-colors"
                title="View on Instagram"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
              <span>
                <strong className="text-slate-800 font-bold">
                  {socialState.postsCount !== undefined ? socialState.postsCount : "—"}
                </strong>{" "}
                posts
              </span>
              <span>•</span>
              <span>
                <strong className="text-slate-800 font-bold">
                  {socialState.followersCount !== undefined ? socialState.followersCount : "—"}
                </strong>{" "}
                followers
              </span>
              <span>•</span>
              <span>
                <strong className="text-slate-800 font-bold">
                  {socialState.followingCount !== undefined ? socialState.followingCount : "—"}
                </strong>{" "}
                following
              </span>
            </div>
          </div>
        </div>

        {/* Live Sync Status */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-lg px-3.5 py-2 self-start md:self-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-500">Last Synced: </span>
            {socialState.lastSyncedAt ? (
              <span className="font-mono font-semibold text-slate-800">
                {new Date(socialState.lastSyncedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            ) : (
              <span className="text-amber-700 font-medium">Never synced</span>
            )}
          </div>
        </div>
      </div>

      {/* Instagram Live Sync Schedule & Rate-Limit Rules Info Banner */}
      <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 p-4 text-xs text-slate-700 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Instagram Live Sync Schedule & Rate-Limit Guidelines
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
          <div className="space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Recommended Frequency</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Fetch <strong>once every 12 to 24 hours</strong> (daily), or immediately after publishing a new Reel/Post on Instagram.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Background Auto-Sync</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              The backend automatically checks for new reels in the background <strong>every 15 to 30 minutes</strong>. Manual syncing is only needed for instant updates.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Meta API Rate Limits</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Meta caps Graph API calls at <strong>200 calls/hr</strong>. Rapid continuous clicks can trigger an API lockout (Error #32).
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Admin Sequence & Overrides</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Your manual sequence (<strong>◀ / ▶</strong>), custom titles, and active/hidden states are <strong>never overwritten</strong>. Sync only refreshes views/likes and pulls brand-new reels.
            </p>
          </div>
        </div>
      </div>

      {/* Section Headlines & Profile Link Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Tag className="w-4 h-4 text-brand" />
          <span>Section Headlines & Settings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Storefront Section Title
            </label>
            <input
              type="text"
              value={socialState.sectionTitle}
              onChange={(e) =>
                setSocialState((prev) => ({
                  ...prev,
                  sectionTitle: e.target.value,
                }))
              }
              placeholder="e.g. Store4Riders on Insta"
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand font-bold shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Section Subtitle (Optional)
            </label>
            <input
              type="text"
              value={socialState.sectionSubtitle || ""}
              onChange={(e) =>
                setSocialState((prev) => ({
                  ...prev,
                  sectionSubtitle: e.target.value,
                }))
              }
              placeholder="e.g. Catch our latest adventures"
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Instagram Profile Link
            </label>
            <input
              type="text"
              value={socialState.instagramProfileUrl}
              onChange={(e) =>
                setSocialState((prev) => ({
                  ...prev,
                  instagramProfileUrl: e.target.value,
                }))
              }
              placeholder="https://www.instagram.com/store4riders/"
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand font-medium shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Instagram Video Reels Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Film size={15} className="text-brand" />
              <span>Configured Video Reels</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono">
                {socialState.reels?.length || 0} reels
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Customers can click any reel on the storefront homepage to play it in a video modal with views counter.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddReel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Reel</span>
            </button>
          </div>
        </div>

        {/* Reels Cards Grid */}
        {(!socialState.reels || socialState.reels.length === 0) ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center bg-slate-50/50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Film className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">No Instagram Reels Configured</p>
            <p className="text-[11px] text-slate-500 max-w-sm mt-0.5 mb-3">
              Click &quot;Sync Instagram Live&quot; to fetch the latest genuine video reels automatically, or add one manually.
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {socialState.reels.map((reel, idx) => (
              <div
                key={reel._id || reel.videoUrl || idx}
                className={`group relative rounded-xl overflow-hidden border bg-white flex flex-col shadow-2xs transition-all ${
                  reel.isActive === false
                    ? "opacity-60 border-slate-200"
                    : "border-slate-300 hover:border-brand hover:shadow-xs"
                }`}
              >
                {/* Thumbnail Container (9:16 aspect ratio) */}
                <div className="relative aspect-[9/16] w-full bg-slate-900 overflow-hidden">
                  {reel.thumbnailUrl ? (
                    <Image
                      src={reel.thumbnailUrl}
                      alt={reel.title || `Reel ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="180px"
                      unoptimized={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Film className="w-6 h-6" />
                    </div>
                  )}

                  {/* Video Type Source Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white backdrop-blur-xs flex items-center gap-0.5 shadow-xs ${
                        reel.videoType === "upload"
                          ? "bg-amber-600/90"
                          : "bg-[#e1306c]/90"
                      }`}
                    >
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
                    title={
                      reel.isActive === false
                        ? "Click to Activate"
                        : "Click to Deactivate"
                    }
                    className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        reel.isActive === false ? "bg-slate-400" : "bg-emerald-400"
                      }`}
                    />
                  </button>

                  {/* Real Views & Likes Badges */}
                  <div className="absolute bottom-1.5 inset-x-2 z-10 flex items-center justify-between text-white text-[10px] font-bold drop-shadow-md">
                    <div className="flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current text-[#FF5429]" />
                      <span>{reel.views || "0"}</span>
                    </div>
                    {reel.likes && (
                      <div className="flex items-center gap-0.5 text-white/90">
                        <Heart className="w-2.5 h-2.5 fill-current text-rose-400" />
                        <span>{reel.likes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Info & Actions */}
                <div className="p-2.5 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    {reel.timestamp && (
                      <span className="text-[9.5px] font-mono text-slate-400 block mb-0.5">
                        {new Date(reel.timestamp).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <p
                      className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight mb-2"
                      title={reel.title}
                    >
                      {reel.title || "Untitled Reel"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px]">
                    {/* Reorder Arrows */}
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleMoveReel(idx, "up")}
                        disabled={idx === 0}
                        className="hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer p-0.5"
                        title="Move Earlier"
                      >
                        ◀
                      </button>
                      <span className="font-mono text-slate-500 font-semibold px-0.5">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveReel(idx, "down")}
                        disabled={
                          !socialState.reels ||
                          idx === socialState.reels.length - 1
                        }
                        className="hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer p-0.5"
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
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteReel(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Remove Reel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Promotional Banners */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={15} className="text-brand" />
            <span>Storefront Side Promotional Banners</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure the 2 promotional cards displayed alongside the reels grid on the homepage.
          </p>
        </div>

        <div className="space-y-5">
          {/* Top Promo Banner */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                <span>Top Promo Banner</span>
              </span>
              <span className="text-[10px] font-mono font-medium text-brand bg-brand/5 px-2.5 py-0.5 rounded border border-brand/20">
                ~16:7 Ratio (1200 × 500 px)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-4">
                <ImageUploadWebP
                  label="Banner Image"
                  value={socialState.bannerTop.imageUrl}
                  onChange={(url) =>
                    setSocialState((prev) => ({
                      ...prev,
                      bannerTop: { ...prev.bannerTop, imageUrl: url },
                    }))
                  }
                  aspectRatio="aspect-[16/7]"
                  recommendedDimensions="1200 × 500 px (Retina: 1920 × 800)"
                  recommendedRatio="~16:7 Banner (2.4 : 1)"
                  safeAreaNotice="Keep heads, faces & helmets in top 70%. Bottom 30% has card title."
                  hint="Auto WebP (~100–180 KB). Auto Focal Alignment preserves faces & helmets."
                />
              </div>

              <div className="md:col-span-8 space-y-3.5">
                <LinkSelectorInput
                  label="Banner Destination Link"
                  value={socialState.bannerTop.linkUrl}
                  onChange={(url) =>
                    setSocialState((prev) => ({
                      ...prev,
                      bannerTop: { ...prev.bannerTop, linkUrl: url },
                    }))
                  }
                  placeholder="e.g. /motorcycle-helmets or click 'Browse Catalog'"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Card Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={socialState.bannerTop.title || ""}
                      onChange={(e) =>
                        setSocialState((prev) => ({
                          ...prev,
                          bannerTop: { ...prev.bannerTop, title: e.target.value },
                        }))
                      }
                      placeholder="e.g. RIDING BOOTS"
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Card Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={socialState.bannerTop.description || ""}
                      onChange={(e) =>
                        setSocialState((prev) => ({
                          ...prev,
                          bannerTop: {
                            ...prev.bannerTop,
                            description: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. CE Certified Protection"
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF5429]" />
                      <span>CTA Button Text</span>
                    </label>
                    <input
                      type="text"
                      value={socialState.bannerTop.buttonText || ""}
                      onChange={(e) =>
                        setSocialState((prev) => ({
                          ...prev,
                          bannerTop: {
                            ...prev.bannerTop,
                            buttonText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. SHOP NOW"
                      className="w-full bg-white border border-[#FF5429]/40 text-[#FF5429] text-xs px-3 py-2 rounded-md focus:outline-none focus:border-[#FF5429] shadow-2xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Auto Focal Alignment
                  </label>
                  <select
                    value={socialState.bannerTop.imagePosition || "top"}
                    onChange={(e) =>
                      setSocialState((prev) => ({
                        ...prev,
                        bannerTop: {
                          ...prev.bannerTop,
                          imagePosition: e.target.value as "top" | "center" | "bottom",
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

          {/* Bottom Promo Banner */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
                <span>Bottom Promo Banner with Badge</span>
              </span>
              <span className="text-[10px] font-mono font-medium text-brand bg-brand/5 px-2.5 py-0.5 rounded border border-brand/20">
                ~16:7 Ratio (1200 × 500 px)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-4">
                <ImageUploadWebP
                  label="Banner Image"
                  value={socialState.bannerBottom.imageUrl}
                  onChange={(url) =>
                    setSocialState((prev) => ({
                      ...prev,
                      bannerBottom: { ...prev.bannerBottom, imageUrl: url },
                    }))
                  }
                  aspectRatio="aspect-[16/7]"
                  recommendedDimensions="1200 × 500 px (Retina: 1920 × 800)"
                  recommendedRatio="~16:7 Banner (2.4 : 1)"
                  safeAreaNotice="Keep heads, faces & helmets in top 70%. Bottom 30% has card title."
                  hint="Auto WebP (~100–180 KB). Auto Focal Alignment preserves faces & helmets."
                />
              </div>

              <div className="md:col-span-8 space-y-3.5">
                <LinkSelectorInput
                  label="Banner Destination Link"
                  value={socialState.bannerBottom.linkUrl}
                  onChange={(url) =>
                    setSocialState((prev) => ({
                      ...prev,
                      bannerBottom: { ...prev.bannerBottom, linkUrl: url },
                    }))
                  }
                  onAutoFill={(data) => {
                    const itemTitle = data.title;
                    const catTitle = data.categoryName;
                    if (itemTitle || catTitle) {
                      setSocialState((prev) => ({
                        ...prev,
                        bannerBottom: {
                          ...prev.bannerBottom,
                          ...(itemTitle ? { title: itemTitle } : {}),
                          ...(catTitle ? { subtitle: catTitle } : {}),
                        },
                      }));
                    }
                  }}
                  placeholder="e.g. /products?category=accessories or click 'Browse Catalog'"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Badge Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={socialState.bannerBottom.title}
                      onChange={(e) =>
                        setSocialState((prev) => ({
                          ...prev,
                          bannerBottom: {
                            ...prev.bannerBottom,
                            title: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. MOTORCYCLE LUGGAGE"
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Badge Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      value={socialState.bannerBottom.subtitle}
                      onChange={(e) =>
                        setSocialState((prev) => ({
                          ...prev,
                          bannerBottom: {
                            ...prev.bannerBottom,
                            subtitle: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. Tail Bags, Saddlebags & Tank Bags"
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-md focus:outline-none focus:border-brand shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF5429]" />
                      <span>CTA Button Text</span>
                    </label>
                    <input
                      type="text"
                      value={socialState.bannerBottom.buttonText || ""}
                      onChange={(e) =>
                        setSocialState((prev) => ({
                          ...prev,
                          bannerBottom: {
                            ...prev.bannerBottom,
                            buttonText: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. EXPLORE NOW"
                      className="w-full bg-white border border-[#FF5429]/40 text-[#FF5429] text-xs px-3 py-2 rounded-md focus:outline-none focus:border-[#FF5429] shadow-2xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Auto Focal Alignment
                  </label>
                  <select
                    value={socialState.bannerBottom.imagePosition || "top"}
                    onChange={(e) =>
                      setSocialState((prev) => ({
                        ...prev,
                        bannerBottom: {
                          ...prev.bannerBottom,
                          imagePosition: e.target.value as "top" | "center" | "bottom",
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
      </div>

      {/* Instagram Reel Editor Modal */}
      <ReelEditorModal
        isOpen={isReelModalOpen}
        onClose={() => setIsReelModalOpen(false)}
        initialReel={
          editingReelIdx !== null && socialState.reels
            ? socialState.reels[editingReelIdx] || null
            : null
        }
        onSave={handleSaveReel}
      />
    </div>
  );
}
