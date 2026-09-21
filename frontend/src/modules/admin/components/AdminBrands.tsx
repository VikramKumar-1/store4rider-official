"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/core/hooks/useBrands";
import { IBrand } from "@store4riders/shared-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrandSchema } from "@store4riders/shared-validation";

type BrandFormValues = {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
};

export function AdminBrands() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<IBrand | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: { isActive: true }
  });

  const openCreateModal = () => {
    setEditingBrand(null);
    reset({ name: "", slug: "", logo: "", description: "", isActive: true });
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
    });
    setIsModalOpen(true);
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
          <p className="text-slate-500 text-sm mt-1">Manage product brands</p>
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
                        <div className="relative w-8 h-8 bg-slate-100 rounded overflow-hidden">
                          <Image src={brand.logo} alt={brand.name} fill sizes="32px" className="object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs font-bold">
                          {brand.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-slate-800">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{brand.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(brand._id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
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
        title={editingBrand ? "Edit Brand" : "Add Brand"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            {...register("name")}
            error={errors.name?.message}
            onChange={(e) => {
              register("name").onChange(e);
              if (!editingBrand) {
                setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
              }
            }}
          />
          <Input
            label="Slug"
            {...register("slug")}
            error={errors.slug?.message}
          />
          <Input
            label="Logo URL"
            placeholder="https://..."
            {...register("logo")}
            error={errors.logo?.message}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              {...register("description")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all resize-y min-h-[100px]"
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBrand.isPending || updateBrand.isPending}
            >
              {createBrand.isPending || updateBrand.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
