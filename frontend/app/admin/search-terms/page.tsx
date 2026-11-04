import { Suspense } from "react";
import AdminSearchRedirectsManager from "@/modules/admin/components/AdminSearchRedirectsManager";

export const metadata = {
  title: "Search Term Redirects | Admin | Store4Riders",
  description: "Define search query to category landing page redirects",
};

export default function AdminSearchTermsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Search Terms & Category Redirects
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Map specific shopper search queries (and common misspellings) to automatically load dedicated category pages.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="bg-white p-8 rounded-xl border border-neutral-200 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-neutral-500 font-medium text-sm">Loading search redirects console...</p>
          </div>
        }
      >
        <AdminSearchRedirectsManager />
      </Suspense>
    </div>
  );
}
