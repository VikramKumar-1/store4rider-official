import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SizeChartUploader } from "../SizeChartUploader";

vi.mock("@/core/api/client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock("@/core/utils/imageCompressor", () => ({
  compressImageToWebP: vi.fn().mockResolvedValue({
    file: new File(["dummy"], "chart.webp", { type: "image/webp" }),
    previewUrl: "blob:http://localhost/dummy",
    originalSize: 1024 * 500,
    compressedSize: 1024 * 120,
  }),
  uploadImageToS3: vi.fn().mockResolvedValue("https://store4riders.s3.ap-south-2.amazonaws.com/size-charts/chart.webp"),
}));

describe("SizeChartUploader Component Suite", () => {
  it("renders with default title, description, and empty state", () => {
    const onChange = vi.fn();
    render(
      <SizeChartUploader
        value=""
        onChange={onChange}
        title="Product Size Guide"
      />
    );

    expect(screen.getByText("Product Size Guide")).toBeDefined();
    expect(screen.getByText("No chart attached")).toBeDefined();
    expect(screen.getByText("Upload Image (Lossless WebP)")).toBeDefined();
    expect(screen.getByText("Paste URL (Extract to WebP)")).toBeDefined();
    expect(screen.getByText("HTML Table Code")).toBeDefined();
  });

  it("shows inherited category banner when no custom chart is set", () => {
    render(
      <SizeChartUploader
        value=""
        onChange={vi.fn()}
        categoryDefaultChart="https://store4riders.s3.ap-south-2.amazonaws.com/size-charts/helmets-size-guide.webp"
        categoryName="Full Face Helmets"
      />
    );

    expect(screen.getByText(/Inherited from Full Face Helmets/i)).toBeDefined();
    expect(screen.getByText(/Category Default Active/i)).toBeDefined();
    expect(screen.getByText("Preview Category Chart")).toBeDefined();
  });

  it("renders attached custom image chart with preview and clear buttons", () => {
    const onChange = vi.fn();
    render(
      <SizeChartUploader
        value="https://store4riders.s3.ap-south-2.amazonaws.com/custom-chart.webp"
        onChange={onChange}
      />
    );

    expect(screen.getByText(/Custom Image \(WebP\)/i)).toBeDefined();
    expect(screen.getByText("Attached Image Size Chart")).toBeDefined();

    const clearBtn = screen.getByTitle("Remove size chart");
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("switches to Paste URL tab and renders URL input", () => {
    render(
      <SizeChartUploader
        value=""
        onChange={vi.fn()}
      />
    );

    const urlTabBtn = screen.getByText("Paste URL (Extract to WebP)");
    fireEvent.click(urlTabBtn);

    expect(screen.getByPlaceholderText(/webpage URL/i)).toBeDefined();
    expect(screen.getByText("Extract & Convert to WebP")).toBeDefined();
  });

  it("switches to HTML Table Code tab and sanitizes on blur", () => {
    const onChange = vi.fn();
    render(
      <SizeChartUploader
        value='<table style="width: 900px;"><tr><td>M</td></tr></table>'
        onChange={onChange}
      />
    );

    const htmlTabBtn = screen.getByText("HTML Table Code");
    fireEvent.click(htmlTabBtn);

    const textarea = screen.getByRole("textbox");
    fireEvent.blur(textarea);

    expect(onChange).toHaveBeenCalled();
  });

  it("displays broken link warning and provides Clear Now button when image fails to load", () => {
    const onChange = vi.fn();
    render(
      <SizeChartUploader
        value="https://store4riders.s3.ap-south-2.amazonaws.com/size-charts/broken.webp"
        onChange={onChange}
      />
    );

    const img = screen.getByAltText("Size Chart Thumbnail");
    fireEvent.error(img);

    expect(screen.getByText("Dead Link")).toBeDefined();
    expect(screen.getByText(/Broken \/ Unreachable Size Chart Image/i)).toBeDefined();

    const clearNowBtn = screen.getByText("Clear Now");
    fireEvent.click(clearNowBtn);
    expect(onChange).toHaveBeenCalledWith("");
  });
});
