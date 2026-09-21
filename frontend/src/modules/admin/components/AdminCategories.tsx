"use client";

import React, { useState, useMemo } from "react";
import { useCategoryTree, useCreateCategory, useUpdateCategory, useDeleteCategory, ICategoryTree } from "@/core/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Folder, FolderOpen, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  bannerImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  metaTitle: z.string().max(100).optional().or(z.literal("")),
  metaDescription: z.string().max(500).optional().or(z.literal("")),
  metaKeywords: z.string().max(500).optional().or(z.literal("")),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const AdminCategories = () => {
  const { data: tree = [], isLoading } = useCategoryTree();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategoryTree | null>(null);

  const flatCategories = useMemo(() => {
    const flatten = (nodes: ICategoryTree[], depth = 0): (ICategoryTree & { depth: number })[] => {
      let result: (ICategoryTree & { depth: number })[] = [];
      for (const node of nodes) {
        result.push({ ...node, depth });
        if (node.children && node.children.length > 0) {
          result = result.concat(flatten(node.children, depth + 1));
        }
      }
      return result;
    };
    return flatten(tree);
  }, [tree]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
  });

  const openModal = (category?: ICategoryTree) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId || "",
        description: category.description || "",
        bannerImage: category.bannerImage || "",
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        metaKeywords: category.metaKeywords || "",
        videoUrl: category.videoUrl || "",
      });
    } else {
      setEditingCategory(null);
      reset({
        name: "", slug: "", parentId: "", description: "", bannerImage: "", metaTitle: "", metaDescription: "", metaKeywords: "", videoUrl: ""
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: CategoryFormValues) => {
    const payload = { ...data };
    if (!payload.parentId) delete payload.parentId;

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory._id, data: payload }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category? All subcategories might lose their parent.")) {
      deleteCategory.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manage Categories</h1>
          <p className="text-slate-500 text-sm mt-1">Organize your store hierarchy and SEO metadata.</p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading categories...</div>
        ) : flatCategories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No categories found. Create your first category.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {flatCategories.map((category) => (
              <div 
                key={category._id} 
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                style={{ paddingLeft: `${Math.max(1, category.depth * 2)}rem` }}
              >
                <div className="flex items-center gap-3">
                  {category.children && category.children.length > 0 ? (
                    <FolderOpen className="text-brand w-5 h-5" />
                  ) : (
                    <Folder className="text-slate-400 w-5 h-5" />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900">{category.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>/{category.slug}</span>
                      {category.metaTitle && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">SEO</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModal(category)} className="p-2 text-slate-400 hover:text-brand transition-colors bg-white rounded-lg shadow-sm border border-slate-200">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(category._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm border border-slate-200">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? "Edit Category" : "Add New Category"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category Name *</label>
              <Input {...register("name")} placeholder="e.g., Riding Jackets" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Custom Slug (Optional)</label>
              <Input {...register("slug")} placeholder="Leave blank to auto-generate" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Parent Category</label>
            <select 
              {...register("parentId")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
            >
              <option value="">None (Top Level)</option>
              {flatCategories.filter(c => c._id !== editingCategory?._id).map(c => (
                <option key={c._id} value={c._id}>
                  {'\u00A0'.repeat(c.depth * 4)}{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea 
              {...register("description")} 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              rows={2}
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ImageIcon size={16} /> Media & SEO
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Banner Image URL</label>
                <Input {...register("bannerImage")} placeholder="https://..." />
                {errors.bannerImage && <p className="text-red-500 text-xs">{errors.bannerImage.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Video URL</label>
                <Input {...register("videoUrl")} placeholder="YouTube/Vimeo URL" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meta Title</label>
                <Input {...register("metaTitle")} placeholder="SEO Title" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meta Description</label>
                <textarea 
                  {...register("metaDescription")} 
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meta Keywords</label>
                <Input {...register("metaKeywords")} placeholder="helmets, riding gear, safety..." />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createCategory.isPending || updateCategory.isPending}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
