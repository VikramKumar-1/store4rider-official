import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlogService } from "../blog.service";
import { BlogRepository } from "../blog.repository";
import { NotFoundError, ConflictError, ValidationError } from "../../../core/errors/AppError";

describe("BlogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPost", () => {
    it("should throw ValidationError if title or content is missing", async () => {
      await expect(BlogService.createPost({ title: "", content: "abc" })).rejects.toThrow(ValidationError);
      await expect(BlogService.createPost({ title: "My Post", content: "" })).rejects.toThrow(ValidationError);
    });

    it("should auto-generate slug and calculate reading time and word count", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue(null);
      vi.spyOn(BlogRepository, "createPost").mockImplementation(async (data) => ({
        _id: "post123",
        ...data,
      } as any));
      vi.spyOn(BlogRepository, "countPostsByCategory").mockResolvedValue(1);
      vi.spyOn(BlogRepository, "updateCategoryArticleCount").mockResolvedValue(undefined);

      const post = await BlogService.createPost({
        title: "Top 5 Helmets for Monsoon Riding",
        content: "<p>This is a guide on choosing helmets in wet monsoon season in India.</p>",
        categorySlug: "helmets",
      });

      expect(post.slug).toBe("top-5-helmets-for-monsoon-riding");
      expect(post.wordCount).toBeGreaterThan(0);
      expect(post.readingTimeMinutes).toBe(1);
      expect(BlogRepository.createPost).toHaveBeenCalled();
    });

    it("should throw ConflictError if slug already exists", async () => {
      vi.spyOn(BlogRepository, "findPostBySlug").mockResolvedValue({
        _id: "existing123",
        slug: "top-5-helmets",
      } as any);

      await expect(
        BlogService.createPost({
          title: "Top 5 Helmets",
          content: "Some content here...",
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("updatePost", () => {
    it("should update post content and recalculate word count", async () => {
      vi.spyOn(BlogRepository, "findPostById").mockResolvedValue({
        _id: "post123",
        title: "Old Title",
        slug: "old-title",
        content: "short content",
        wordCount: 2,
        readingTimeMinutes: 1,
      } as any);

      vi.spyOn(BlogRepository, "updatePost").mockImplementation(async (id, data) => ({
        _id: id,
        ...data,
      } as any));

      const updated = await BlogService.updatePost("post123", {
        title: "Updated Title",
        content: "<p>New comprehensive guide with much more detailed content about motorcycle maintenance in India.</p>",
      });

      expect(updated.title).toBe("Updated Title");
      expect(updated.wordCount).toBeGreaterThan(5);
    });

    it("should throw NotFoundError if post does not exist", async () => {
      vi.spyOn(BlogRepository, "findPostById").mockResolvedValue(null);

      await expect(
        BlogService.updatePost("non-existent-id", { title: "Test" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deletePost", () => {
    it("should delete post and update category count", async () => {
      vi.spyOn(BlogRepository, "deletePost").mockResolvedValue({
        _id: "post123",
        categorySlug: "riding-gear",
      } as any);
      vi.spyOn(BlogRepository, "countPostsByCategory").mockResolvedValue(0);
      vi.spyOn(BlogRepository, "updateCategoryArticleCount").mockResolvedValue(undefined);

      const deleted = await BlogService.deletePost("post123");
      expect(deleted._id).toBe("post123");
      expect(BlogRepository.updateCategoryArticleCount).toHaveBeenCalledWith("riding-gear", 0);
    });
  });

  describe("categories", () => {
    it("should create category with slugified name", async () => {
      vi.spyOn(BlogRepository, "findCategoryBySlug").mockResolvedValue(null);
      vi.spyOn(BlogRepository, "createCategory").mockImplementation(async (data) => ({
        _id: "cat123",
        ...data,
      } as any));

      const cat = await BlogService.createCategory({
        name: "Helmet Maintenance",
        description: "Tips to maintain helmets",
      });

      expect(cat.slug).toBe("helmet-maintenance");
      expect(BlogRepository.createCategory).toHaveBeenCalled();
    });

    it("should throw ConflictError if category slug already exists", async () => {
      vi.spyOn(BlogRepository, "findCategoryBySlug").mockResolvedValue({
        _id: "existing-cat",
        slug: "helmets",
      } as any);

      await expect(
        BlogService.createCategory({
          name: "Helmets",
        })
      ).rejects.toThrow(ConflictError);
    });
  });
});
