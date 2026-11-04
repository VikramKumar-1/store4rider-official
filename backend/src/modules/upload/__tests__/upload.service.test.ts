import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";
import { UploadService } from "../upload.service";
import * as s3Module from "../../../core/storage/s3";

vi.mock("../../../core/storage/s3", () => ({
  getPresignedUrl: vi.fn().mockResolvedValue("https://s3.amazonaws.com/store4riders/uploads/presigned.webp"),
  uploadBufferToS3: vi.fn().mockImplementation(async (_buf, name) => `https://s3.amazonaws.com/store4riders/uploads/${name}`),
}));

describe("UploadService — Robust WebP & Quality Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Direct Image URL Detection", () => {
    it("should recognize direct image URLs ending with .jpg, .png, .webp without scraping HTML", async () => {
      const result = await UploadService.scrapeImagesFromUrl("https://example.com/products/helmet-front.webp");
      expect(result.isDirectImage).toBe(true);
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toBe("https://example.com/products/helmet-front.webp");
    });
  });

  describe("Rule: 'jo km hoga fir se compress na karega na quality khrab hoga'", () => {
    it("should bypass recompression when image is ALREADY optimal WebP to preserve 100% original quality", async () => {
      // 1. Create a clean, already-optimized small WebP image (50x50, small buffer)
      const originalWebpBuffer = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 },
        },
      })
        .webp({ quality: 85 })
        .toBuffer();

      // Mock global fetch to return this WebP buffer
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/webp" }),
        arrayBuffer: async () => originalWebpBuffer.buffer,
      });
      global.fetch = mockFetch;

      const result = await UploadService.importAndUploadImages([
        { url: "https://example.com/small-already-optimal.webp", altText: "Small WebP" },
      ]);

      expect(result.imported).toHaveLength(1);
      const uploaded = result.imported[0];

      // Verifies that recompression was skipped to prevent quality degradation
      expect(uploaded.skippedRecompression).toBe(true);
      expect(uploaded.compressedSize).toBe(originalWebpBuffer.length);
      expect(s3Module.uploadBufferToS3).toHaveBeenCalledWith(
        originalWebpBuffer,
        "small-already-optimal.webp",
        "image/webp"
      );
    });

    it("should convert uncompressed PNG/JPEG images to high-quality WebP", async () => {
      // Create a PNG image
      const pngBuffer = await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 4,
          background: { r: 0, g: 128, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/png" }),
        arrayBuffer: async () => pngBuffer.buffer,
      });
      global.fetch = mockFetch;

      const result = await UploadService.importAndUploadImages([
        { url: "https://example.com/raw-photo.png", altText: "Raw PNG" },
      ]);

      expect(result.imported).toHaveLength(1);
      const uploaded = result.imported[0];

      expect(uploaded.skippedRecompression).toBe(false);
      expect(uploaded.s3Url).toContain(".webp");
      expect(s3Module.uploadBufferToS3).toHaveBeenCalled();
    });
  });
});
