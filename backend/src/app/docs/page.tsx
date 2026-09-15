"use client";

import Script from "next/script";

export default function ApiDocs() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {/* Load Stoplight Elements Styles */}
      <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css" />

      {/* Render the Dual-Pane Dashboard */}
      {/* @ts-ignore */}
      <elements-api
        apiDescriptionUrl="/api/docs"
        router="memory"
        layout="sidebar"
      />

      {/* Load Stoplight Elements Script */}
      <Script src="https://unpkg.com/@stoplight/elements/web-components.min.js" strategy="afterInteractive" />
    </div>
  );
}
