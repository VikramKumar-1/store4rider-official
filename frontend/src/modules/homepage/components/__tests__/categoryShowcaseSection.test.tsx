import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { CategoryShowcaseSection } from "../CategoryShowcaseSection";

describe("CategoryShowcaseSection Component", () => {
  it("renders all 4 showcase categories correctly with default props", () => {
    render(<CategoryShowcaseSection />);

    // Verify all 4 category titles are displayed
    expect(screen.getByText("RIDING BOOTS")).toBeInTheDocument();
    expect(screen.getByText("RIDING PANTS")).toBeInTheDocument();
    expect(screen.getByText("MOTORCYCLE LUGGAGE")).toBeInTheDocument();
    expect(screen.getByText("BIKE ACCESSORIES AND SPARES")).toBeInTheDocument();

    // Verify placeholder texts are present
    expect(screen.getByText("PHOTO: RIDING BOOTS")).toBeInTheDocument();
    expect(screen.getByText("PHOTO: RIDING PANTS WITH KNEE ARMOUR")).toBeInTheDocument();
    expect(screen.getByText("PHOTO: TAIL BAG ON A TOURING BIKE")).toBeInTheDocument();
    expect(screen.getByText("PHOTO: AUXILIARY LIGHTS AND CHAIN CARE")).toBeInTheDocument();

    // Verify guide link and bottom motocross note
    expect(screen.getByRole("link", { name: "chain lubing guide." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "off-road and motocross gear." })).toBeInTheDocument();
  });

  it("renders with custom title and subtitle", () => {
    render(
      <CategoryShowcaseSection
        title="RIDER'S ESSENTIAL GEAR"
        subtitle="Curated gear for every rider"
      />
    );

    expect(screen.getByText("RIDER'S ESSENTIAL GEAR")).toBeInTheDocument();
    expect(
      screen.getByText("Curated gear for every rider")
    ).toBeInTheDocument();
  });
});
