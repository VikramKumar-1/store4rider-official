import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrandsDirectoryModule } from "../components/BrandsDirectoryModule";

// Mock child components that might need router/context
vi.mock("@/modules/homepage/components/TopBanner", () => ({
  default: () => <div data-testid="top-banner">TopBanner</div>,
}));

vi.mock("@/modules/homepage/components/Navbar", () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("@/modules/homepage/components/Footer", () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("@/components/ui/Breadcrumb", () => ({
  Breadcrumb: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockBrands = [
  { _id: "b1", name: "Axor Helmets", slug: "axor-helmets", isActive: true },
  { _id: "b2", name: "Rynox Gear", slug: "rynox-gear", isActive: true },
  { _id: "b3", name: "Motul", slug: "motul", isActive: true },
];

vi.mock("@/core/hooks/useBrands", () => ({
  useBrands: () => ({
    data: mockBrands,
    isLoading: false,
    error: null,
  }),
  useBrandsPageConfig: () => ({
    data: null,
    isLoading: false,
  }),
}));

describe("BrandsDirectoryModule", () => {
  it("renders with official Store4Riders 2016 multi-brand description and default title", () => {
    render(<BrandsDirectoryModule />);

    expect(screen.getByRole("heading", { level: 1, name: /shop by brand/i })).toBeDefined();
    expect(
      screen.getByText(/Store4Riders is an online multi-brand riding gear store launched in 2016/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Check out the brands we have on offer./i)
    ).toBeDefined();
  });

  it("renders the search input and alphabet filter navigation", () => {
    render(<BrandsDirectoryModule />);

    expect(screen.getByPlaceholderText(/Search brands/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /all brands/i })).toBeDefined();
  });

  it("renders custom initialConfig when passed from server or admin", () => {
    render(
      <BrandsDirectoryModule
        initialConfig={{
          heroTitle: "Premium Global Riding Gear",
          heroDescription: "Custom story configured by Store4Riders admin.",
        }}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: /premium global riding gear/i })).toBeDefined();
    expect(screen.getByText(/Custom story configured by Store4Riders admin./i)).toBeDefined();
  });

  it("renders brand cards with links to their brand page", () => {
    render(<BrandsDirectoryModule />);

    const brandLink = screen.getAllByRole("link", { name: /axor helmets/i });
    expect(brandLink.length).toBeGreaterThan(0);
    expect(brandLink[0].getAttribute("href")).toBe("/brands/axor-helmets");
  });
});
