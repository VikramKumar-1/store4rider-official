"use client";

import React, { useState, useMemo } from "react";
import { useCategoryTree, useCreateCategory, useUpdateCategory, useDeleteCategory, ICategoryTree } from "@/core/hooks/useCategories";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Folder, FolderOpen, Image as ImageIcon, Upload, HelpCircle, Compass, Eye, EyeOff, Layers, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";

const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional().or(z.literal("")),
  bannerImage: z.string().optional().or(z.literal("")),
  metaTitle: z.string().max(100).optional().or(z.literal("")),
  metaDescription: z.string().max(500).optional().or(z.literal("")),
  metaKeywords: z.string().max(500).optional().or(z.literal("")),
  videoUrl: z.string().optional().or(z.literal("")),
  includeInMenu: z.boolean().default(true),
  menuGroup: z.string().optional().or(z.literal("")),
  badge: z.string().optional().or(z.literal("")),
  badgeColor: z.string().optional().or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const AdminCategories = () => {
  const { data: tree = [], isLoading } = useCategoryTree();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategoryTree | null>(null);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [selectedHeroCategoryIds, setSelectedHeroCategoryIds] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
  });

  const cardImageUrl = watch("image");

  const openModal = (category?: ICategoryTree) => {
    if (category) {
      setEditingCategory(category);
      setFaqs(category.faqs || []);
      setSelectedHeroCategoryIds(category.heroCategoryIds || []);
      reset({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId || "",
        description: category.description || "",
        image: category.image || "",
        bannerImage: category.bannerImage || "",
        metaTitle: category.metaTitle || "",
        metaDescription: category.metaDescription || "",
        metaKeywords: category.metaKeywords || "",
        videoUrl: category.videoUrl || "",
        includeInMenu: category.includeInMenu !== false,
        menuGroup: category.menuGroup || "",
        badge: category.badge || "",
        badgeColor: category.badgeColor || "",
      });
    } else {
      setEditingCategory(null);
      setFaqs([]);
      setSelectedHeroCategoryIds([]);
      reset({
        name: "",
        slug: "",
        parentId: "",
        description: "",
        image: "",
        bannerImage: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        videoUrl: "",
        includeInMenu: true,
        menuGroup: "",
        badge: "",
        badgeColor: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { file: webpFile } = await compressImageToWebP(file, 800, 0.85);
      let s3Url = "";
      try {
        s3Url = await uploadImageToS3(webpFile);
      } catch (err) {
        s3Url = URL.createObjectURL(webpFile);
        toast.warning("S3 credentials not active. Using local preview URL.");
      }
      setValue("image", s3Url);
      toast.success("Category card image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const onSubmit = (data: CategoryFormValues) => {
    const payload = {
      ...data,
      includeInMenu: data.includeInMenu !== false,
      heroCategoryIds: selectedHeroCategoryIds,
      faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
    };
    if (!payload.parentId) delete payload.parentId;

    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory._id, data: payload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
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
          <p className="text-slate-500 text-sm mt-1">
            Organize hierarchy, subcategory cards (3-card mobile view), banner & SEO FAQs.
          </p>
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
                  {category.image ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                      <Image src={category.image} alt={category.name} fill sizes="40px" className="object-cover" />
                    </div>
                  ) : category.children && category.children.length > 0 ? (
                    <FolderOpen className="text-brand w-5 h-5 shrink-0" />
                  ) : (
                    <Folder className="text-slate-400 w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{category.name}</span>
                      {category.includeInMenu === false ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <EyeOff size={10} /> Hidden from Menu
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <Eye size={10} /> In Menu
                        </span>
                      )}
                      {category.image && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                          Thumbnail
                        </span>
                      )}
                      {category.heroCategoryIds && category.heroCategoryIds.length > 0 && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                          {category.heroCategoryIds.length} Hero Cards
                        </span>
                      )}
                      {category.badge && (
                        <span className={`text-[9px] text-white px-1.5 py-0.5 rounded font-bold uppercase ${category.badgeColor || "bg-brand"}`}>
                          {category.badge}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-mono">/{category.slug}</span>
                      {category.menuGroup && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                          Group: {category.menuGroup}
                        </span>
                      )}
                      {category.metaTitle && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">SEO</span>
                      )}
                      {category.faqs && category.faqs.length > 0 && (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {category.faqs.length} FAQs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openModal(category)} 
                    className="p-2 text-slate-400 hover:text-brand transition-colors bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(category._id)} 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Category"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category Name *</label>
              <Input {...register("name")} placeholder="e.g., Full Face Helmet" />
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
              <option value="">None (Top Level Category)</option>
              {flatCategories.filter(c => c._id !== editingCategory?._id).map(c => (
                <option key={c._id} value={c._id}>
                  {'\u00A0'.repeat(c.depth * 4)}{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* STOREFRONT NAVIGATION & SUBMENU SETTINGS */}
          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
                <Compass size={14} className="text-brand" />
                Storefront Navigation & Submenu Settings
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Control whether this category appears in the header mega menu and define its column grouping.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="includeInMenu"
                {...register("includeInMenu")}
                className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
              />
              <label htmlFor="includeInMenu" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                Show in Navigation Submenu / Megamenu
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Submenu Group (Optional)</label>
                <Input 
                  {...register("menuGroup")} 
                  placeholder="e.g. Types, Accessories" 
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Badge Tag (Optional)</label>
                <Input 
                  {...register("badge")} 
                  placeholder="e.g. NEW, HOT, SALE" 
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Badge Color</label>
                <select
                  {...register("badgeColor")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">Default (Red - Brand)</option>
                  <option value="bg-emerald-600">Green (Emerald)</option>
                  <option value="bg-blue-600">Blue</option>
                  <option value="bg-amber-500">Amber / Orange</option>
                  <option value="bg-purple-600">Purple</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subcategory Card Thumbnail (Shows on 3-Card Mobile Grid & Submenu) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-brand" />
                  Category Thumbnail Image
                </label>
                <p className="text-[11px] text-slate-500">
                  Square photo displayed in the 3-column subcategory hero cards (e.g. &quot;Full Face Helmet&quot;, &quot;Open Face Helmets&quot;) and in navigation dropdowns.
                </p>
              </div>
              {cardImageUrl && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                  <Image src={cardImageUrl} alt="Thumbnail preview" fill sizes="40px" className="object-cover" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input 
                {...register("image")} 
                placeholder="Paste Image URL or upload below..." 
                className="text-xs flex-1"
              />
              <label className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0">
                <Upload size={13} />
                <span>{isUploadingImage ? "Compressing..." : "Upload"}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCardImageUpload} 
                  disabled={isUploadingImage}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* HERO SECTION FEATURED CARDS (3-CARD SHOWCASE) */}
          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
                  <Layers size={14} className="text-brand" />
                  Hero Section Showcase Cards (3-Card Layout)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select which categories appear in the 3-photo hero cards on this category&apos;s page (e.g. Modular Helmets page showcasing Full Face, Open Face, and Accessories).
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                {selectedHeroCategoryIds.length} / 3 Cards
              </span>
            </div>

            {/* Quick dropdown to add a category */}
            <select
              value=""
              onChange={(e) => {
                const targetId = e.target.value;
                if (targetId && !selectedHeroCategoryIds.includes(targetId)) {
                  setSelectedHeroCategoryIds(prev => [...prev, targetId]);
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">+ Add a Category Card to Hero Section...</option>
              {flatCategories
                .filter(c => c._id !== editingCategory?._id && !selectedHeroCategoryIds.includes(c._id))
                .map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} (/{c.slug})
                  </option>
                ))}
            </select>

            {/* Selected Cards Chips */}
            {selectedHeroCategoryIds.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {selectedHeroCategoryIds.map((id, index) => {
                  const targetCat = flatCategories.find(c => c._id === id);
                  if (!targetCat) return null;
                  return (
                    <div 
                      key={id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        {targetCat.image ? (
                          <div className="relative w-6 h-6 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image src={targetCat.image} alt={targetCat.name} fill sizes="24px" className="object-cover" />
                          </div>
                        ) : (
                          <Folder size={14} className="text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 truncate">{targetCat.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">/{targetCat.slug}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedHeroCategoryIds(prev => prev.filter(cId => cId !== id))}
                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-50 cursor-pointer"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                No custom cards selected. System will automatically display direct subcategories, or related sibling categories from the same parent.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Category Description</label>
            <textarea 
              {...register("description")} 
              placeholder="Overview shown inside the Category Description accordion on landing page..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              rows={2}
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
              Media & SEO Meta
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Banner Image URL (Top Hero Banner)</label>
                <Input {...register("bannerImage")} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Video Embed URL</label>
                <Input {...register("videoUrl")} placeholder="YouTube/Vimeo URL" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meta Title (SEO)</label>
                <Input {...register("metaTitle")} placeholder="e.g. Buy Full Face Helmets Online in India | Store4Riders" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meta Description (SEO)</label>
                <textarea 
                  {...register("metaDescription")} 
                  placeholder="Custom Google snippet description..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meta Keywords</label>
                <Input {...register("metaKeywords")} placeholder="motorcycle helmets, full face, safety, gear" />
              </div>
            </div>
          </div>

          {/* CATEGORY FAQS SECTION */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                  Category Landing Page FAQs ({faqs.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Rendered at the bottom of the category catalog page for Google SEO schema & rider guidance.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFaqs(prev => [...prev, { question: "", answer: "" }])}
                className="text-[11px] py-1 px-2.5 flex items-center gap-1"
              >
                <Plus size={12} /> Add FAQ
              </Button>
            </div>

            {faqs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No FAQs added for this category yet.</p>
            ) : (
              <div className="space-y-2.5">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 relative">
                    <button
                      type="button"
                      onClick={() => setFaqs(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, question: val } : item));
                      }}
                      placeholder={`Question #${idx + 1} (e.g. Which full face helmet is best for daily city commute?)`}
                      className="w-[90%] px-2.5 py-1.5 border border-slate-300 rounded text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, answer: val } : item));
                      }}
                      placeholder="Answer with rider recommendations..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
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
