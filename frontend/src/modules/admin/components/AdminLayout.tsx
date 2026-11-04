"use client";
import { ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminAuthGuard } from "./AdminAuthGuard";
import { useAdminLiveStream } from "@/core/hooks/useAdminLiveStream";

function AdminLiveStreamSubscriber() {
  useAdminLiveStream();
  return null;
}

const KNOWN_DASHBOARD_ROUTES = [
  "/admin/blog",
  "/admin/brands",
  "/admin/categories",
  "/admin/coupons",
  "/admin/homepage",
  "/admin/inquiries",
  "/admin/orders",
  "/admin/products",
  "/admin/search-terms",
  "/admin/settings",
  "/admin/shipping",
  "/admin/users",
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Any non-dashboard route under /admin (such as the secret login page) renders cleanly without sidebar
  const isDashboardRoute = pathname === "/admin" || KNOWN_DASHBOARD_ROUTES.some((route) => pathname.startsWith(route));

  if (!isDashboardRoute) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <AdminAuthGuard>
      <AdminLiveStreamSubscriber />
      <div className="fixed inset-0 flex overflow-hidden bg-slate-50 font-sans">
        <Suspense fallback={<aside className="w-64 bg-slate-900 shrink-0" />}>
          <AdminSidebar />
        </Suspense>
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-auto p-3 sm:p-4 lg:p-5 xl:p-6 overscroll-contain">
          <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Console...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
