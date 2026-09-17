"use client";

import Script from "next/script";

export default function ApiDocs() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <style>{`
        .switch-button { position: fixed; bottom: 24px; right: 24px; z-index: 9999; background: #111827; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-family: sans-serif; font-size: 14px; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #374151; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .switch-button:hover { background: #374151; transform: translateY(-2px); }
      `}</style>
      
      {/* Floating Button to Modern Docs */}
      <a href="/docs/ai" className="switch-button">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        View Detailed Modern Docs
      </a>

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
