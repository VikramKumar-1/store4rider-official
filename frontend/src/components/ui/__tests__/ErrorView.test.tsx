import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorView } from "../ErrorView";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="error-image" />
  ),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("ErrorView Component", () => {
  it("renders 404 broken link state correctly", () => {
    render(<ErrorView code={404} fullPage={false} />);
    expect(screen.getByText(/404 • Broken Link/i)).toBeDefined();
    expect(screen.getByText(/Broken Link — Route Snapped/i)).toBeDefined();
    const img = screen.getByTestId("error-image") as HTMLImageElement;
    expect(img.src).toContain("4-broken-link.jpg");
    expect(screen.getByText(/Back to Home/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Search helmets, jackets, gloves, boots/i)).toBeDefined();
  });

  it("renders 500 internal server error state with retry button", () => {
    const handleRetry = vi.fn();
    render(<ErrorView code={500} fullPage={false} onRetry={handleRetry} details="Database connection timeout" />);
    expect(screen.getByText(/500 • Internal Server Error/i)).toBeDefined();
    expect(screen.getByText(/Engine Trouble — Server Stalled/i)).toBeDefined();
    expect(screen.getByText(/Database connection timeout/i)).toBeDefined();
    const retryBtn = screen.getByText(/Try Again \/ Kickstart Engine/i);
    expect(retryBtn).toBeDefined();
    const img = screen.getByTestId("error-image") as HTMLImageElement;
    expect(img.src).toContain("3-internal-server-error.jpg");
  });

  it("renders 401 authorisation required state", () => {
    render(<ErrorView code={401} fullPage={false} />);
    expect(screen.getByText(/401 • Authorisation Required/i)).toBeDefined();
    expect(screen.getByText(/Sign In to Account/i)).toBeDefined();
    const img = screen.getByTestId("error-image") as HTMLImageElement;
    expect(img.src).toContain("1-auth-required.jpg");
  });

  it("renders 403 forbidden state", () => {
    render(<ErrorView code={403} fullPage={false} />);
    expect(screen.getByText(/403 • Restricted Trail/i)).toBeDefined();
    expect(screen.getByText(/Access Forbidden — Checkpoint Blocked/i)).toBeDefined();
    const img = screen.getByTestId("error-image") as HTMLImageElement;
    expect(img.src).toContain("5-forbidden.jpg");
  });

  it("renders 400 bad request state", () => {
    render(<ErrorView code={400} fullPage={false} />);
    expect(screen.getByText(/400 • Bad Request/i)).toBeDefined();
    expect(screen.getByText(/Off Track — Bad Request/i)).toBeDefined();
    const img = screen.getByTestId("error-image") as HTMLImageElement;
    expect(img.src).toContain("2-bad-request.jpg");
  });
});
