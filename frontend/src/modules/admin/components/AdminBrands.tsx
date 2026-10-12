"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Upload, X, Check, Image as ImageIcon, ExternalLink, Globe } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/core/hooks/useBrands";
import { IBrand } from "@store4riders/shared-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrandSchema } from "@store4riders/shared-validation";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { toast } from "sonner";

const PRESET_MENU_GROUPS = [
  "Helmet Brands",
  "Riding Gear",
  "Luggage & Accessories",
  "Parts & Tyres",
  "Care & Maintenance",
  "Featured Brands"
];

type BrandFormValues = {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  showInMenu?: boolean;
  menuGroup?: string;
};

export function AdminBrands() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<IBrand | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: { 
      isActive: true, 
      showInMenu: true, 
      menuGroup: "Featured Brands" 
    }
  });

  const logoValue = watch("logo");
  const showInMenuValue = watch("showInMenu");
  const menuGroupValue = watch("menuGroup");

  const openCreateModal = () => {
    setEditingBrand(null);
    reset({ 
      name: "", 
      slug: "", 
      logo: "", 
      description: "", 
      isActive: true, 
      showInMenu: true, 
      menuGroup: "Featured Brands" 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: IBrand) => {
    setEditingBrand(brand);
    reset({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      description: brand.description || "",
      isActive: brand.isActive,
      showInMenu: brand.showInMenu !== false,
      menuGroup: brand.menuGroup || "Featured Brands",
    });
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      toast.info("Compressing brand logo to WebP...");
      const compressed = await compressImageToWebP(file, 800, 0.9);
      const s3Url = await uploadImageToS3(compressed.file);
      setValue("logo", s3Url);
      toast.success("Logo uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: BrandFormValues) => {
    if (editingBrand) {
      updateBrand.mutate(
        { id: editingBrand._id, data },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createBrand.mutate(data, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      deleteBrand.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Brands</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage product brands, storefront navigation submenu placement, and logos
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center space-x-2">
          <Plus size={18} />
          <span>Add Brand</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading brands...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Brand</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium">Submenu Display</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brands.map((brand) => (
                <tr key={brand._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {brand.logo ? (
                        <div className="relative w-10 h-10 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center overflow-hidden">
                          <Image 
                            src={brand.logo} 
                            alt={brand.name} 
                            fill 
                            sizes="40px" 
                            className="object-contain p-1" 
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 text-xs font-bold">
                          {brand.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 block">{brand.name}</span>
                        {brand.description && (
                          <span className="text-xs text-slate-400 truncate max-w-xs block">
                            {brand.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{brand.slug}</td>
                  <td className="px-6 py-4">
                    {brand.showInMenu !== false ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe size={11} />
                          In Submenu
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {brand.menuGroup || "Featured Brands"}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Hidden from Submenu
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      brand.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(brand)}
                        className="p-2 text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100"
                        title="Edit Brand"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(brand._id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete Brand"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No brands found. Add your first brand to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? "Edit Brand" : "Add New Brand"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Brand Name *"
            placeholder="e.g. AGV, Alpinestars, Rynox, Motul"
            {...register("name")}
            error={errors.name?.message}
            onChange={(e) => {
              register("name").onChange(e);
              if (!editingBrand) {
                setValue(
                  "slug", 
                  e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                );
              }
            }}
          />

          <Input
            label="URL Key / Slug *"
            placeholder="e.g. agv, alpinestars, rynox"
            {...register("slug")}
            error={errors.slug?.message}
          />

          {/* Logo Upload + Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Brand Logo (WebP Compressed)
            </label>
            <div className="flex items-center gap-3 mb-2">
              {logoValue ? (
                <div className="relative w-14 h-14 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden">
                  <Image 
                    src={logoValue} 
                    alt="Brand Logo Preview" 
                    fill 
                    sizes="56px" 
                    className="object-contain p-1" 
                  />
                  <button
                    type="button"
                    onClick={() => setValue("logo", "")}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600"
                    title="Remove Logo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon size={20} />
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Upload size={14} />
                  <span>{isUploadingLogo ? "Compressing & Uploading..." : "Upload Logo (Auto-WebP)"}</span>
                </Button>
                <p className="text-[11px] text-slate-400">
                  Direct upload automatically converts to optimized WebP.
                </p>
              </div>
            </div>
            <Input
              placeholder="Or paste image URL (https://...)"
              {...register("logo")}
              error={errors.logo?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register("description")}
              placeholder="Brief description about the brand, heritage, or product specialties..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all resize-y min-h-[80px] text-sm"
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
          </div>

          {/* Submenu Display Controls */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="showInMenu"
                {...register("showInMenu")}
                className="w-4 h-4 mt-0.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
              />
              <div>
                <label htmlFor="showInMenu" className="text-sm font-semibold text-slate-800 cursor-pointer block">
                  Show in Navigation Submenu / Megamenu
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, this brand will be shown in the storefront dropdown under "Shop By Brand".
                </p>
              </div>
            </div>

            {showInMenuValue && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Submenu Column / Group
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_MENU_GROUPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setValue("menuGroup", group)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${
                        menuGroupValue === group
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Or enter custom group name (e.g. Adventure Brands)"
                  {...register("menuGroup")}
                  error={errors.menuGroup?.message}
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700 font-medium cursor-pointer">
              Active Brand (Available in store catalog)
            </label>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBrand.isPending || updateBrand.isPending || isUploadingLogo}
            >
              {createBrand.isPending || updateBrand.isPending ? "Saving..." : "Save Brand"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
