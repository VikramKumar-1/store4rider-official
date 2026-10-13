"use client";

import React, { useState, useEffect } from "react";
import { StarIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

interface StoreReview {
  _id?: string;
  id?: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  link?: string;
  avatarUrl?: string;
  source?: string;
  createdAt?: string;
}

export function AdminGoogleReviewsSettings() {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchReviews();
    const savedKey = localStorage.getItem("SERPAPI_KEY");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews/store");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReviews(json.data);
      }
    } catch {
      toast.error("Failed to load saved store reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAndSave = async () => {
    setSyncing(true);
    try {
      if (apiKey) {
        localStorage.setItem("SERPAPI_KEY", apiKey.trim());
      }

      const res = await fetch("/api/reviews/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() || undefined }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to fetch reviews");
      }

      const updatedReviews = json.data || [];
      setReviews(updatedReviews);
      toast.success(`Successfully fetched & saved ${updatedReviews.length} latest Google reviews!`);
    } catch (err: any) {
      toast.error(err.message || "Error fetching Google reviews");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Header Card */}
      <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Google Store Reviews (SerpApi)</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Fetch the latest 10 verified Google customer reviews for Store4Riders Pune and save them to the database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                reviews.length > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {reviews.length > 0 ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  {reviews.length} Reviews Active on Homepage
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                  No Reviews Synced
                </>
              )}
            </span>
          </div>
        </div>

        {/* 2. Key Status & Fetch Button Toolbar */}
        <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                SERPAPI_KEY Connected (.env)
              </span>
              <span className="text-xs text-neutral-500">
                Location: <strong>Store4Riders Pune</strong>
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              The API key is already configured on the server. You can click <strong>Sync Latest 10 Reviews</strong> anytime to pull live Google reviews.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="button"
              onClick={handleFetchAndSave}
              disabled={syncing}
              className="h-[42px] px-6 bg-brand hover:bg-[#8F1207] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg shadow-sm cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing Latest 10..." : "Sync Latest 10 Reviews"}
            </Button>
          </div>
        </div>

        {/* Optional Custom Key Override */}
        <div className="mt-4 pt-3 border-t border-dashed border-neutral-200">
          <details className="text-xs group">
            <summary className="cursor-pointer text-neutral-500 hover:text-neutral-800 font-medium select-none flex items-center gap-1.5">
              <span>Change or override SerpApi Key (Optional)</span>
            </summary>
            <div className="mt-2.5 flex items-center gap-2 max-w-lg">
              <input
                type="password"
                placeholder="Paste custom SerpApi key only if overriding .env"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKey("");
                    localStorage.removeItem("SERPAPI_KEY");
                  }}
                  className="text-xs text-neutral-400 hover:text-red-500 shrink-0 font-medium px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>
          </details>
        </div>
      </div>

      {/* 3. Reviews List Preview */}
      <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wide">
            Currently Saved Google Reviews ({reviews.length})
          </h3>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="text-xs font-semibold text-neutral-500 hover:text-brand flex items-center gap-1 transition-colors"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
            <p className="text-sm font-semibold text-neutral-600">No store reviews in the database yet.</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Click the <strong>&ldquo;Fetch &amp; Save 10 Reviews&rdquo;</strong> button above to pull the latest 10 real Google customer reviews.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev, idx) => (
              <div
                key={rev._id || rev.id || idx}
                className="p-4 rounded border border-neutral-200 bg-neutral-50 flex flex-col justify-between hover:border-brand/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#4a1c1c] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {rev.avatarUrl ? (
                          <img src={rev.avatarUrl} alt={rev.author} className="w-full h-full object-cover" />
                        ) : (
                          rev.author.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900">{rev.author}</div>
                        <div className="text-[10px] text-neutral-400">{rev.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? "text-[#FFD700]" : "text-neutral-200"}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">
                    {rev.text}
                  </p>
                </div>

                {rev.link && (
                  <div className="mt-3 pt-2 border-t border-neutral-200/60 flex justify-end">
                    <a
                      href={rev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-brand hover:underline inline-flex items-center gap-1"
                    >
                      View on Google Maps
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
