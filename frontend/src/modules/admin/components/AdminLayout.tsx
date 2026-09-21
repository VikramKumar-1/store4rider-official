"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminAuthGuard } from "./AdminAuthGuard";

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
