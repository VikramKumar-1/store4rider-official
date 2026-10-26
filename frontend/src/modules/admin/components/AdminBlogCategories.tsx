"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, ArrowLeft, FolderTree, BookOpen, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  useAdminBlogCategories,
  useCreateBlogCategory,
  useUpdateBlogCategory,
  useDeleteBlogCategory,
} from "@/core/hooks/useBlog";
import { IBlogCategory } from "@store4riders/shared-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBlogCategorySchema } from "@store4riders/shared-validation";
import { slugify } from "@store4riders/shared-utils";

type CategoryFormValues = {
  name: string;
  slug?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
};

export function AdminBlogCategories() {
  const { data: categories = [], isLoading } = useAdminBlogCategories();
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IBlogCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<IBlogCategory | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(createBlogCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      order: 0,
      isActive: true,
    },
  });

  const nameValue = watch("name");

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: "",
      slug: "",
      description: "",
      order: categories.length,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: IBlogCategory) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      order: cat.order || 0,
      isActive: cat.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    const finalSlug = values.slug && values.slug.trim() ? slugify(values.slug) : slugify(values.name);
    const payload = {
      ...values,
      slug: finalSlug,
    };

    if (editingCategory?._id) {
      await updateCategory.mutateAsync({
        id: editingCategory._id,
        data: payload,
      });
    } else {
      await createCategory.mutateAsync(payload);
    }
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!categoryToDelete?._id) return;
    await deleteCategory.mutateAsync(categoryToDelete._id);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Articles
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderTree className="text-brand" size={24} /> Blog Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize riding guides, gear care advice, and motorcycle technical topics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={openCreateModal}
            className="bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 px-4 py-2.5 rounded-lg shadow-sm"
          >
            <Plus size={16} /> New Category
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading blog categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <FolderTree size={40} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No categories found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Create your first blog category or sync the default guide topics from the main blog page.
            </p>
            <Button
              onClick={openCreateModal}
              className="mt-2 bg-brand text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Add Category
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Articles</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {categories.map((cat, idx) => (
                  <tr key={cat._id || cat.slug} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {cat.order ?? idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      /{cat.slug}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={cat.description}>
                      {cat.description || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {cat.articleCount ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cat.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          <X size={10} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "New Blog Category"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category Name *
            </label>
            <Input
              {...register("name")}
              placeholder="e.g. Helmet Care & Maintenance"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              URL Slug
            </label>
            <Input
              {...register("slug")}
              placeholder={nameValue ? slugify(nameValue) : "helmet-care-maintenance"}
              error={errors.slug?.message}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to auto-generate from category name.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Brief description for SEO and category banner..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Display Order
              </label>
              <Input
                type="number"
                {...register("order", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="rounded-sm border-slate-300 text-brand focus:ring-brand w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">Category Active</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
              className="bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider px-5"
            >
              {createCategory.isPending || updateCategory.isPending
                ? "Saving..."
                : editingCategory
                ? "Update Category"
                : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        title="Confirm Category Deletion"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs sm:text-sm text-slate-600">
            Are you sure you want to delete category{" "}
            <span className="font-bold text-slate-900">&quot;{categoryToDelete?.name}&quot;</span>?
          </p>
          <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Note: Articles in this category will not be deleted, but will no longer have an assigned category.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCategoryToDelete(null)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4"
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
