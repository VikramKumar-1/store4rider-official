"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  UserCircle,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Trash2,
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video,
  Tags,
  Globe,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  BookOpen,
  Table as TableIcon,
  Lightbulb,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  useAdminBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useAdminBlogCategories,
  useAdminBlogPosts,
} from "@/core/hooks/useBlog";
import { IBlogPost } from "@store4riders/shared-types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBlogPostSchema } from "@store4riders/shared-validation";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";
import { slugify } from "@store4riders/shared-utils";
import { getVideoEmbedInfo } from "@/modules/guides";
import { toast } from "sonner";

interface AdminBlogEditorProps {
  id?: string;
}

type TabType = "content" | "media" | "taxonomy" | "seo" | "preview";

export function AdminBlogEditor({ id }: AdminBlogEditorProps) {
  const isEditing = Boolean(id);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [tagInput, setTagInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(true);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestSearch, setSuggestSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authorAvatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [customSocialInput, setCustomSocialInput] = useState("");

  const { data: categories = [] } = useAdminBlogCategories();
  const { data: post, isLoading: isLoadingPost } = useAdminBlogPost(id || "");
  const { data: allPostsData } = useAdminBlogPosts({ limit: 50, status: "published" });
  const publishedArticles = allPostsData?.items?.filter((p) => p._id !== id) || [];

  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      videoUrl: "",
      categoryId: "",
      categoryName: "",
      categorySlug: "",
      tags: [],
      author: {
        name: "Store4Riders Team",
        jobTitle: "Riding Gear Specialist",
        url: "",
        avatar: "",
        bio: "",
        sameAs: [],
      },
      status: "published",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
    },
  });

  const titleValue = watch("title");
  const slugValue = watch("slug");
  const contentValue = watch("content") || "";
  const excerptValue = watch("excerpt") || "";
  const featuredImageValue = watch("featuredImage");
  const videoUrlValue = watch("videoUrl");
  const statusValue = watch("status");
  const tagsValue = (watch("tags") as string[]) || [];
  const metaTitleValue = watch("metaTitle") || "";
  const metaDescriptionValue = watch("metaDescription") || "";

  // Populate data when editing an existing post
  useEffect(() => {
    if (post && isEditing) {
      reset({
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        featuredImage: post.featuredImage || "",
        videoUrl: post.videoUrl || "",
        categoryId: post.categoryId || "",
        categoryName: post.categoryName || "",
        categorySlug: post.categorySlug || "",
        tags: post.tags || [],
        author: {
          name: post.author?.name || "Store4Riders Team",
          jobTitle: post.author?.jobTitle || "Riding Gear Specialist",
          url: post.author?.url || "",
          avatar: post.author?.avatar || "",
          bio: post.author?.bio || "",
          sameAs: post.author?.sameAs || [],
        },
        status: post.status || "published",
        metaTitle: post.metaTitle || "",
        metaDescription: post.metaDescription || "",
        metaKeywords: post.metaKeywords || "",
      });
    }
  }, [post, isEditing, reset]);

  // Handle Cover Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      toast.info("Compressing cover image to WebP...");
      const compressed = await compressImageToWebP(file, 1600, 0.85);
      const s3Url = await uploadImageToS3(compressed.file);
      setValue("featuredImage", s3Url);
      toast.success("Cover image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Author Avatar Upload
  const handleAuthorAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      toast.info("Compressing author avatar...");
      const compressed = await compressImageToWebP(file, 400, 0.85);
      const s3Url = await uploadImageToS3(compressed.file);
      setValue("author.avatar", s3Url, { shouldDirty: true });
      toast.success("Author photo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (authorAvatarInputRef.current) authorAvatarInputRef.current.value = "";
    }
  };

  // Helper to update author social link by platform
  const updateSocialLink = (platform: "instagram" | "youtube" | "facebook" | "linkedin" | "website", url: string) => {
    const currentLinks: string[] = (watch("author.sameAs") as string[]) || [];
    const trimmed = url.trim();

    // Filter out previous link matching this platform
    const otherLinks = currentLinks.filter((l) => {
      if (platform === "instagram") return !l.toLowerCase().includes("instagram.com");
      if (platform === "youtube") return !l.toLowerCase().includes("youtube.com") && !l.toLowerCase().includes("youtu.be");
      if (platform === "facebook") return !l.toLowerCase().includes("facebook.com");
      if (platform === "linkedin") return !l.toLowerCase().includes("linkedin.com");
      return true;
    });

    if (trimmed) {
      otherLinks.push(trimmed);
    }
    setValue("author.sameAs", otherLinks, { shouldDirty: true });
  };

  const videoEmbed = getVideoEmbedInfo(videoUrlValue);
  const authorSocials: string[] = (watch("author.sameAs") as string[]) || [];
  const authorAvatarValue = watch("author.avatar") || "";

  // Tag Management
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^,+|,+$/g, "");
      if (trimmed && !tagsValue.includes(trimmed)) {
        setValue("tags", [...tagsValue, trimmed]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tagsValue.filter((t) => t !== tagToRemove)
    );
  };

  // Append HTML Content Helpers
  const appendSnippet = (htmlSnippet: string, label: string) => {
    const current = contentValue.trim();
    const updated = current ? `${current}\n\n${htmlSnippet}` : htmlSnippet;
    setValue("content", updated, { shouldDirty: true });
    toast.success(`${label} added to article!`);
  };

  const insertH2Section = () => {
    appendSnippet(
      `<h2 class="font-bold text-xl text-slate-900 mt-6 mb-2">New Section Heading</h2>\n<p>Write your detailed guide section here. Keep paragraphs concise and easy to scan on mobile screens.</p>`,
      "H2 Section"
    );
  };

  const insertH3Subsection = () => {
    appendSnippet(
      `<h3 class="font-bold text-base text-slate-800 mt-4 mb-1">Sub-topic / Key Feature</h3>\n<p>Detail specific features, pros/cons, or sizing nuances here.</p>`,
      "H3 Subsection"
    );
  };

  const insertComparisonTable = () => {
    appendSnippet(
      `<div class="overflow-x-auto my-5 rounded-lg border border-slate-200 shadow-2xs">
  <table class="w-full border-collapse border border-slate-200 text-xs sm:text-sm">
    <thead>
      <tr class="bg-slate-100 font-bold text-slate-800">
        <th class="border border-slate-200 p-2.5 text-left">Category / Model</th>
        <th class="border border-slate-200 p-2.5 text-left">Rider Recommendation</th>
        <th class="border border-slate-200 p-2.5 text-left">Safety Certification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="border border-slate-200 p-2 font-medium">Highway Touring</td>
        <td class="border border-slate-200 p-2">Full-face composite helmet with Pinlock anti-fog visor</td>
        <td class="border border-slate-200 p-2">ECE 22.06 / DOT</td>
      </tr>
      <tr>
        <td class="border border-slate-200 p-2 font-medium">City Commuting</td>
        <td class="border border-slate-200 p-2">Lightweight modular helmet with internal sun drop visor</td>
        <td class="border border-slate-200 p-2">ISI IS 4151 / DOT</td>
      </tr>
    </tbody>
  </table>
</div>`,
      "Comparison Table"
    );
  };

  const insertSafetyWarningBox = () => {
    appendSnippet(
      `<blockquote class="my-5 p-4 rounded-xl border-l-4 border-brand bg-slate-50 text-slate-700 not-prose shadow-2xs">
  <p class="font-bold text-xs uppercase tracking-wider text-brand mb-1 flex items-center gap-1">
    ⚠️ Pro Rider Safety Tip
  </p>
  <p class="text-xs sm:text-sm italic">
    Always replace your helmet after any significant crash or hard impact, even if the outer shell looks intact. The internal impact-absorbing EPS foam compresses once to save your head and cannot cushion a second impact.
  </p>
</blockquote>`,
      "Safety Tip Box"
    );
  };

  const handleSelectSuggestedArticle = (article: IBlogPost) => {
    const snippet = `<div class="my-6 p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 not-prose shadow-2xs">
  <div class="flex items-start gap-3">
    <span class="text-2xl">📖</span>
    <div>
      <span class="text-[10px] font-bold uppercase tracking-wider text-brand block">Recommended Guide</span>
      <a href="/guides/post/${article.slug}" class="text-sm font-bold text-slate-900 hover:text-brand transition-colors block">
        ${article.title}
      </a>
      ${article.excerpt ? `<p class="text-xs text-slate-500 line-clamp-1 mt-0.5">${article.excerpt}</p>` : ""}
    </div>
  </div>
  <a href="/guides/post/${article.slug}" class="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-brand text-xs font-bold text-slate-700 hover:text-brand rounded-lg shrink-0 transition-colors">
    Read Article →
  </a>
</div>`;

    appendSnippet(snippet, `Suggestion for "${article.title}"`);
    setIsSuggestModalOpen(false);
  };

  // Form Submit
  const onSubmit = async (values: any) => {
    try {
      const finalSlug = values.slug && values.slug.trim() ? slugify(values.slug) : slugify(values.title);

      // Find category details
      let catName = values.categoryName || "";
      let catSlug = values.categorySlug || "";
      if (values.categoryId) {
        const selectedCat = categories.find((c) => c._id === values.categoryId || c.slug === values.categoryId);
        if (selectedCat) {
          catName = selectedCat.name;
          catSlug = selectedCat.slug;
        }
      }

      const payload: Partial<IBlogPost> = {
        ...values,
        slug: finalSlug,
        categoryName: catName,
        categorySlug: catSlug,
      };

      if (isEditing && id) {
        await updatePost.mutateAsync({ id, data: payload });
      } else {
        await createPost.mutateAsync(payload);
        router.push("/admin/blog");
      }
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  if (isEditing && isLoadingPost) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading article editor...</p>
      </div>
    );
  }

  const filteredSuggestedArticles = publishedArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(suggestSearch.toLowerCase()) ||
      (a.categoryName && a.categoryName.toLowerCase().includes(suggestSearch.toLowerCase()))
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-16">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/95 backdrop-blur-xs p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
            title="Back to Articles"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-brand" size={20} />
              {isEditing ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-[11px] text-slate-400">
              {isEditing ? `Slug: /guides/post/${slugValue || ""}` : "Draft or publish riding guides & advice"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Toggle */}
          <button
            type="button"
            onClick={() =>
              setValue("status", statusValue === "published" ? "draft" : "published")
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border cursor-pointer ${
              statusValue === "published"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            {statusValue === "published" ? (
              <>
                <CheckCircle2 size={13} /> Published
              </>
            ) : (
              <>
                <AlertCircle size={13} /> Draft Mode
              </>
            )}
          </button>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={createPost.isPending || updatePost.isPending}
            className="bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Save size={15} />
            {createPost.isPending || updatePost.isPending ? "Saving..." : isEditing ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
            activeTab === "content"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText size={14} /> Article Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
            activeTab === "media"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ImageIcon size={14} /> Cover & Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("taxonomy")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
            activeTab === "taxonomy"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Tags size={14} /> Category & Tags
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
            activeTab === "seo"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Globe size={14} /> SEO & Snippet
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer ${
            activeTab === "preview"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Eye size={14} /> Live Preview
        </button>
      </div>

      {/* Tab 1: Content & Body */}
      {activeTab === "content" && (
        <div className="space-y-4">
          {/* Main Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Article Title (H1 for Search Engines) *
              </label>
              <Input
                {...register("title")}
                placeholder="e.g. How to Choose the Right Helmet for Indian Highway Touring"
                error={errors.title?.message as string}
                className="text-sm sm:text-base font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  /guides/post/
                </span>
                <Input
                  {...register("slug")}
                  placeholder={titleValue ? slugify(titleValue) : "article-url-slug"}
                  error={errors.slug?.message as string}
                  className="font-mono text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Unique SEO URL. Leave blank to auto-generate from title.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Short Excerpt / Summary (Card & Search Snippet)
              </label>
              <textarea
                {...register("excerpt")}
                rows={3}
                placeholder="A compelling 1-2 sentence preview shown on article cards and search results..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>Recommended: 120-160 characters</span>
                <span className={excerptValue.length > 250 ? "text-amber-600 font-bold" : ""}>
                  {excerptValue.length} characters
                </span>
              </div>
            </div>
          </div>

          {/* EDITORIAL & SEO GUIDELINES (Collapsible Enterprise Banner) */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm border border-slate-700">
            <div
              onClick={() => setIsGuidelinesOpen(!isGuidelinesOpen)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Editorial &amp; SEO Heading Guidelines (Google Ranking Best Practices)
                </h3>
              </div>
              <button type="button" className="text-slate-400 hover:text-white">
                {isGuidelinesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {isGuidelinesOpen && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-3 border-t border-slate-700/60 text-xs text-slate-300">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-amber-400 font-mono font-black">H1 / H2</span> Heading Architecture
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong className="text-red-400">Do NOT use &lt;H1&gt; in the content.</strong> The article title above is already the only H1 on the page. Use <strong className="text-white">H2 (Heading 2)</strong> for primary sections (chapters), and <strong className="text-white">H3</strong> for sub-points under an H2.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-emerald-400 font-mono font-black">Link</span> Internal Dofollow SEO
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Link to 2-4 Store4Riders product categories (e.g. <em>/motorcycle-helmets</em>) or related riding guides. Links to your own domain are set to <strong className="text-emerald-300">dofollow</strong> by our link tool to pass SEO link equity. External links should be <strong className="text-amber-300">nofollow</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-blue-400 font-mono font-black">Scan</span> Readability &amp; Tables
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Keep paragraphs under 3-4 sentences. Use bullet lists for packing/maintenance checklists, and comparison tables for sizing, certifications, or price vs features breakdown.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Content Insertion Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Plus size={13} /> Quick Insert:
            </span>

            <button
              type="button"
              onClick={insertH2Section}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-brand transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <FileText size={13} className="text-brand" /> + H2 Section
            </button>

            <button
              type="button"
              onClick={insertH3Subsection}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              + H3 Subheading
            </button>

            <button
              type="button"
              onClick={insertComparisonTable}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <TableIcon size={13} className="text-blue-600" /> + Comparison Table
            </button>

            <button
              type="button"
              onClick={insertSafetyWarningBox}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <AlertCircle size={13} className="text-amber-600" /> + Safety Tip Box
            </button>

            <button
              type="button"
              onClick={() => setIsSuggestModalOpen(true)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-brand/30 hover:border-brand rounded-lg text-xs font-bold text-brand transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ml-auto"
            >
              <BookOpen size={13} /> + Suggest Related Article Box
            </button>
          </div>

          {/* Rich Content Editor */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Start writing your motorcycle guide or article here... You can also paste formatted text or Markdown from ChatGPT/Claude."
                  minHeight="500px"
                />
              )}
            />
            {errors.content && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.content.message as string}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Media & Video */}
      {activeTab === "media" && (
        <div className="space-y-6">
          {/* Featured Cover Image Section */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={16} className="text-brand" /> Featured Cover Image
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displayed as the hero header, card preview on /guides, and social media share banner.
                </p>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-bold px-3 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200 font-mono">
                16:9 Landscape • 1200 × 675 px
              </span>
            </div>

            {/* Sizing & Composition Guide */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-3">
              <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-xs">
                  Accurate Dimensions &amp; Framing Guide for Admin:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-amber-900">
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                    <span className="font-bold block text-slate-900">Recommended Resolution:</span>
                    <span>1200 × 675 px or 1600 × 900 px</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                    <span className="font-bold block text-slate-900">Aspect Ratio:</span>
                    <span>Strict 16:9 (Zero crop on mobile)</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                    <span className="font-bold block text-slate-900">Safe Zone Framing:</span>
                    <span>Keep subject/gear in center 80%</span>
                  </div>
                </div>
              </div>
            </div>

            {featuredImageValue ? (
              <div className="space-y-3">
                <div className="relative w-full max-w-xl aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                  <Image
                    src={featuredImageValue}
                    alt="Cover preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setValue("featuredImage", "")}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-md"
                    title="Remove Image"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="text-xs font-bold"
                  >
                    Replace Cover Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setValue("featuredImage", "")}
                    className="text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-brand rounded-xl p-8 text-center cursor-pointer transition-colors max-w-xl bg-slate-50/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-50"
              >
                <div className="p-3 bg-white rounded-full shadow-2xs text-slate-500">
                  <Upload size={22} className={isUploadingImage ? "animate-bounce text-brand" : ""} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    {isUploadingImage ? "Compressing & Uploading to S3..." : "Click to upload 16:9 featured cover image"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG, or WebP. Automatically converted to ultra-fast modern WebP &lt; 200KB.
                  </p>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Video Embed Section */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Video size={16} className="text-brand" /> Featured Video (YouTube / Vimeo / MP4)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste any YouTube video or review URL. It will be seamlessly embedded as a 16:9 HD video player right at the top of the article.
              </p>
            </div>

            <div className="max-w-xl space-y-2">
              <Input
                {...register("videoUrl")}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                error={errors.videoUrl?.message as string}
                className="text-xs"
              />

              {/* Live Interactive Player Preview */}
              {videoEmbed ? (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <Check size={14} className="text-emerald-600" />
                    <span>Valid {videoEmbed.type.toUpperCase()} Video Detected — Live Interactive Preview:</span>
                  </div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-300 bg-black">
                    {videoEmbed.type === "youtube" || videoEmbed.type === "vimeo" ? (
                      <iframe
                        src={videoEmbed.embedUrl}
                        title="Admin Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video src={videoEmbed.embedUrl} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Note: Readers will be able to play this video walkthrough directly on the page without leaving your site.
                  </p>
                </div>
              ) : videoUrlValue ? (
                <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                  <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    URL unrecognized. Supported formats: <code>https://www.youtube.com/watch?v=...</code>, <code>https://youtu.be/...</code>, <code>https://vimeo.com/...</code>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Category, Author & Tags */}
      {activeTab === "taxonomy" && (
        <div className="space-y-6">
          {/* Category Selection */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-brand" /> Category Assignment
            </h2>
            <div className="max-w-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Select Article Category
              </label>
              <select
                {...register("categoryId")}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand bg-white text-slate-800"
              >
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c._id || c.slug} value={c._id || c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags Section with Educational Guide & One-Click Chips */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Tags size={16} className="text-brand" /> Article Topic Tags
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Topic keywords that group related guides, assist site search, and help Google index specific themes.
              </p>
            </div>

            {/* Quick 1-Click Popular Moto Tags */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick 1-Click Add Popular Riding Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Helmets",
                  "Riding Jackets",
                  "Riding Gloves",
                  "Riding Boots",
                  "Gear Maintenance",
                  "Touring",
                  "ECE 22.06",
                  "Safety Standards",
                  "Waterproofing",
                  "Cordura",
                  "Chain Care",
                  "Track Riding",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!tagsValue.includes(tag)) {
                        setValue("tags", [...tagsValue, tag]);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 font-medium cursor-pointer ${
                      tagsValue.includes(tag)
                        ? "bg-brand/10 border-brand/30 text-brand font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Plus size={11} /> {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="max-w-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Custom Tag (Type &amp; Press Enter)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="e.g. Pinlock, Touring Pants, Rain Care..."
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const trimmed = tagInput.trim();
                    if (trimmed && !tagsValue.includes(trimmed)) {
                      setValue("tags", [...tagsValue, trimmed]);
                      setTagInput("");
                    }
                  }}
                  className="text-xs font-bold shrink-0"
                >
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Selected Tags Pills */}
            {tagsValue.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Attached Tags ({tagsValue.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tagsValue.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove Tag"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Author Details & Social Profiles (Google E-E-A-T Certified) */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserCircle size={18} className="text-brand" /> Author Profile &amp; Social Links (Google E-E-A-T)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide real author credentials and social links. Google requires transparent author verification for automotive &amp; safety reviews.
              </p>
            </div>

            {/* Author Avatar Upload */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 max-w-xl">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 bg-white shadow-2xs shrink-0 flex items-center justify-center">
                {authorAvatarValue ? (
                  <Image
                    src={authorAvatarValue}
                    alt="Author avatar"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-base font-bold text-slate-400 uppercase">
                    {(watch("author.name") || "SR")
                      .split(" ")
                      .map((p: string) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 block">
                  Author Photo / Avatar
                </span>
                <p className="text-[11px] text-slate-500">
                  Appears in author bylines, Schema.org author metadata, and bottom author card.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => authorAvatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="text-xs py-1 px-2.5 h-auto font-bold"
                  >
                    {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                  </Button>
                  {authorAvatarValue && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setValue("author.avatar", "")}
                      className="text-xs py-1 px-2.5 h-auto font-bold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={authorAvatarInputRef}
                onChange={handleAuthorAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Author Full Name
                </label>
                <Input
                  {...register("author.name")}
                  placeholder="e.g. Vishwas Mokashi or Store4Riders Team"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Author Title / Credentials
                </label>
                <Input
                  {...register("author.jobTitle")}
                  placeholder="e.g. Founder &amp; Motorcycle Gear Specialist"
                  className="text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Author Bio (Experience &amp; Expertise)
                </label>
                <textarea
                  {...register("author.bio")}
                  rows={2}
                  placeholder="e.g. 15+ years riding experience, touring across Himalayas, tested 100+ helmets and certified CE protective gear..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand"
                />
              </div>
            </div>

            {/* Dedicated Social Profile Inputs */}
            <div className="border-t border-slate-100 pt-4 max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Author Social &amp; Verification Links:
              </span>
              <p className="text-[11px] text-slate-500">
                These are injected into Google Schema.org (&quot;sameAs&quot;) and rendered on the author card with clickable icons.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Instagram */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Instagram size={14} className="text-pink-600" /> Instagram Profile URL
                  </label>
                  <Input
                    value={authorSocials.find((s) => s.includes("instagram.com")) || ""}
                    onChange={(e) => updateSocialLink("instagram", e.target.value)}
                    placeholder="https://instagram.com/vishwas_mokashi"
                    className="text-xs"
                  />
                </div>

                {/* YouTube */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Youtube size={14} className="text-red-600" /> YouTube Channel / Video URL
                  </label>
                  <Input
                    value={authorSocials.find((s) => s.includes("youtube.com") || s.includes("youtu.be")) || ""}
                    onChange={(e) => updateSocialLink("youtube", e.target.value)}
                    placeholder="https://youtube.com/@store4riders"
                    className="text-xs"
                  />
                </div>

                {/* LinkedIn or Facebook */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Facebook size={14} className="text-blue-600" /> Facebook / LinkedIn Profile URL
                  </label>
                  <Input
                    value={authorSocials.find((s) => s.includes("facebook.com") || s.includes("linkedin.com")) || ""}
                    onChange={(e) => updateSocialLink("facebook", e.target.value)}
                    placeholder="https://facebook.com/store4riders"
                    className="text-xs"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                    <Globe size={14} className="text-slate-600" /> Personal Website / Portfolio URL
                  </label>
                  <Input
                    value={authorSocials.find((s) => !s.includes("instagram.com") && !s.includes("youtube.com") && !s.includes("youtu.be") && !s.includes("facebook.com") && !s.includes("linkedin.com")) || ""}
                    onChange={(e) => updateSocialLink("website", e.target.value)}
                    placeholder="https://store4riders.com"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Extra Custom Link Adder */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Add Any Additional Profile Link:
                </label>
                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    value={customSocialInput}
                    onChange={(e) => setCustomSocialInput(e.target.value)}
                    placeholder="https://twitter.com/... or https://..."
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const trimmed = customSocialInput.trim();
                      if (trimmed && !authorSocials.includes(trimmed)) {
                        setValue("author.sameAs", [...authorSocials, trimmed], { shouldDirty: true });
                        setCustomSocialInput("");
                      }
                    }}
                    className="text-xs font-bold shrink-0"
                  >
                    <Plus size={14} className="mr-1" /> Add Link
                  </Button>
                </div>
              </div>

              {/* Summary of Active Social Links */}
              {authorSocials.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Active Verified Links ({authorSocials.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {authorSocials.map((link, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        <ExternalLink size={11} className="text-slate-400" />
                        <span className="max-w-[200px] truncate">{link}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setValue(
                              "author.sameAs",
                              authorSocials.filter((_, i) => i !== idx),
                              { shouldDirty: true }
                            );
                          }}
                          className="hover:text-red-600 transition-colors cursor-pointer ml-1"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SEO & Meta */}
      {activeTab === "seo" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-brand" /> Search Engine Optimization (SEO)
            </h2>

            {/* Meta Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Meta Title
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    metaTitleValue.length > 60
                      ? "text-amber-600 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {metaTitleValue.length} / 60 recommended
                </span>
              </div>
              <Input
                {...register("metaTitle")}
                placeholder={titleValue || "SEO Title tag..."}
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Meta Description
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    metaDescriptionValue.length > 160
                      ? "text-amber-600 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {metaDescriptionValue.length} / 160 recommended
                </span>
              </div>
              <textarea
                {...register("metaDescription")}
                rows={3}
                placeholder={
                  excerptValue || "Concise, click-worthy summary for Google search snippets..."
                }
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand"
              />
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Meta Keywords
              </label>
              <Input
                {...register("metaKeywords")}
                placeholder="motorcycle helmets, riding gear guide, touring advice"
              />
            </div>
          </div>

          {/* Google Search Snippet Preview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" /> Google Search Preview
            </span>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-sans">
              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                <span className="font-semibold text-slate-800">store4riders.com</span>
                <span>› guides › post › {slugValue || slugify(titleValue || "article-url")}</span>
              </div>
              <h3 className="text-base text-blue-800 hover:underline font-medium cursor-pointer leading-tight">
                {metaTitleValue || titleValue || "Article Title | Store4Riders"}
              </h3>
              <p className="text-xs text-slate-600 leading-normal line-clamp-2">
                {metaDescriptionValue ||
                  excerptValue ||
                  "Read our comprehensive riding guide for motorcycle gear care, buying advice, and maintenance tips on Store4Riders."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Live Preview */}
      {activeTab === "preview" && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs space-y-6 max-w-4xl mx-auto">
          {videoEmbed ? (
            <div className="space-y-2">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-slate-300 bg-black">
                {videoEmbed.type === "youtube" || videoEmbed.type === "vimeo" ? (
                  <iframe
                    src={videoEmbed.embedUrl}
                    title="Live Preview Video"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video src={videoEmbed.embedUrl} controls className="w-full h-full object-cover" />
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand" />
                Featured Video Player rendered at top of post
              </p>
            </div>
          ) : featuredImageValue ? (
            <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden bg-slate-100">
              <Image
                src={featuredImageValue}
                alt={titleValue || "Preview"}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand/10 text-brand">
                {categories.find((c) => c._id === watch("categoryId"))?.name || "Riding Guide"}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={12} /> ~5 min read
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {titleValue || "Untitled Article"}
            </h1>

            {excerptValue && (
              <p className="text-sm text-slate-600 mt-3 font-medium leading-relaxed italic border-l-3 border-brand pl-3">
                {excerptValue}
              </p>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Rendered HTML */}
          <div
            className="prose prose-slate prose-sm sm:prose-base max-w-none leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-a:underline prose-a:font-medium"
            dangerouslySetInnerHTML={{ __html: contentValue || "<p class='text-slate-400 italic'>No content written yet.</p>" }}
          />
        </div>
      )}

      {/* MODAL: Suggest Related Article in Content */}
      <Modal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        title="Insert Related Article Recommendation Box"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500">
            Select a published article to embed a high-converting recommendation callout card into your article with an internal dofollow link.
          </p>

          <Input
            value={suggestSearch}
            onChange={(e) => setSuggestSearch(e.target.value)}
            placeholder="Search articles by title..."
            className="text-xs"
          />

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {filteredSuggestedArticles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No matching published articles found.
              </div>
            ) : (
              filteredSuggestedArticles.map((art) => (
                <div
                  key={art._id || art.slug}
                  onClick={() => handleSelectSuggestedArticle(art)}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-brand transition-colors truncate">
                      {art.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      /guides/post/{art.slug}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 group-hover:bg-brand group-hover:text-white transition-all shrink-0"
                  >
                    Insert Box
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSuggestModalOpen(false)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
