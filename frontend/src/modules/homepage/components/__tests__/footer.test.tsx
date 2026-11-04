import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

vi.mock("@/core/hooks/usePaymentSettings", () => ({
  usePublicSettings: () => ({
    data: {
      footerConfig: {
        column1Title: "EXCHANGE & REPLACEMENTS",
        column2Title: "SUPPORT AND SERVICES",
        column3Title: "POLICIES & LEGAL",
        column4Title: "ABOUT US",
      },
    },
  }),
}));

describe("Footer Component Navigation Architecture", () => {
  it("renders distinct tabs for About Us, Exchange, Policies, and Support", () => {
    render(<Footer />);

    // Verify all 4 tab headings exist
    expect(screen.getByText("ABOUT US")).toBeInTheDocument();
    expect(screen.getByText("EXCHANGE & REPLACEMENTS")).toBeInTheDocument();
    expect(screen.getByText("POLICIES & LEGAL")).toBeInTheDocument();
    expect(screen.getByText("SUPPORT AND SERVICES")).toBeInTheDocument();

    // Verify About Us and Contact Us are rendered
    expect(screen.getByRole("link", { name: "About us" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact Us" })).toBeInTheDocument();

    // Verify Policy links are rendered
    expect(screen.getByRole("link", { name: "Conditions of Sale & Use" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy and Cookie Policy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Legal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Store Policies" })).toBeInTheDocument();

    // Verify Exchange links are rendered
    expect(screen.getByRole("link", { name: "Exchange & Replacements" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Warranty" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shipping Policies" })).toBeInTheDocument();

    // Verify Support links are rendered
    expect(screen.getByRole("link", { name: "Your Account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rider Assist" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cash on Delivery" })).toBeInTheDocument();
  });
});
