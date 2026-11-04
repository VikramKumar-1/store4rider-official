import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { DetailAndReviews } from "../DetailAndReviews";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock WriteReviewModal
vi.mock("../WriteReviewModal", () => ({
  WriteReviewModal: () => <div data-testid="mock-write-review-modal" />,
}));

describe("DetailAndReviews Component with Specifications", () => {
  it("renders description and does NOT show specifications table if attributes are missing", () => {
    render(
      <DetailAndReviews
        fullDescription="<p>Test description for helmet</p>"
        reviews={[]}
        productName="MT Blade 2"
      />
    );

    expect(screen.getByText(/Test description for helmet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Technical Specifications & Standards/i)).not.toBeInTheDocument();
  });

  it("renders specifications table when valid attributes are passed", () => {
    const attributes = {
      material: "High-Impact Polycarbonate",
      certification: "ECE 22.06 & ISI",
      pinlock_ready: "Pinlock 70 MaxVision Ready",
      closure_type: "Double D-Ring",
      ship_cost: "250", // Should be ignored
      attribute_set_code: "Helmets", // Should be ignored
    };

    render(
      <DetailAndReviews
        fullDescription="<p>Full face helmet description</p>"
        reviews={[]}
        productName="MT Blade 2"
        attributes={attributes}
      />
    );

    // Specification header is visible
    expect(screen.getByText(/Technical Specifications & Standards/i)).toBeInTheDocument();

    // Friendly formatted labels
    expect(screen.getByText(/Shell \/ Outer Material/i)).toBeInTheDocument();
    expect(screen.getByText("High-Impact Polycarbonate")).toBeInTheDocument();

    expect(screen.getByText(/Safety Standard & Certification/i)).toBeInTheDocument();
    expect(screen.getByText("ECE 22.06 & ISI")).toBeInTheDocument();

    // Core spec badge should be present for safety certification and closure
    expect(screen.getAllByText("Core Spec").length).toBeGreaterThanOrEqual(1);

    // Ignored keys should NOT be rendered
    expect(screen.queryByText("250")).not.toBeInTheDocument();
    expect(screen.queryByText("Helmets")).not.toBeInTheDocument();
  });

  it("strictly filters out legacy Magento junk (Condition, mangled keys, HTML size charts)", () => {
    const legacyJunkAttributes = {
      Condition: "New",
      '|"Unisex",Brand': "SMK Helmets",
      "Size Chart 01": "<p><strong>SMK Size Chart:</strong></p><table><tbody><tr><td>M</td></tr></tbody></table>",
    };

    render(
      <DetailAndReviews
        fullDescription="<p>Full face helmet description</p>"
        reviews={[]}
        productName="SMK Gullwing"
        attributes={legacyJunkAttributes}
      />
    );

    // Because all attributes were junk/HTML/filler and description had no bullet points, table must NOT be rendered
    expect(screen.queryByText(/Technical Specifications & Standards/i)).not.toBeInTheDocument();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
    expect(screen.queryByText(/SMK Size Chart/i)).not.toBeInTheDocument();
  });

  it("extracts real specifications from description bullet points when structured attributes are absent", () => {
    const descriptionWithSpecs = `
      <p>SMK Gullwing Modular Helmet</p>
      <ul>
        <li>External Shell: Aerodynamic Energy Impact Resistant Thermoplastic (EIRT)</li>
        <li>Homologation: Double ECE 22.05 (P/J) homologation</li>
        <li>Retention System: Quick release buckle with micrometric adjustment</li>
        <li>Visor: Scratch resistant with Pinlock 70 ready system</li>
      </ul>
    `;

    render(
      <DetailAndReviews
        fullDescription={descriptionWithSpecs}
        reviews={[]}
        productName="SMK Gullwing"
        attributes={{ Condition: "New" }} // only junk
      />
    );

    // Should extract and render the real specs into the table!
    expect(screen.getByText(/Technical Specifications & Standards/i)).toBeInTheDocument();
    expect(screen.getAllByText(/External Shell/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Aerodynamic Energy Impact Resistant Thermoplastic/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Homologation/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Double ECE 22.05/i).length).toBeGreaterThanOrEqual(2);
  });
});
