import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { RidersFavouritesSection } from "../RidersFavouritesSection";

describe("RidersFavouritesSection Component", () => {
  it("renders default title and wireframe placeholder cards", () => {
    render(<RidersFavouritesSection />);

    expect(screen.getByText("RIDERS' FAVOURITES")).toBeInTheDocument();

    const placeholderNames = screen.getAllByText("[PRODUCT NAME]");
    expect(placeholderNames.length).toBe(4);

    const placeholderPhotos = screen.getAllByText("PRODUCT PHOTO");
    expect(placeholderPhotos.length).toBe(4);
  });

  it("renders custom subtitle when provided", () => {
    render(<RidersFavouritesSection subtitle="Featured Collections" />);
    expect(screen.getByText("Featured Collections")).toBeInTheDocument();
  });

  it("renders custom products when provided", () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Axor Apex Solid Helmet",
        brand: "AXOR",
        priceFormatted: "₹ 4,999",
        productUrl: "/axor-apex-solid-helmet",
      },
      {
        id: "prod-2",
        name: "Rynox Stealth Air Pro Jacket",
        brand: "RYNOX",
        priceFormatted: "₹ 7,250",
        productUrl: "/rynox-stealth-air-pro",
      },
    ];

    render(<RidersFavouritesSection products={mockProducts} />);

    expect(screen.getByText("Axor Apex Solid Helmet")).toBeInTheDocument();
    expect(screen.getByText("Rynox Stealth Air Pro Jacket")).toBeInTheDocument();
    expect(screen.getByText("AXOR")).toBeInTheDocument();
    expect(screen.getByText("₹ 4,999")).toBeInTheDocument();
    expect(screen.getByText("RYNOX")).toBeInTheDocument();
    expect(screen.getByText("₹ 7,250")).toBeInTheDocument();
  });
});
