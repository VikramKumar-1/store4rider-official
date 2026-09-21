"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { AdminLogin } from "./AdminLogin";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (isAuthenticated && (!user?.role || user?.role === "customer")) {
        router.replace("/");
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  if (!user?.role || user?.role === "customer") {
    return <div className="h-screen w-full flex items-center justify-center">Redirecting...</div>;
  }

  return <>{children}</>;
}
