"use client";

import React from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { useProductFormContext } from "../ProductFormContext";

export function QuickAddBrandModal() {
  const {
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
    createBrand,
    setBrand,
  } = useProductFormContext();

  return (
    <Modal isOpen={isAddBrandOpen} onClose={() => setIsAddBrandOpen(false)} title="Add New Brand">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
          <input
            type="text"
            value={newBrandName}
            onChange={(e) => {
              setNewBrandName(e.target.value);
              setNewBrandSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")
              );
            }}
            placeholder="e.g. AGV, Alpinestars, Rynox, Motul"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Slug / URL Key *</label>
          <input
            type="text"
            value={newBrandSlug}
            onChange={(e) => setNewBrandSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="e.g. agv, alpinestars, rynox"
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand focus:outline-none"
          />
        </div>

        {/* Logo upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Brand Logo (WebP Compressed)
          </label>
          <div className="flex items-center gap-3">
            {newBrandLogo ? (
              <div className="relative w-12 h-12 bg-slate-50 border border-slate-200 rounded p-1">
                <Image src={newBrandLogo} alt="Logo" fill sizes="48px" className="object-contain" />
                <button
                  type="button"
                  onClick={() => setNewBrandLogo("")}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
            ) : null}
            <input
              type="file"
              ref={brandLogoInputRef}
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setIsUploadingBrandLogo(true);
                  toast.info("Compressing brand logo to WebP...");
                  const compressed = await compressImageToWebP(f, 800, 0.9);
                  const url = await uploadImageToS3(compressed.file);
                  setNewBrandLogo(url);
                  toast.success("Logo uploaded!");
                } catch (err: any) {
                  toast.error(err.message || "Failed to upload logo");
                } finally {
                  setIsUploadingBrandLogo(false);
                  if (brandLogoInputRef.current) brandLogoInputRef.current.value = "";
                }
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => brandLogoInputRef.current?.click()}
              disabled={isUploadingBrandLogo}
              className="text-xs"
            >
              <Upload size={12} className="mr-1" />
              {isUploadingBrandLogo ? "Uploading..." : "Upload Logo (Auto-WebP)"}
            </Button>
          </div>
          <input
            type="text"
            value={newBrandLogo}
            onChange={(e) => setNewBrandLogo(e.target.value)}
            placeholder="Or paste image URL (https://...)"
            className="w-full mt-2 px-3 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none"
          />
        </div>

        {/* Submenu Display Controls */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newBrandShowInMenu}
              onChange={(e) => setNewBrandShowInMenu(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Show in Top Menu (&apos;Shop By Brand&apos;)
              </span>
              <p className="text-[10px] text-slate-500">
                Turn on to display this brand in the website header dropdown
              </p>
            </div>
          </label>
          {newBrandShowInMenu && (
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                Brand Section in Menu
              </label>
              <p className="text-[10px] text-slate-400 mb-1.5">
                Select which column this brand belongs to:
              </p>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {[
                  "Helmet Brands",
                  "Riding Gear",
                  "Luggage & Accessories",
                  "Parts & Performance",
                  "Care & Maintenance",
                  "Featured Brands",
                ].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setNewBrandMenuGroup(grp)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium border cursor-pointer transition-colors ${
                      newBrandMenuGroup === grp
                        ? "bg-brand text-white border-brand"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newBrandMenuGroup}
                onChange={(e) => setNewBrandMenuGroup(e.target.value)}
                placeholder="Or enter custom group"
                className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddBrandOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!newBrandName || isUploadingBrandLogo || createBrand.isPending}
            onClick={async () => {
              if (!newBrandName.trim()) {
                toast.error("Please provide a brand name");
                return;
              }
              const slugToUse =
                newBrandSlug.trim() || newBrandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              try {
                await createBrand.mutateAsync({
                  name: newBrandName.trim(),
                  slug: slugToUse,
                  logo: newBrandLogo || undefined,
                  showInMenu: newBrandShowInMenu,
                  menuGroup: newBrandMenuGroup.trim() || "Featured Brands",
                  isActive: true,
                });
                setBrand(newBrandName.trim());
                setIsAddBrandOpen(false);
                toast.success(`Brand "${newBrandName}" created and selected!`);
              } catch (err: any) {
                // toast handled in hook
              }
            }}
          >
            {createBrand.isPending ? "Creating..." : "Create & Select Brand"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
