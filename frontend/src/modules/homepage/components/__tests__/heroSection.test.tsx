import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroSection } from "../HeroSection";
import { HeroSectionProps } from "../../types/homepage.types";

const mockFeaturedProducts = [
  {
    id: "prod-1",
    title: "Axor Apex Helmet",
    priceFormatted: "₹ 4,999",
    imageUrl: "/helmet.jpg",
    ctaText: "SHOP NOW",
    ctaUrl: "/products/axor-apex",
  },
  {
    id: "prod-2",
    title: "Rynox Air GT Jacket",
    priceFormatted: "₹ 5,850",
    imageUrl: "/jacket.jpg",
    ctaText: "SHOP NOW",
    ctaUrl: "/products/rynox-air-gt",
  },
];

describe("HeroSection Component Suite", () => {
  it("renders with slide-specific title, subtitle, and CTA button", () => {
    const props: HeroSectionProps = {
      subtitle: "DEFAULT SUBTITLE",
      title: "DEFAULT TITLE",
      bgImageUrl: "/default.jpg",
      featuredProducts: mockFeaturedProducts,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/slide1.jpg",
          title: "CUSTOM SLIDE 1 TITLE",
          subtitle: "SLIDE 1 BADGE",
          ctaText: "EXPLORE SLIDE 1",
          ctaLink: "/products/slide-1",
          showOverlay: true,
        },
        {
          id: "slide-2",
          imageUrl: "/slide2.jpg",
          title: "CUSTOM SLIDE 2 TITLE",
          subtitle: "SLIDE 2 BADGE",
          ctaText: "EXPLORE SLIDE 2",
          ctaLink: "/products/slide-2",
          showOverlay: true,
        },
      ],
    };

    render(<HeroSection {...props} />);

    // Slide 1 text should be visible on initial render
    expect(screen.getByText("CUSTOM SLIDE 1 TITLE")).toBeInTheDocument();
    expect(screen.getByText("SLIDE 1 BADGE")).toBeInTheDocument();
    expect(screen.getAllByText("EXPLORE SLIDE 1").length).toBeGreaterThanOrEqual(1);

    // Clicking slide indicator 2 changes active slide content
    const dot2 = screen.getByLabelText("Go to slide 2");
    fireEvent.click(dot2);

    expect(screen.getByText("CUSTOM SLIDE 2 TITLE")).toBeInTheDocument();
    expect(screen.getByText("SLIDE 2 BADGE")).toBeInTheDocument();
    expect(screen.getAllByText("EXPLORE SLIDE 2").length).toBeGreaterThanOrEqual(1);
  });

  it("completely removes the overlay card and button from DOM when showOverlay is false for a slide", () => {
    const props: HeroSectionProps = {
      subtitle: "FALLBACK SUBTITLE",
      title: "FALLBACK TITLE",
      bgImageUrl: "/default.jpg",
      featuredProducts: mockFeaturedProducts,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/graphic-banner.jpg",
          title: "HIDDEN CARD TITLE",
          subtitle: "HIDDEN BADGE",
          ctaText: "HIDDEN CTA",
          ctaLink: "/products/banner",
          showOverlay: false, // Turned OFF
        },
      ],
    };

    render(<HeroSection {...props} />);

    // Glassmorphic card and text should NOT be in the DOM at all
    expect(screen.queryByText("HIDDEN CARD TITLE")).not.toBeInTheDocument();
    expect(screen.queryByText("HIDDEN BADGE")).not.toBeInTheDocument();
    expect(screen.queryByText("HIDDEN CTA")).not.toBeInTheDocument();
  });

  it("completely removes the overlay card from DOM when global showOverlay is false", () => {
    const props: HeroSectionProps = {
      subtitle: "FALLBACK SUBTITLE",
      title: "FALLBACK TITLE",
      bgImageUrl: "/default.jpg",
      featuredProducts: mockFeaturedProducts,
      showOverlay: false, // Global OFF
      slides: [
        {
          id: "slide-1",
          imageUrl: "/image1.jpg",
          title: "TITLE 1",
          subtitle: "SUBTITLE 1",
          ctaText: "CTA 1",
          showOverlay: true,
        },
      ],
    };

    render(<HeroSection {...props} />);

    // Entire overlay text card should be unmounted
    expect(screen.queryByText("TITLE 1")).not.toBeInTheDocument();
    expect(screen.queryByText("SUBTITLE 1")).not.toBeInTheDocument();
    expect(screen.queryByText("CTA 1")).not.toBeInTheDocument();
  });

  it("falls back gracefully when slides array is empty or not provided", () => {
    const props: HeroSectionProps = {
      subtitle: "BROWSE THE COLLECTION",
      title: "RIDING GEAR THAT KEEPS YOU SAFE",
      bgImageUrl: "/heropic1.jpg",
      bgImageUrls: ["/heropic1.jpg", "/heropic2.jpg"],
      featuredProducts: mockFeaturedProducts,
      ctaText: "Shop Now",
      ctaLink: "/products",
      showOverlay: true,
    };

    render(<HeroSection {...props} />);

    expect(screen.getByText("RIDING GEAR THAT KEEPS YOU SAFE")).toBeInTheDocument();
    expect(screen.getByText("BROWSE THE COLLECTION")).toBeInTheDocument();
    expect(screen.getAllByText("Shop Now").length).toBeGreaterThan(0);
  });

  it("makes the entire background banner image clickable with the slide destination link", () => {
    const props: HeroSectionProps = {
      subtitle: "TEST SUBTITLE",
      title: "TEST TITLE",
      bgImageUrl: "/default.jpg",
      featuredProducts: mockFeaturedProducts,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/special-helmets.jpg",
          title: "SPECIAL HELMETS",
          ctaLink: "/motorcycle-helmets",
          showOverlay: false, // Pure banner mode
        },
      ],
    };

    render(<HeroSection {...props} />);

    // The whole background banner should be wrapped in an anchor link pointing to /motorcycle-helmets
    const bannerLink = screen.getByRole("link", { name: "SPECIAL HELMETS" });
    expect(bannerLink).toBeInTheDocument();
    expect(bannerLink).toHaveAttribute("href", "/motorcycle-helmets");
  });

  it("navigates slides with previous and next arrow buttons", () => {
    const props: HeroSectionProps = {
      subtitle: "TEST",
      title: "DEFAULT",
      bgImageUrl: "/default.jpg",
      featuredProducts: mockFeaturedProducts,
      slides: [
        {
          id: "slide-1",
          imageUrl: "/slide1.jpg",
          title: "FIRST SLIDE",
          showOverlay: true,
        },
        {
          id: "slide-2",
          imageUrl: "/slide2.jpg",
          title: "SECOND SLIDE",
          showOverlay: true,
        },
      ],
    };

    render(<HeroSection {...props} />);

    expect(screen.getByText("FIRST SLIDE")).toBeInTheDocument();

    // Click Next arrow
    const nextBtn = screen.getByLabelText("Next slide");
    fireEvent.click(nextBtn);
    expect(screen.getByText("SECOND SLIDE")).toBeInTheDocument();

    // Click Prev arrow
    const prevBtn = screen.getByLabelText("Previous slide");
    fireEvent.click(prevBtn);
    expect(screen.getByText("FIRST SLIDE")).toBeInTheDocument();
  });
});
