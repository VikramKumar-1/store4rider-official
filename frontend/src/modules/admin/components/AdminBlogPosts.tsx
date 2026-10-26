"use client";

import { useState } from "react";
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
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
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
            <p className="text-xs font-medium">Loading articles...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <FileText size={44} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-800">No blog posts found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              {search || categorySlug || status !== "all"
                ? "Try clearing your filters or search terms."
                : "Get started by creating your first article or syncing existing riding guides."}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Link href="/admin/blog/new">
                <Button className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-lg">
                  <Plus size={14} className="mr-1" /> New Article
                </Button>
              </Link>
              {totalCount === 0 && (
                <Button
                  onClick={handleSyncGuides}
                  disabled={seedContent.isPending}
                  variant="outline"
                  className="text-xs font-bold"
                >
                  Sync Guides (20)
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">Cover</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Reading Time</th>
                  <th className="py-3 px-4 text-center">Views</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {posts.map((post) => (
                  <tr key={post._id || post.slug} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-12 h-10 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
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
                            <BookOpen size={16} />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <Link
                        href={`/admin/blog/${post._id}/edit`}
                        className="font-bold text-slate-900 hover:text-brand transition-colors text-xs line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">/{post.slug}</span>
                        <Link
                          href={`/guides/post/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-brand inline-flex items-center gap-0.5 text-[10px]"
                          title="View live post"
                        >
                          <ExternalLink size={10} /> Live
                        </Link>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {post.categoryName ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {post.categoryName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {post.status === "published" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={10} /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={10} /> Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Clock size={11} className="text-slate-400" />
                        {post.readingTimeMinutes || 1} min
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Eye size={11} className="text-slate-400" />
                        {post.views || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/blog/${post._id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Article"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => setPostToDelete(post)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Article"
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
    </div>
  );
}
