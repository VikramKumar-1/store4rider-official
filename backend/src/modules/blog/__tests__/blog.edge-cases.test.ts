import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlogService } from "../blog.service";
import { BlogRepository } from "../blog.repository";
import { BlogValidator } from "../blog.validator";
import { NextRequest } from "next/server";
import { NotFoundError, ConflictError, ValidationError } from "../../../core/errors/AppError";

describe("Blog Module Edge Cases & Stress Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Slug Sanitization & Complex Formatting Edge Cases", () => {
    it("should handle complex emojis, punctuation, and multiple dashes in title", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue(null);
      vi.spyOn(BlogRepository, "createPost").mockImplementation(async (data) => ({
        _id: "p1",
        ...data,
      } as any));

      const post = await BlogService.createPost({
        title: "🔥 Top 10 Helmets in 2026: ECE 22.06 vs DOT -- What's Best?!!",
        content: "<p>Detailed breakdown of motorcycle helmets.</p>",
      });

      expect(post.slug).toBe("top-10-helmets-in-2026-ece-2206-vs-dot-whats-best");
      expect(post.slug).not.toContain("🔥");
      expect(post.slug).not.toContain("?");
      expect(post.slug).not.toContain("--");
    });

    it("should preserve manual slug when provided but normalize it", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue(null);
      vi.spyOn(BlogRepository, "createPost").mockImplementation(async (data) => ({
        _id: "p2",
        ...data,
      } as any));

      const post = await BlogService.createPost({
        title: "Generic Title",
        slug: "  CUSTOM-SLUG-WITH-SPACES & SPECIAL CH@RS!  ",
        content: "<p>Content goes here</p>",
      });

      expect(post.slug).toBe("custom-slug-with-spaces-special-chrs");
    });
  });

  describe("Content Parsing, XSS, and Word Count Extremes", () => {
    it("should safely compute word count and reading time on empty or whitespace HTML", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue(null);
      vi.spyOn(BlogRepository, "createPost").mockImplementation(async (data) => ({
        _id: "p3",
        ...data,
      } as any));

      const post = await BlogService.createPost({
        title: "Empty Content Test",
        content: "<p></p><div><span>   <br>  </span></div>",
      });

      expect(post.wordCount).toBe(0);
      expect(post.readingTimeMinutes).toBe(1); // Min reading time is always 1
    });

    it("should strip HTML and scripts when calculating word count", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue(null);
      vi.spyOn(BlogRepository, "createPost").mockImplementation(async (data) => ({
        _id: "p4",
        ...data,
      } as any));

      const htmlWithScript = `
        <h2>Safe Title</h2>
        <p>Motorcycle protective gear is essential for all touring riders in India.</p>
        <script>alert('xss'); window.location = 'http://attacker.com';</script>
        <div class="note">Always wear certified helmets.</div>
      `;

      const post = await BlogService.createPost({
        title: "Script Strip Test",
        content: htmlWithScript,
      });

      // Word count should only count visible words, not HTML tag tokens
      expect(post.wordCount).toBeGreaterThan(10);
      expect(post.wordCount).toBeLessThan(30);
    });

    it("should correctly compute high reading time for massive 5,000 word articles", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue(null);
      vi.spyOn(BlogRepository, "createPost").mockImplementation(async (data) => ({
        _id: "p5",
        ...data,
      } as any));

      // Generate 2,000 words
      const words = Array(2000).fill("motorcycle").join(" ");
      const post = await BlogService.createPost({
        title: "Massive 2000 Word Guide",
        content: `<p>${words}</p>`,
      });

      expect(post.wordCount).toBe(2000);
      expect(post.readingTimeMinutes).toBe(10); // 2000 / 200 = 10 min
    });
  });

  describe("Slug Conflict Edge Cases (Self-update vs Cross-update)", () => {
    it("should allow a post to keep its own slug when updated", async () => {
      vi.spyOn(BlogRepository, "findPostById").mockResolvedValue({
        _id: "post-100",
        title: "Original Post",
        slug: "original-post",
        content: "content",
      } as any);

      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue({
        _id: "post-100",
        slug: "original-post",
      } as any);

      vi.spyOn(BlogRepository, "updatePost").mockImplementation(async (id, data) => ({
        _id: id,
        ...data,
      } as any));

      const updated = await BlogService.updatePost("post-100", {
        title: "Original Post (Updated Edition)",
        slug: "original-post", // Keeping same slug
      });

      expect(updated.title).toBe("Original Post (Updated Edition)");
    });

    it("should throw ConflictError if trying to update slug to an existing other post", async () => {
      vi.spyOn(BlogRepository, "findPostById").mockResolvedValue({
        _id: "post-100",
        title: "Post 100",
        slug: "post-100",
        content: "content",
      } as any);

      // Slug 'post-200' belongs to a DIFFERENT post
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue({
        _id: "post-200",
        slug: "post-200",
      } as any);

      await expect(
        BlogService.updatePost("post-100", {
          title: "Post 100 Renamed",
          slug: "post-200",
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("Pagination and Query Bounds", () => {
    it("should clamp negative pages to 1 and limit to max 100", async () => {
      const findPostsSpy = vi.spyOn(BlogRepository, "findPosts").mockResolvedValue({
        items: [],
        totalCount: 0,
      });

      await BlogService.getPosts({
        page: -10,
        limit: 99999,
      });

      expect(findPostsSpy).toHaveBeenCalledWith(
        expect.anything(),
        1,   // Page clamped to 1
        100, // Limit clamped to 100
        "publishedAt",
        "desc"
      );
    });
  });

  describe("Category Recounting on Category Transfer", () => {
    it("should decrement old category and increment new category when post category changes", async () => {
      vi.spyOn(BlogRepository, "findPostById").mockResolvedValue({
        _id: "post-xyz",
        title: "Gear Care Guide",
        slug: "gear-care-guide",
        content: "content",
        categorySlug: "riding-gear-care",
      } as any);

      vi.spyOn(BlogRepository, "findCategoryById").mockResolvedValue({
        _id: "cat-new",
        name: "Motorcycle Touring",
        slug: "motorcycle-touring",
      } as any);

      vi.spyOn(BlogRepository, "updatePost").mockImplementation(async (id, data) => ({
        _id: id,
        ...data,
      } as any));

      const countSpy = vi.spyOn(BlogRepository, "countPostsByCategory")
        .mockResolvedValueOnce(5)  // count for new category
        .mockResolvedValueOnce(2); // count for old category

      const updateCountSpy = vi.spyOn(BlogRepository, "updateCategoryArticleCount").mockResolvedValue(undefined);

      await BlogService.updatePost("post-xyz", {
        categoryId: "cat-new",
      });

      expect(countSpy).toHaveBeenCalledWith("motorcycle-touring");
      expect(countSpy).toHaveBeenCalledWith("riding-gear-care");
      expect(updateCountSpy).toHaveBeenCalledWith("motorcycle-touring", 5);
      expect(updateCountSpy).toHaveBeenCalledWith("riding-gear-care", 2);
    });
  });

  describe("Related Posts Isolation", () => {
    it("should never return the current article in its own related posts list", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue({
        _id: "post-current",
        slug: "current-helmet-guide",
        categorySlug: "helmets",
        tags: ["safety", "touring"],
      } as any);

      const findRelatedSpy = vi.spyOn(BlogRepository, "findRelatedPosts").mockResolvedValue([
        { _id: "post-other-1", slug: "other-guide-1" } as any,
        { _id: "post-other-2", slug: "other-guide-2" } as any,
      ]);

      const related = await BlogService.getRelatedPosts("current-helmet-guide", 4);

      expect(findRelatedSpy).toHaveBeenCalledWith(
        "current-helmet-guide",
        "helmets",
        ["safety", "touring"],
        4
      );
      expect(related.length).toBe(2);
      expect(related.every((r) => r.slug !== "current-helmet-guide")).toBe(true);
    });

    it("should return empty array if slug is invalid", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue(null);
      const related = await BlogService.getRelatedPosts("unknown-slug");
      expect(related).toEqual([]);
    });
  });
});
