"use client";

import React, { useEffect } from "react";
import { ErrorView } from "@/components/ui/ErrorView";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error without breaking client
    if (process.env.NODE_ENV === "development") {
      console.error("[Runtime Error Caught in App Error Boundary]:", error);
    }
  }, [error]);

  const debugDetails =
    process.env.NODE_ENV === "development"
      ? error?.message
      : error?.digest
      ? `Error Reference: ${error.digest}`
      : undefined;

  return (
    <ErrorView
      code={500}
      onRetry={reset}
      details={debugDetails}
      fullPage={true}
    />
  );
}
