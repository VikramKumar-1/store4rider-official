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

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden sticky top-8">
        <div className="bg-zinc-900 text-white p-6 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand text-white flex flex-col items-center justify-center font-bold text-xl shadow-lg border-2 border-white/20">
              {user.firstName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Welcome back</p>
              <h2 className="text-lg font-bold leading-tight">{user.firstName} {user.lastName}</h2>
            </div>
          </div>
        </div>
        
        <div className="p-3 -mt-4 bg-white rounded-t-2xl relative z-10">
          <nav className="flex flex-col gap-1">
            {links.map(link => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  href={link.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? "bg-brand/5 text-brand font-semibold" 
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium"
                  }`}
                >
                  <link.icon size={20} className={isActive ? "text-brand" : "text-zinc-400 group-hover:text-zinc-600 transition-colors"} strokeWidth={isActive ? 2.5 : 2} />
                  {link.name}
                </Link>
              );
            })}
            
            <div className="h-px bg-zinc-100 my-2 mx-4"></div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-red-50 text-red-600 transition-all font-medium group"
            >
              <LogOut size={20} className="text-red-400 group-hover:text-red-600 transition-colors" />
              Sign Out
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
}
