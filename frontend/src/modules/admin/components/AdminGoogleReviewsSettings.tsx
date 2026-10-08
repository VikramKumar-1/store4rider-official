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

        {/* 2. Key Input & Fetch Button Toolbar */}
        <div className="mt-6 pt-6 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
              SerpApi Key (Free API)
            </label>
            <input
              type="password"
              placeholder="Enter your SerpApi Key (or set SERPAPI_KEY in .env)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent font-mono"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5">
              Target Place: <strong>Store4Riders Pune</strong> (<code className="text-xs">0x3bc2c00d5a48819f:0xd4b529549919577c</code>)
            </p>
          </div>

          <div>
            <Button
              type="button"
              onClick={handleFetchAndSave}
              disabled={syncing}
              className="w-full h-[42px] bg-brand hover:bg-[#8F1207] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Fetching Latest 10..." : "Fetch & Save 10 Reviews"}
            </Button>
          </div>
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
