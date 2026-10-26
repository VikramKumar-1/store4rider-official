"use client";

import React, { useState, useMemo } from "react";
import { useCategoryTree, useCreateCategory, useUpdateCategory, useDeleteCategory, ICategoryTree } from "@/core/hooks/useCategories";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Search, Folder, FolderOpen, FolderPlus, FolderTree, Package, Image as ImageIcon, Upload, HelpCircle, Compass, Eye, EyeOff, Layers, X, Sliders, FileText, Table as TableIcon, List } from "lucide-react";
import Link from "next/link";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SearchableSelect, Option } from "@/components/ui/SearchableSelect";
import { cleanRichContent } from "@/core/utils/cleanRichContent";
import Image from "next/image";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { ISpecFieldDefinition } from "@store4riders/shared-types";
import { CATEGORY_SPEC_DEFINITIONS } from "./product-form/product-specs.constants";

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
  attributeSetCode: z.string().optional().or(z.literal("")),
  hsnCode: z.string().optional().or(z.literal("")),
  taxClassName: z.string().optional().or(z.literal("")),
  weightUnit: z.enum(["kg", "g", "ml", "L"]).optional(),
  sizeChart: z.string().optional().or(z.literal("")),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const AdminCategories = () => {
  const { data: tree = [], isLoading } = useCategoryTree();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategoryTree | null>(null);
  const [parentForNewSubcategory, setParentForNewSubcategory] = useState<ICategoryTree | null>(null);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [faqRichModes, setFaqRichModes] = useState<Record<number, boolean>>({});
  const [faqPreviews, setFaqPreviews] = useState<Record<number, boolean>>({});
  const [selectedHeroCategoryIds, setSelectedHeroCategoryIds] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [specDefinitions, setSpecDefinitions] = useState<ISpecFieldDefinition[]>([]);
  const [showAddSpecRow, setShowAddSpecRow] = useState(false);
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecPlaceholder, setNewSpecPlaceholder] = useState("");
  const [newSpecPresets, setNewSpecPresets] = useState("");
  const [chipInputMap, setChipInputMap] = useState<Record<number, string>>({});

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

  
  const filteredCategoriesList = useMemo(() => {
    if (!categorySearch.trim()) return flatCategories;
    const q = categorySearch.toLowerCase();
    return flatCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.menuGroup && c.menuGroup.toLowerCase().includes(q))
    );
  }, [flatCategories, categorySearch]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
  });

  const cardImageUrl = watch("image");

  const parentCategoryOptions: Option[] = useMemo(() => {
    // Collect all descendant IDs of the editing category to prevent circular hierarchy
    const descendantIds = new Set<string>();
    if (editingCategory) {
      descendantIds.add(editingCategory._id);
      const addDescendants = (cat: ICategoryTree) => {
        if (cat.children && cat.children.length > 0) {
          cat.children.forEach(child => {
            descendantIds.add(child._id);
            addDescendants(child);
          });
        }
      };
      addDescendants(editingCategory);
    }

    return [
      { label: "None (Top Level Category)", value: "", description: "Root Category (No Parent)" },
      ...flatCategories
        .filter(c => !descendantIds.has(c._id))
        .map(c => ({
          label: `${c.depth > 0 ? "— ".repeat(c.depth) : ""}${c.name}`,
          value: c._id,
          description: `/${c.slug}`,
          badge: c.depth === 0 ? "Root" : `Level ${c.depth}`,
        }))
    ];
  }, [flatCategories, editingCategory]);

  const heroCandidateOptions: Option[] = useMemo(() => 
    flatCategories
      .filter(c => c._id !== editingCategory?._id && !selectedHeroCategoryIds.includes(c._id))
      .map(c => ({
        label: `${c.depth > 0 ? "— ".repeat(c.depth) : ""}${c.name}`,
        value: c._id,
        description: `/${c.slug}`,
        badge: c.depth === 0 ? "Root" : `Level ${c.depth}`,
      })),
    [flatCategories, editingCategory, selectedHeroCategoryIds]
  );

  const attributeSetOptions: Option[] = useMemo(() => [
    { label: "-- Auto-Detect from Category Name --", value: "", description: "Auto-detects blueprint based on category name" },
    { label: "Helmets", value: "Helmets", description: "Full Face, Modular, Off-Road, Visors (HSN: 6506, GST: 18%)", badge: "Gear" },
    { label: "Jackets, Pants, Suits & Armor", value: "Jackets", description: "Textile, Leather, Mesh, Armor Inserts (HSN: 6203, GST: 18%)", badge: "Apparel" },
    { label: "Riding Gloves", value: "Gloves", description: "Full Gauntlet, Short Cuff, Waterproof (HSN: 6116, GST: 18%)", badge: "Gear" },
    { label: "Riding Boots", value: "Boots", description: "Touring, Track, Urban Boots (HSN: 6403, GST: 18%)", badge: "Footwear" },
    { label: "Bags & Luggage", value: "Saddle Bag", description: "Saddle, Tank, Tail Bags, Panniers (HSN: 4202, GST: 18%)", badge: "Luggage" },
    { label: "Chain Lubes & Liquids", value: "Chain Lubes / Liquids", description: "Lubes, Cleaners, Fork Oils (HSN: 2710, GST: 18%)", badge: "Care" },
    { label: "Spares, Accessories, Exhausts", value: "Spares, Accessories, Exhausts", description: "Bike Parts, Mounts, Crash Guards (HSN: 8714, GST: 28%)", badge: "Parts" },
    { label: "Communicators & Gadgets", value: "Communicator", description: "Bluetooth Intercoms, Camera Mounts (HSN: 8517, GST: 18%)", badge: "Tech" },
    { label: "General / Other Specifications", value: "Default", description: "Standard General Specs", badge: "Default" },
  ], []);

  const taxClassOptions: Option[] = useMemo(() => [
    { label: "-- Use Standard 18% GST --", value: "", description: "Standard 18% GST for riding gear & helmets" },
    { label: "18% Standard (Helmets, Gear, Bags)", value: "Taxable Goods (GST 18%)", description: "Standard 18% Tax Slab" },
    { label: "28% High-Rate (Spares, Exhausts)", value: "Auto Spares & Parts (GST 28%)", description: "28% Auto Parts Tax Slab" },
    { label: "12% Apparel & Textiles", value: "Apparel & Textiles (GST 12%)", description: "12% Textile Rate" },
    { label: "5% Consumables & Lubes", value: "Consumables & Lubricants (GST 5%)", description: "5% Essential Consumables Rate" },
  ], []);

  const weightUnitOptions: Option[] = useMemo(() => [
    { label: "kg (Helmets, Luggage, Spares)", value: "kg", description: "Kilograms" },
    { label: "g (Jackets, Gloves)", value: "g", description: "Grams" },
    { label: "ml (Lubes, Sprays, Liquids)", value: "ml", description: "Millilitres" },
    { label: "L (Large Oils)", value: "L", description: "Litres" },
  ], []);

  const badgeColorOptions: Option[] = useMemo(() => [
    { label: "Default (Red - Brand)", value: "", badge: "Brand", badgeColor: "bg-brand text-white" },
    { label: "Green (Emerald)", value: "bg-emerald-600", badge: "Green", badgeColor: "bg-emerald-600 text-white" },
    { label: "Blue", value: "bg-blue-600", badge: "Blue", badgeColor: "bg-blue-600 text-white" },
    { label: "Amber / Orange", value: "bg-amber-500", badge: "Orange", badgeColor: "bg-amber-500 text-white" },
    { label: "Purple", value: "bg-purple-600", badge: "Purple", badgeColor: "bg-purple-600 text-white" },
  ], []);


  const handleAddChip = (fieldIdx: number) => {
    const val = (chipInputMap[fieldIdx] || "").trim();
    if (!val) return;
    setSpecDefinitions((prev) =>
      prev.map((f, i) => (i === fieldIdx ? { ...f, presets: [...(f.presets || []), val] } : f))
    );
    setChipInputMap((prev) => ({ ...prev, [fieldIdx]: "" }));
  };

  const handleRemoveChip = (fieldIdx: number, chipIdx: number) => {
    setSpecDefinitions((prev) =>
      prev.map((f, i) =>
        i === fieldIdx ? { ...f, presets: (f.presets || []).filter((_, ci) => ci !== chipIdx) } : f
      )
    );
  };

  const handleRemoveField = (fieldIdx: number) => {
    setSpecDefinitions((prev) => prev.filter((_, i) => i !== fieldIdx));
  };

  const handleAddNewSpecField = () => {
    if (!newSpecLabel.trim()) {
      toast.error("Please enter a specification name/label");
      return;
    }
    const autoKey =
      newSpecKey.trim() ||
      newSpecLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    const presetsArray = newSpecPresets
      .split(/[,|\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setSpecDefinitions((prev) => [
      ...prev,
      {
        label: newSpecLabel.trim(),
        key: autoKey,
        placeholder: newSpecPlaceholder.trim() || `e.g. ${newSpecLabel.trim()}`,
        presets: presetsArray,
      },
    ]);

    setNewSpecLabel("");
    setNewSpecKey("");
    setNewSpecPlaceholder("");
    setNewSpecPresets("");
    setShowAddSpecRow(false);
    toast.success("Specification added to category template!");
  };

  const handleResetToBlueprint = (blueprintCode?: string) => {
    const code = blueprintCode || watch("attributeSetCode") || "Default";
    const blueprint = CATEGORY_SPEC_DEFINITIONS[code] || CATEGORY_SPEC_DEFINITIONS.Default;
    if (blueprint) {
      setSpecDefinitions(blueprint.fields.map((f) => ({ ...f, presets: [...(f.presets || [])] })));
      toast.success(`Reset specifications to "${blueprint.title}" template defaults`);
    }
  };

  const openModal = (category?: ICategoryTree, parentCategory?: ICategoryTree) => {
    setShowAddSpecRow(false);
    setNewSpecLabel("");
    setNewSpecKey("");
    setNewSpecPlaceholder("");
    setNewSpecPresets("");
    setChipInputMap({});
    if (category) {
      setEditingCategory(category);
      setParentForNewSubcategory(null);
      if (category.specDefinitions && category.specDefinitions.length > 0) {
        setSpecDefinitions(category.specDefinitions.map((s) => ({ ...s, presets: [...(s.presets || [])] })));
      } else {
        const code = (category as any).attributeSetCode || "Default";
        const blueprint = CATEGORY_SPEC_DEFINITIONS[code] || CATEGORY_SPEC_DEFINITIONS.Default;
        setSpecDefinitions(blueprint.fields.map((f) => ({ ...f, presets: [...(f.presets || [])] })));
      }
      setFaqs(category.faqs || []);
      setSelectedHeroCategoryIds(category.heroCategoryIds || []);
      setFaqRichModes({});
      setFaqPreviews({});
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
        attributeSetCode: (category as any).attributeSetCode || "",
        hsnCode: (category as any).hsnCode || "",
        taxClassName: (category as any).taxClassName || "",
        weightUnit: (category as any).weightUnit || "kg",
        sizeChart: (category as any).sizeChart || "",
      });
    } else if (parentCategory) {
      setEditingCategory(null);
      setParentForNewSubcategory(parentCategory);
      setFaqs([]);
      setSelectedHeroCategoryIds([]);
      setFaqRichModes({});
      setFaqPreviews({});

      if (parentCategory.specDefinitions && parentCategory.specDefinitions.length > 0) {
        setSpecDefinitions(parentCategory.specDefinitions.map((s) => ({ ...s, presets: [...(s.presets || [])] })));
      } else {
        const code = (parentCategory as any).attributeSetCode || "Default";
        const blueprint = CATEGORY_SPEC_DEFINITIONS[code] || CATEGORY_SPEC_DEFINITIONS.Default;
        setSpecDefinitions(blueprint.fields.map((f) => ({ ...f, presets: [...(f.presets || [])] })));
      }

      reset({
        name: "",
        slug: "",
        parentId: parentCategory._id,
        description: "",
        image: "",
        bannerImage: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        videoUrl: "",
        includeInMenu: true,
        menuGroup: parentCategory.menuGroup || "",
        badge: "",
        badgeColor: "",
        attributeSetCode: (parentCategory as any).attributeSetCode || "",
        hsnCode: (parentCategory as any).hsnCode || "",
        taxClassName: (parentCategory as any).taxClassName || "",
        weightUnit: (parentCategory as any).weightUnit || "kg",
        sizeChart: (parentCategory as any).sizeChart || "",
      });
    } else {
      setEditingCategory(null);
      setParentForNewSubcategory(null);
      setFaqs([]);
      setSelectedHeroCategoryIds([]);
      setFaqRichModes({});
      setFaqPreviews({});
      setSpecDefinitions(
        CATEGORY_SPEC_DEFINITIONS.Default.fields.map((f) => ({ ...f, presets: [...(f.presets || [])] }))
      );

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
        attributeSetCode: "",
        hsnCode: "",
        taxClassName: "",
        weightUnit: "kg",
        sizeChart: "",
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
      specDefinitions: specDefinitions.filter((s) => s.label.trim() && s.key.trim()),
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
        {/* Category & Submenu Quick Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search any parent category or submenu by name, slug, group (e.g. 'full face', 'gloves', 'bags')..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand shadow-2xs font-medium"
            />
            {categorySearch && (
              <button
                type="button"
                onClick={() => setCategorySearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredCategoriesList.length}</span> of {flatCategories.length} categories &amp; submenus
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading categories...</div>
        ) : filteredCategoriesList.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {categorySearch ? `No categories or submenus match "${categorySearch}".` : "No categories found. Create your first category."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCategoriesList.map((category) => (
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
                      {category.depth > 0 && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
                          Submenu (L{category.depth})
                        </span>
                      )}
                      {category.children && category.children.length > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                          {category.children.length} {category.children.length === 1 ? "subcat" : "subcats"}
                        </span>
                      )}
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
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button 
                    onClick={() => openModal(undefined, category)} 
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-brand bg-white hover:bg-brand/5 rounded-lg shadow-2xs border border-slate-200 transition-colors cursor-pointer"
                    title={`Add subcategory / submenu under "${category.name}"`}
                  >
                    <FolderPlus size={13} className="text-brand" />
                    <span className="hidden sm:inline">+ Submenu</span>
                  </button>

                  <Link
                    href={`/admin/products?category=${encodeURIComponent(category.slug || category._id)}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-brand bg-white hover:bg-slate-50 rounded-lg shadow-2xs border border-slate-200 transition-colors cursor-pointer"
                    title={`View products in "${category.name}"`}
                  >
                    <Package size={13} className="text-slate-500" />
                    <span className="hidden sm:inline">Products</span>
                  </Link>

                  <button 
                    onClick={() => openModal(category)} 
                    className="p-1.5 text-slate-400 hover:text-brand transition-colors bg-white rounded-lg shadow-2xs border border-slate-200 cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button 
                    onClick={() => handleDelete(category._id)} 
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-lg shadow-2xs border border-slate-200 cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={13} />
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
        maxWidth="max-w-3xl"
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : parentForNewSubcategory ? `Add Subcategory / Submenu under "${parentForNewSubcategory.name}"` : "Add New Category"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {parentForNewSubcategory && !editingCategory && (
            <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <FolderTree size={16} className="text-indigo-600 shrink-0" />
                <div>
                  <p className="font-semibold">
                    Creating Subcategory / Submenu under: <span className="text-brand font-bold">{parentForNewSubcategory.name}</span>
                  </p>
                  <p className="text-[11px] text-indigo-600 mt-0.5">
                    Blueprint specs, GST tax rate, and settings have been automatically pre-inherited.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue("parentId", "");
                  setParentForNewSubcategory(null);
                }}
                className="text-[11px] text-indigo-700 hover:text-indigo-900 underline font-semibold whitespace-nowrap ml-2 cursor-pointer"
              >
                Change to Root
              </button>
            </div>
          )}
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
            <SearchableSelect
              options={parentCategoryOptions}
              value={watch("parentId") || ""}
              onChange={(val) => setValue("parentId", val, { shouldDirty: true })}
              placeholder="None (Top Level Category)"
              className="w-full text-xs"
            />
          </div>

                    {/* DEFAULT PRODUCT BLUEPRINT (CATEGORY TEMPLATE) */}
          <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-brand">
                <Sliders size={14} className="text-brand" />
                Default Product Blueprint (Category Template)
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Define the default specs template, HSN tax code, and weight unit for all products added to this category.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Specs Template (Attribute Set)</label>
                <SearchableSelect
                  options={attributeSetOptions}
                  value={watch("attributeSetCode") || ""}
                  onChange={(val) => {
                    setValue("attributeSetCode", val, { shouldDirty: true });
                    handleResetToBlueprint(val);
                  }}
                  placeholder="-- Auto-Detect from Category Name --"
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Default HSN Tax Code</label>
                <input
                  type="text"
                  {...register("hsnCode")}
                  placeholder="e.g. 6506 (Helmets) or 6116 (Gloves)"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Default GST Tax Slab</label>
                <SearchableSelect
                  options={taxClassOptions}
                  value={watch("taxClassName") || ""}
                  onChange={(val) => setValue("taxClassName", val, { shouldDirty: true })}
                  placeholder="-- Use Standard 18% GST --"
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Default Weight / Volume Unit</label>
                <SearchableSelect
                  options={weightUnitOptions}
                  value={watch("weightUnit") || "kg"}
                  onChange={(val) => setValue("weightUnit", val as any, { shouldDirty: true })}
                  placeholder="kg (Helmets, Luggage, Spares)"
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>

          {/* CATEGORY SPECIFICATIONS & ATTRIBUTES TEMPLATE BUILDER */}
          <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
                  <Sliders size={14} className="text-brand" />
                  Category Specifications & Attributes Template
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Define what technical specifications, attributes, and quick-preset chips will appear for products in this category.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <span className="text-[11px] font-bold bg-white text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                  {specDefinitions.length} Specs Configured
                </span>
                <button
                  type="button"
                  onClick={() => handleResetToBlueprint()}
                  className="text-[11px] text-slate-600 hover:text-brand font-semibold px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Reload default specification fields for the selected attribute set"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSpecRow(!showAddSpecRow)}
                  className="text-[11px] bg-brand text-white font-bold px-2.5 py-1 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  + Add Spec Field
                </button>
              </div>
            </div>

            {/* Inline Add New Specification Form */}
            {showAddSpecRow && (
              <div className="p-3.5 bg-white rounded-xl border-2 border-brand/20 shadow-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plus size={13} className="text-brand" />
                    New Specification Field
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSpecRow(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Field Label *</label>
                    <input
                      type="text"
                      value={newSpecLabel}
                      onChange={(e) => {
                        setNewSpecLabel(e.target.value);
                        if (!newSpecKey) {
                          setNewSpecKey(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
                        }
                      }}
                      placeholder="e.g. Water Resistance / Shell Material"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Attribute Key (slug)</label>
                    <input
                      type="text"
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      placeholder="e.g. water_resistance"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Input Placeholder</label>
                    <input
                      type="text"
                      value={newSpecPlaceholder}
                      onChange={(e) => setNewSpecPlaceholder(e.target.value)}
                      placeholder="e.g. e.g. 100% Waterproof / Water-Resistant"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Preset Quick-Chips (comma separated)</label>
                  <input
                    type="text"
                    value={newSpecPresets}
                    onChange={(e) => setNewSpecPresets(e.target.value)}
                    placeholder="e.g. 100% Waterproof, Water-Resistant, Not Waterproof"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <p className="text-[10px] text-slate-400">These chips appear as clickable pills in the product technical specs tab.</p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSpecRow(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewSpecField}
                    className="px-3.5 py-1 rounded-lg text-xs font-bold bg-brand text-white hover:bg-red-700 cursor-pointer shadow-2xs"
                  >
                    Save Specification to Template
                  </button>
                </div>
              </div>
            )}

            {/* List of Defined Specification Fields */}
            {specDefinitions.length === 0 ? (
              <div className="text-center py-6 px-4 bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                <Sliders size={24} className="mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No specifications defined for this category template.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Click <strong>+ Add Spec Field</strong> to define custom attributes or click <strong>Reset Defaults</strong> to load standard blueprints.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {specDefinitions.map((field, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                          {fIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpecDefinitions((prev) =>
                              prev.map((item, i) => (i === fIdx ? { ...item, label: val } : item))
                            );
                          }}
                          className="font-bold text-xs text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand focus:outline-none px-1 py-0.5 flex-1 min-w-[120px]"
                          placeholder="Specification Label"
                        />
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 hidden sm:inline-block">
                          key: {field.key}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(fIdx)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove specification from this category template"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <input
                          type="text"
                          value={field.placeholder || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpecDefinitions((prev) =>
                              prev.map((item, i) => (i === fIdx ? { ...item, placeholder: val } : item))
                            );
                          }}
                          placeholder="Placeholder (e.g. e.g. ECE 22.06)"
                          className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50/50"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={chipInputMap[fIdx] || ""}
                          onChange={(e) => setChipInputMap((prev) => ({ ...prev, [fIdx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddChip(fIdx);
                            }
                          }}
                          placeholder="+ Add preset chip..."
                          className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddChip(fIdx)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Chips list */}
                    {(field.presets || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {field.presets?.map((chip, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200/80"
                          >
                            <span>{chip}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveChip(fIdx, cIdx)}
                              className="text-slate-400 hover:text-red-500 font-bold cursor-pointer"
                              title="Remove chip"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                <SearchableSelect
                  options={badgeColorOptions}
                  value={watch("badgeColor") || ""}
                  onChange={(val) => setValue("badgeColor", val, { shouldDirty: true })}
                  placeholder="Default (Red - Brand)"
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>

          {/* CATEGORY THUMBNAIL PHOTO (1:1 SQUARE) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-brand" />
                  This Category&apos;s Thumbnail Photo (1:1 Square)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <strong className="text-slate-700">Recommended Size: 400 &times; 400 px</strong> (Square, WebP or PNG with transparent/light background). Auto-compressed on upload.
                </p>
                <div className="mt-1.5 p-2 bg-blue-50/80 border border-blue-200/80 rounded-lg text-[11px] text-blue-950 space-y-0.5">
                  <span className="font-bold flex items-center gap-1 text-blue-900">
                    <span>📌</span> Single Photo Per Category Rule:
                  </span>
                  <span className="block text-slate-700 leading-relaxed text-[10.5px]">
                    Every category/subcategory has only <strong>1 photo</strong>. For example, edit <em>&quot;Full Face Helmets&quot;</em> to upload its photo, and edit <em>&quot;Open Face Helmets&quot;</em> to upload its photo. When a parent category selects them as Hero Cards, their photos are automatically pulled!
                  </span>
                </div>
              </div>
              {cardImageUrl && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                  <Image src={cardImageUrl} alt="Thumbnail preview" fill sizes="48px" className="object-contain p-1" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Input 
                {...register("image")} 
                placeholder="Paste Image URL or upload from computer..." 
                className="text-xs flex-1"
              />
              <label className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 transition-colors">
                <Upload size={13} />
                <span>{isUploadingImage ? "Compressing WebP..." : "Upload Photo"}</span>
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
                  <Layers size={14} className="text-brand" />
                  Mobile Hero Showcase Cards (3-Card Layout)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pick up to 3 subcategories to showcase as tile cards on mobile when riders visit this page.
                </p>
                </div>
              <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                {selectedHeroCategoryIds.length} / 3 Cards
              </span>
            </div>

            {/* Clear explanation callout so admin never gets confused where 3 photos come from */}
            <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-[11px] text-slate-700 space-y-1">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <span>💡</span> Where do the 3 card images come from? (You do not upload 3 images here)
              </span>
              <span className="block text-slate-700 leading-relaxed text-[10.5px]">
                Each card automatically displays the single thumbnail photo of that specific subcategory.
              </span>
              <span className="block text-slate-600 text-[10.5px] bg-white/70 p-1.5 rounded border border-amber-200/50">
                👉 <strong>Example:</strong> To change the photo on the <em>&quot;Open Face Helmets&quot;</em> card, simply open and edit the <em>Open Face Helmets</em> category from the list and upload its photo there. It will automatically update here!
              </span>
            </div>

            {selectedHeroCategoryIds.length < 3 ? (
              <SearchableSelect
                options={heroCandidateOptions}
                value=""
                onChange={(targetId) => {
                  if (targetId && !selectedHeroCategoryIds.includes(targetId)) {
                    setSelectedHeroCategoryIds(prev => [...prev, targetId]);
                  }
                }}
                placeholder="+ Add a Category Card to Hero Section..."
                className="w-full text-xs"
              />
            ) : (
              <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                Maximum 3 hero cards reached. Remove one below to choose another.
              </p>
            )}

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
                          <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image src={targetCat.image} alt={targetCat.name} fill sizes="28px" className="object-contain p-0.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                            <Folder size={13} className="text-amber-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-800 truncate block">{targetCat.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">/{targetCat.slug}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {targetCat.image ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium hidden sm:inline">
                            ✓ Photo ready
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium hidden sm:inline">
                            ⚠️ No photo (edit /{targetCat.slug})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedHeroCategoryIds(prev => prev.filter(cId => cId !== id))}
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-50 cursor-pointer"
                          title="Remove card"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                No custom cards selected. System will automatically display direct subcategories from the catalog tree.
              </p>
            )}
          </div>

          {/* CATEGORY DESCRIPTION WITH RICH TEXT & TABLE BUILDER */}
          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-slate-700">
                  <FileText size={14} className="text-brand" />
                  Category Description (Visual Rich Text & Table Editor)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Displayed inside the &quot;Category Description&quot; accordion on the storefront landing page. Full support for comparison tables, buyer tips, headings, and images.
                </p>
              </div>

              {/* Quick Table Template Button */}
              <button
                type="button"
                onClick={() => {
                  const currentDesc = watch("description") || "";
                  const sampleTable = `<table class="w-full my-4 border-collapse border border-slate-300 text-xs">
  <thead>
    <tr class="bg-slate-100 font-bold">
      <th class="border border-slate-300 p-2 text-left">Category / Feature</th>
      <th class="border border-slate-300 p-2 text-left">Recommended Usage</th>
      <th class="border border-slate-300 p-2 text-left">Safety Rating</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 p-2 font-medium">Full Face Helmets</td>
      <td class="border border-slate-300 p-2">Highway Touring, Track Racing & Maximum Protection</td>
      <td class="border border-slate-300 p-2">ECE 22.06 / DOT / ISI</td>
    </tr>
    <tr>
      <td class="border border-slate-300 p-2 font-medium">Modular / Flip-up</td>
      <td class="border border-slate-300 p-2">City Commute & Long-Distance Cruising</td>
      <td class="border border-slate-300 p-2">ECE 22.05 / ISI</td>
    </tr>
  </tbody>
</table><p><br></p>`;
                  setValue("description", currentDesc ? `${currentDesc}\n${sampleTable}` : sampleTable, { shouldDirty: true });
                  toast.success("Specification table template inserted!");
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Insert a pre-formatted comparison table template"
              >
                <TableIcon size={12} className="text-brand" />
                <span>+ Insert Spec Table</span>
              </button>
            </div>

            <RichTextEditor
              value={watch("description") || ""}
              onChange={(val) => setValue("description", val, { shouldDirty: true })}
              placeholder="Write rich category introduction, buyer guide, sizing recommendations, and comparison tables..."
              minHeight="220px"
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-wider text-slate-500">
              <Search size={13} className="text-brand" />
              Google SEO &amp; Meta Details
            </h4>

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
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
                  <HelpCircle size={14} className="text-brand" />
                  Category Landing Page FAQs ({faqs.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Rendered at the bottom of the category catalog page with Google SEO schema & rider guidance tables.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFaqs(prev => [...prev, { question: "", answer: "" }])}
                className="text-[11px] py-1 px-2.5 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add FAQ
              </Button>
            </div>

            {faqs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No FAQs added for this category yet.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isRich = !!faqRichModes[idx] || Boolean(faq.answer && (faq.answer.includes("<table") || faq.answer.includes("<ul") || faq.answer.includes("<p>") || faq.answer.includes("<strong")));
                  const isPreview = !!faqPreviews[idx];

                  return (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 relative">
                      <button
                        type="button"
                        onClick={() => {
                          setFaqs(prev => prev.filter((_, i) => i !== idx));
                          setFaqRichModes(prev => {
                            const copy = { ...prev };
                            delete copy[idx];
                            return copy;
                          });
                          setFaqPreviews(prev => {
                            const copy = { ...prev };
                            delete copy[idx];
                            return copy;
                          });
                        }}
                        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="w-[90%] space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">FAQ Question #{idx + 1}</label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, question: val } : item));
                          }}
                          placeholder={`Question #${idx + 1} (e.g. Which helmet is safest for long distance highway touring?)`}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>

                      {/* Formatting & Mode Controls Toolbar */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                        <span className="text-[11px] font-bold text-slate-600">Answer Content</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Toggle Visual / Rich Editor */}
                          <button
                            type="button"
                            onClick={() => setFaqRichModes(prev => ({ ...prev, [idx]: !isRich }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                              isRich
                                ? "bg-brand text-white border-brand"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <Sliders size={10} />
                            <span>{isRich ? "Visual Mode Active" : "Visual & Table Editor"}</span>
                          </button>

                          {/* Quick Insert Table */}
                          <button
                            type="button"
                            onClick={() => {
                              const sampleTable = `<table class="w-full my-2 border-collapse border border-slate-300 text-xs">
  <thead>
    <tr class="bg-slate-100 font-bold">
      <th class="border border-slate-300 p-1.5 text-left">Specification</th>
      <th class="border border-slate-300 p-1.5 text-left">Guidance</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 p-1.5 font-medium">Certification</td>
      <td class="border border-slate-300 p-1.5">ECE 22.06 or DOT Recommended</td>
    </tr>
    <tr>
      <td class="border border-slate-300 p-1.5 font-medium">Fit & Sizing</td>
      <td class="border border-slate-300 p-1.5">Snug fit without pressure points</td>
    </tr>
  </tbody>
</table><p><br></p>`;
                              setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, answer: item.answer ? `${item.answer}\n${sampleTable}` : sampleTable } : item));
                              setFaqRichModes(prev => ({ ...prev, [idx]: true }));
                              toast.success("Table template inserted into FAQ answer!");
                            }}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-300 flex items-center gap-1 cursor-pointer"
                            title="Insert comparison table template"
                          >
                            <TableIcon size={10} className="text-brand" />
                            <span>+ Table</span>
                          </button>

                          {/* Quick Insert Bullets */}
                          <button
                            type="button"
                            onClick={() => {
                              const sampleBullets = `<ul class="list-disc pl-5 my-2 space-y-1">
  <li>Ensure helmet has ISI/ECE certification.</li>
  <li>Check cheek pad thickness and removable washable lining.</li>
  <li>Verify visor has anti-scratch coating and Pinlock pins.</li>
</ul><p><br></p>`;
                              setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, answer: item.answer ? `${item.answer}\n${sampleBullets}` : sampleBullets } : item));
                              setFaqRichModes(prev => ({ ...prev, [idx]: true }));
                              toast.success("Bullet points inserted!");
                            }}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-300 flex items-center gap-1 cursor-pointer"
                          >
                            <List size={10} />
                            <span>+ Bullets</span>
                          </button>

                          {/* Live Preview Toggle */}
                          <button
                            type="button"
                            onClick={() => setFaqPreviews(prev => ({ ...prev, [idx]: !isPreview }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                              isPreview
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <Eye size={10} />
                            <span>{isPreview ? "Hide Preview" : "Preview"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Rich Editor OR Standard Input */}
                      {isRich ? (
                        <RichTextEditor
                          value={faq.answer}
                          onChange={(val) => {
                            setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, answer: val } : item));
                          }}
                          placeholder="Write detailed FAQ answer with tables, bold text, links, or lists..."
                          minHeight="140px"
                        />
                      ) : (
                        <textarea
                          rows={3}
                          value={faq.answer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, answer: val } : item));
                          }}
                          placeholder="Answer with rider recommendations, sizing tips, or HTML tables..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand font-sans"
                        />
                      )}

                      {/* Live Preview Box */}
                      {isPreview && (
                        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Storefront Live Preview
                          </div>
                          <div
                            className="text-xs text-neutral-800 leading-relaxed prose prose-sm prose-neutral prose-table:w-full prose-table:table-fixed prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-1.5 prose-td:border prose-td:border-slate-300 prose-td:p-1.5 max-w-none"
                            dangerouslySetInnerHTML={{ __html: cleanRichContent(faq.answer || "<em>No content entered yet</em>") }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
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
