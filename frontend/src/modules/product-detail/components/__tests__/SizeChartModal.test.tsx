import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SizeChartModal,
  cleanSizeChartHtml,
  resolveSizeChartImageUrl,
} from "../SizeChartModal";

describe("SizeChartModal & Sanitizer Suite", () => {
  describe("cleanSizeChartHtml", () => {
    it("strips rigid inline styles (width, height, float) from tables and cells", () => {
      const rawHtml = `
        <table style="height: 286px; width: 928px;">
          <tbody>
            <tr>
              <th style="height: 18px; width: 176.875px; text-align: center;">Description</th>
              <th style="width: 238.25px; text-align: center;">Waist</th>
            </tr>
          </tbody>
        </table>
      `;
      const cleaned = cleanSizeChartHtml(rawHtml);
      expect(cleaned).not.toContain("928px");
      expect(cleaned).not.toContain("176.875px");
      expect(cleaned).not.toContain("238.25px");
      expect(cleaned).toContain("text-align: center;");
    });

    it("strips fixed width and height HTML attributes", () => {
      const rawHtml = `<table width="800" height="400"><tr><td width="200">Data</td></tr></table>`;
      const cleaned = cleanSizeChartHtml(rawHtml);
      expect(cleaned).not.toContain('width="800"');
      expect(cleaned).not.toContain('height="400"');
      expect(cleaned).not.toContain('width="200"');
    });

    it("resolves Magento {{media url=...}} tokens into AWS S3 URLs", () => {
      const rawHtml = `<img style="float: left;" src="{{media url="wysiwyg/Rynox product description photos/Rynox Optimus Tank Bag_2024_size_chart.jpg"}}" alt="Size Chart" width="544" height="725">`;
      const cleaned = cleanSizeChartHtml(rawHtml);
      expect(cleaned).toContain("https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/Rynox%20product%20description%20photos/Rynox%20Optimus%20Tank%20Bag_2024_size_chart.jpg");
      expect(cleaned).not.toContain('width="544"');
      expect(cleaned).not.toContain("float: left");
    });

    it("strips unscoped <style> blocks that pollute global table layout", () => {
      const rawHtml = `<style> table { width: 100%; border: 1px solid red; } </style><div><table><tr><td>XS</td></tr></table></div>`;
      const cleaned = cleanSizeChartHtml(rawHtml);
      expect(cleaned).not.toContain("<style>");
      expect(cleaned).not.toContain("border: 1px solid red");
      expect(cleaned).toContain("<table>");
    });

    it("unescapes doubled quotes from CSV import", () => {
      const rawHtml = `<div class=""catalog-size-chart""><p>""Test""</p></div>`;
      const cleaned = cleanSizeChartHtml(rawHtml);
      expect(cleaned).toContain('class="catalog-size-chart"');
      expect(cleaned).toContain('"Test"');
      expect(cleaned).not.toContain('""');
    });

    it("ensures external anchor links have target='_blank' and rel='noopener noreferrer'", () => {
      const rawHtml = `<p>Check measuring video <a href="https://youtube.com/watch?v=123">Click here</a></p>`;
      const cleaned = cleanSizeChartHtml(rawHtml);
      expect(cleaned).toContain('target="_blank"');
      expect(cleaned).toContain('rel="noopener noreferrer"');
    });
  });

  describe("resolveSizeChartImageUrl", () => {
    it("converts Magento media token to AWS S3 URL", () => {
      const url = `{{media url="wysiwyg/helmets/size-guide.jpg"}}`;
      const resolved = resolveSizeChartImageUrl(url);
      expect(resolved).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/helmets/size-guide.jpg");
    });

    it("converts /media/ path to AWS S3 URL", () => {
      const url = "/media/wysiwyg/jackets/chart.png";
      const resolved = resolveSizeChartImageUrl(url);
      expect(resolved).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/jackets/chart.png");
    });

    it("normalizes external image URL", () => {
      const url = "https://images.unsplash.com/photo-123.jpg";
      const resolved = resolveSizeChartImageUrl(url);
      expect(resolved).toBe(url);
    });
  });

  describe("SizeChartModal Component", () => {
    const sampleHtmlTable = `
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Chest (inches)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>M</td>
            <td>38 - 40</td>
          </tr>
        </tbody>
      </table>
    `;

    it("renders nothing when isOpen is false", () => {
      const { container } = render(
        <SizeChartModal
          isOpen={false}
          onClose={vi.fn()}
          sizeChart={sampleHtmlTable}
          productName="Rynox Jacket"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when sizeChart is empty or undefined", () => {
      const { container } = render(
        <SizeChartModal
          isOpen={true}
          onClose={vi.fn()}
          sizeChart=""
          productName="Rynox Jacket"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders modal dialog with clean table when open", () => {
      render(
        <SizeChartModal
          isOpen={true}
          onClose={vi.fn()}
          sizeChart={sampleHtmlTable}
          productName="Rynox Urban Jacket"
        />
      );

      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Size Guide")).toBeDefined();
      expect(screen.getByText("Rynox Urban Jacket")).toBeDefined();
      expect(screen.getByText("Chest (inches)")).toBeDefined();
      expect(screen.getByText("38 - 40")).toBeDefined();
    });

    it("renders image tag when sizeChart is a direct image URL", () => {
      render(
        <SizeChartModal
          isOpen={true}
          onClose={vi.fn()}
          sizeChart="https://store4riders.s3.ap-south-2.amazonaws.com/size-chart.png"
          productName="Axor Helmet"
        />
      );

      const img = screen.getByAltText("Size Guide") as HTMLImageElement;
      expect(img).toBeDefined();
      expect(img.src).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/size-chart.png");
    });

    it("calls onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(
        <SizeChartModal
          isOpen={true}
          onClose={onClose}
          sizeChart={sampleHtmlTable}
        />
      );

      const closeBtn = screen.getByLabelText("Close size guide");
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      render(
        <SizeChartModal
          isOpen={true}
          onClose={onClose}
          sizeChart={sampleHtmlTable}
        />
      );

      const backdrop = screen.getByRole("dialog");
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes when Escape key is pressed", () => {
      const onClose = vi.fn();
      render(
        <SizeChartModal
          isOpen={true}
          onClose={onClose}
          sizeChart={sampleHtmlTable}
        />
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
