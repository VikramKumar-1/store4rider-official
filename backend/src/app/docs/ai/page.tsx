import Script from "next/script";

export default function ScalarDocs() {
  return (
    <>
      <style>{`
        body { margin: 0; padding: 0; background: #ffffff; }
        /* Make sure scalar mounts taking full height without cutting off */
        #api-reference { min-height: 100vh; width: 100%; display: block; }
        .back-button { position: fixed; top: 16px; right: 24px; z-index: 9999; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-family: sans-serif; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #2563eb; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .back-button:hover { background: #2563eb; transform: translateY(-1px); }
      `}</style>

      {/* Floating Back Button */}
      <a href="/docs" className="back-button">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Clean UI
      </a>

      {/* Scalar API Reference Mount Point with Default (Light) Theme */}
      <div id="api-reference" data-url="/api/docs" data-theme="default" />

      {/* Load Scalar Script */}
      <Script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" strategy="afterInteractive" />
    </>
  );
}
