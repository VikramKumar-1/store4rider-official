"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User, Package, Heart, LogOut, MapPin, Settings } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const links = [
  { name: "Profile Details", path: "/account", icon: User },
  { name: "Addresses", path: "/account/addresses", icon: MapPin },
  { name: "Order History", path: "/account/orders", icon: Package },
  { name: "Wishlist", path: "/account/wishlist", icon: Heart },
];

export function AccountSidebar() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (!mounted || !isAuthenticated || !user) return null;

  const displayName = user.firstName 
    ? `${user.firstName} ${user.lastName || ""}`.trim() 
    : (user.name || user.email || "Rider");
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden sticky top-8">
        <div className="bg-zinc-900 text-white p-4 sm:p-6 pb-6 sm:pb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand text-white flex flex-col items-center justify-center font-bold text-lg sm:text-xl shadow-lg border-2 border-white/20 shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5 sm:mb-1">Welcome back</p>
              <h2 className="text-base sm:text-lg font-bold leading-tight truncate">{displayName}</h2>
              <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="p-2.5 sm:p-3 -mt-3 sm:-mt-4 bg-white rounded-t-2xl relative z-10">
          <nav className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1 sm:gap-1.5 pb-1 lg:pb-0">
            {links.map(link => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  href={link.path}
                  className={`flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap shrink-0 group ${
                    isActive 
                      ? "bg-brand/10 text-brand font-bold shadow-2xs" 
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
                  }`}
                >
                  <link.icon size={18} className={isActive ? "text-brand" : "text-zinc-400 group-hover:text-zinc-600 transition-colors"} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-xs sm:text-sm">{link.name}</span>
                </Link>
              );
            })}
            
            <div className="hidden lg:block h-px bg-zinc-100 my-2 mx-4"></div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-3.5 rounded-xl hover:bg-red-50 text-red-600 transition-all font-medium whitespace-nowrap shrink-0 group"
            >
              <LogOut size={18} className="text-red-400 group-hover:text-red-600 transition-colors" />
              <span className="text-xs sm:text-sm">Sign Out</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
}
