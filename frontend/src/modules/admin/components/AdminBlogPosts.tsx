"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Clock,
  BookOpen,
  FolderTree,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Globe,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { apiClient } from "@/core/api/client";
import {
  useAdminBlogPosts,
  useAdminBlogCategories,
  useDeleteBlogPost,
  useSeedBlogContent,
} from "@/core/hooks/useBlog";
import { IBlogPost } from "@store4riders/shared-types";
import { GUIDE_POSTS, GUIDE_CATEGORIES } from "@/modules/guides";

export function AdminBlogPosts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [postToDelete, setPostToDelete] = useState<IBlogPost | null>(null);

  // Parent /guides page SEO & Content state
  const [isPageSeoModalOpen, setIsPageSeoModalOpen] = useState(false);
  const [isSavingPageSeo, setIsSavingPageSeo] = useState(false);
  const [pageSeo, setPageSeo] = useState({
    heroTitle: "",
    heroDescription: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });

  const { data: postsData, isLoading } = useAdminBlogPosts({
    page,
    limit: 15,
    search: search.trim() || undefined,
    status,
    categorySlug: categorySlug || undefined,
  });

  const { data: categories = [] } = useAdminBlogCategories();
  const deletePost = useDeleteBlogPost();
  const seedContent = useSeedBlogContent();

  const posts = postsData?.items || [];
  const totalCount = postsData?.totalCount || 0;
  const totalPages = postsData?.totalPages || 1;

  useEffect(() => {
    apiClient
      .get("/blog/page-seo")
      .then((res) => {
        if (res.data?.data) {
          setPageSeo({
            heroTitle: res.data.data.heroTitle || "",
            heroDescription: res.data.data.heroDescription || "",
            metaTitle: res.data.data.metaTitle || "",
            metaDescription: res.data.data.metaDescription || "",
            metaKeywords: res.data.data.metaKeywords || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSavePageSeo = async () => {
    try {
      setIsSavingPageSeo(true);
      await apiClient.put("/blog/page-seo", pageSeo);
      toast.success("Blog homepage (/guides) content & SEO updated successfully!");
      setIsPageSeoModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update page content & SEO");
    } finally {
      setIsSavingPageSeo(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete?._id) return;
    await deletePost.mutateAsync(postToDelete._id);
    setPostToDelete(null);
  };

  const handleSyncGuides = async () => {
    await seedContent.mutateAsync({
      categories: GUIDE_CATEGORIES,
      posts: GUIDE_POSTS,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-brand" size={26} /> Blog & Articles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, edit, and publish expert motorcycle buying guides, gear care articles, and news.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalCount === 0 && !isLoading && (
            <Button
              onClick={handleSyncGuides}
              disabled={seedContent.isPending}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw size={14} className={seedContent.isPending ? "animate-spin" : ""} />
              {seedContent.isPending ? "Syncing..." : "Sync Guides (20)"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setIsPageSeoModalOpen(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
            title="Edit SEO for the /guides root homepage"
          >
            <Globe size={15} className="text-brand" />
            <span>/guides Home SEO</span>
          </Button>

          <Link href="/admin/blog/categories">
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
            >
              <FolderTree size={15} /> Categories ({categories.length})
            </Button>
          </Link>

          <Link href="/admin/blog/new">
            <Button className="bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 px-4 py-2.5 rounded-lg shadow-sm">
              <Plus size={16} /> New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Blog & Guides Directory Page Content & SEO Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-brand flex items-center justify-center shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Blog & Guides Root Page (<span className="text-brand font-mono">/guides</span>)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl truncate">
              {pageSeo.heroTitle || pageSeo.metaTitle || "Default: Motorcycle Guides & Expert Advice | Store4Riders"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPageSeoModalOpen(true)}
          className="text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <Edit2 size={13} />
          <span>Edit Hero Title, Description & SEO</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => {
                setStatus("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                status === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Articles
            </button>
            <button
              onClick={() => {
                setStatus("published");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                status === "published"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => {
                setStatus("draft");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                status === "draft"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Drafts
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search articles, tags..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand"
              />
            </div>

            <select
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading articles...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <FileText size={36} className="text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-700">No articles found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search || status !== "all" || categorySlug
                  ? "Try adjusting your filters or search query"
                  : "Get started by creating your first article or syncing defaults"}
              </p>
            </div>
            {totalCount === 0 && (
              <Button
                onClick={handleSyncGuides}
                disabled={seedContent.isPending}
                className="mt-2 bg-brand text-white text-xs font-bold"
              >
                Sync 20 Default Guides
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Article title & cover */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {post.featuredImage ? (
                            <Image
                              src={post.featuredImage}
                              alt={post.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <BookOpen size={18} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-md">
                          <Link
                            href={`/admin/blog/edit/${post._id}`}
                            className="font-bold text-slate-800 hover:text-brand line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="font-mono">/guides/{post.slug}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {post.readingTimeMinutes || 5} min read
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {post.categoryName || "Uncategorized"}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {post.author?.name || "Store4Riders"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {post.status === "published" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={11} /> Draft
                        </span>
                      )}
                    </td>

                    {/* Views */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {post.views || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/guides/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="View live article"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <Link
                          href={`/admin/blog/edit/${post._id}`}
                          className="p-1.5 text-slate-500 hover:text-brand hover:bg-red-50 rounded-md transition-colors"
                          title="Edit article"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => setPostToDelete(post)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete article"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Showing page <strong className="text-slate-800">{page}</strong> of{" "}
              <strong className="text-slate-800">{totalPages}</strong> ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs px-2.5 py-1"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs px-2.5 py-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        title="Confirm Article Deletion"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs sm:text-sm text-slate-600">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-slate-900">&quot;{postToDelete?.title}&quot;</span>?
          </p>
          <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            This action cannot be undone. The article and its URL route will be permanently removed.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setPostToDelete(null)}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deletePost.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4"
            >
              {deletePost.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Blog & Guides (/guides) Page Content & SEO Modal */}
      <Modal
        isOpen={isPageSeoModalOpen}
        onClose={() => setIsPageSeoModalOpen(false)}
        title="Edit Guides Page Hero Banner & SEO (/guides)"
      >
        <div className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Hero Banner */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block">
              🎨 1. Hero Section Content (Visible to Visitors)
            </span>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hero Title (Main Page Heading)
              </label>
              <Input
                value={pageSeo.heroTitle}
                onChange={(e) => setPageSeo({ ...pageSeo, heroTitle: e.target.value })}
                placeholder="Default: Motorcycle Guides & Expert Advice"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hero Description (Page Subtitle Paragraph)
              </label>
              <textarea
                value={pageSeo.heroDescription}
                onChange={(e) => setPageSeo({ ...pageSeo, heroDescription: e.target.value })}
                rows={3}
                placeholder="Default: Real-world gear tests, sizing walkthroughs, maintenance checklists, and touring preparation guides curated by riders for Indian roads and conditions."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Section 2: SEO Meta Tags */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block">
              🔍 2. Search Engine Metadata (Google Snippets)
            </span>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Title
              </label>
              <Input
                value={pageSeo.metaTitle}
                onChange={(e) => setPageSeo({ ...pageSeo, metaTitle: e.target.value })}
                placeholder="e.g. Motorcycle Guides & Expert Advice | Store4Riders"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={pageSeo.metaDescription}
                onChange={(e) => setPageSeo({ ...pageSeo, metaDescription: e.target.value })}
                rows={2}
                placeholder="e.g. Comprehensive buying guides, gear care advice, maintenance checklists, and touring preparation tips by Store4Riders."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Keywords
              </label>
              <Input
                value={pageSeo.metaKeywords}
                onChange={(e) => setPageSeo({ ...pageSeo, metaKeywords: e.target.value })}
                placeholder="e.g. motorcycle guides, riding gear guides, helmet guide, chain maintenance, store4riders"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsPageSeoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isSavingPageSeo}
              onClick={handleSavePageSeo}
              className="bg-brand text-white font-bold"
            >
              {isSavingPageSeo ? "Saving..." : "Save Page Content & SEO"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
