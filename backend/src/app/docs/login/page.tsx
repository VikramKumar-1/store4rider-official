"use client";

import { useState } from "react";
import { loginDocs } from "./actions";

export default function DocsLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await loginDocs(formData);
    
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        .bg-glow-1 { position: absolute; top: -10%; left: -10%; width: 500px; height: 500px; background: rgba(59, 130, 246, 0.1); filter: blur(80px); border-radius: 50%; z-index: 0; }
        .bg-glow-2 { position: absolute; bottom: -10%; right: -10%; width: 500px; height: 500px; background: rgba(168, 85, 247, 0.1); filter: blur(80px); border-radius: 50%; z-index: 0; }
        .card { position: relative; z-index: 10; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); }
        .icon-container { display: flex; justify-content: center; align-items: center; width: 56px; height: 56px; background: #eff6ff; border-radius: 50%; margin: 0 auto 20px; border: 1px solid #bfdbfe; }
        .icon { width: 28px; height: 28px; color: #2563eb; }
        h1 { text-align: center; margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
        p { text-align: center; margin: 0 0 28px; font-size: 14px; color: #64748b; line-height: 1.5; }
        label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
        input { width: 100%; box-sizing: border-box; padding: 12px 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; color: #0f172a; font-size: 15px; outline: none; transition: all 0.2s; }
        input:focus { border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        input::placeholder { color: #94a3b8; }
        .error { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 10px; font-size: 14px; margin-top: 16px; font-weight: 500; }
        .btn { width: 100%; padding: 14px; background: #0f172a; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 24px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1); }
        .btn:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(15, 23, 42, 0.15); }
        .btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
      `}</style>
      
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>
      
      <div className="card">
        <div className="icon-container">
          <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1>API Secure Access</h1>
        <p>Enter the developer password to access the Store4Riders Documentation Dashboard.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="password">Admin Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            disabled={isLoading}
            placeholder="••••••••••••"
          />

          {error && (
            <div className="error">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Unlock Dashboard"}
          </button>
        </form>
      </div>
    </>
  );
}
