"use client";

import Script from "next/script";

export default function ScalarDocs() {
  return (
    <>
      <style>{`
        body { margin: 0; padding: 0; background: #ffffff; }
        #api-reference { min-height: 100vh; width: 100%; display: block; }
        .back-button { position: fixed; bottom: 24px; right: 24px; z-index: 9999; background: #ffffff; color: #111827; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-family: sans-serif; font-size: 14px; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .back-button:hover { background: #f9fafb; transform: translateY(-2px); }
      `}</style>

      {/* Floating Back Button */}
      <a href="/docs" className="back-button">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Standard Docs
      </a>

      {/* Scalar API Reference Mount Point */}
      <div id="api-reference" data-url="/api/docs" data-theme="default" />

      {/* Load Scalar Script securely */}
      <Script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" strategy="lazyOnload" />
    </>
  );
}
