import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Users,
  Box,
  ShoppingCart,
  Settings,
  LogOut,
  Tags,
  FolderTree,
  Truck,
  Database,
  LayoutTemplate,
  Globe,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter, usePathname } from "next/navigation";

interface SubItem {
  name: string;
  href: string;
  icon: any;
}

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: Home },
  {
    name: "Homepage",
    icon: LayoutTemplate,
    subItems: [
      { name: "Hero & SEO", href: "/admin/homepage/hero-seo", icon: Globe },
      { name: "Section Edit", href: "/admin/homepage/sections", icon: Layers },
    ],
  },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Products", href: "/admin/products", icon: Box },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Brands", href: "/admin/brands", icon: Tags },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Shipping", href: "/admin/shipping", icon: Truck },
  { name: "Bulk Upload", href: "/admin/products/migration", icon: Database },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isHomepageActive = pathname.startsWith("/admin/homepage");
  const [homepageOpen, setHomepageOpen] = useState(isHomepageActive);

  useEffect(() => {
    if (isHomepageActive) {
      setHomepageOpen(true);
    }
  }, [isHomepageActive]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-slate-800 flex items-center">
        <Link href="/admin" className="hover:opacity-80 transition-opacity block w-full">
          <img src="/Store4riders-Logo.jpg" alt="Store4Riders" className="h-10 w-full object-contain rounded" />
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          // If item has sub-items (like Homepage)
          if (item.subItems) {
            const isSubActive = item.subItems.some((sub) => pathname.startsWith(sub.href));

            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setHomepageOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    isSubActive
                      ? "bg-slate-800/80 text-white font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} className={isSubActive ? "text-brand" : "text-slate-400"} />
                    <span>{item.name}</span>
                  </div>
                  {homepageOpen ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </button>

                {homepageOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-5">
                    {item.subItems.map((sub) => {
                      const isChildActive = pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all ${
                            isChildActive
                              ? "bg-brand text-white font-semibold shadow-sm"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <sub.icon size={16} className={isChildActive ? "text-white" : "text-slate-400"} />
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Exact match for /admin, startsWith for others to handle sub-routes like /admin/products/[id]
          const isActive = item.href === "/admin" 
            ? pathname === "/admin" 
            : pathname.startsWith(item.href!);

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? "bg-brand text-white font-semibold shadow-md" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm font-bold mr-3">
            {user?.firstName?.[0] || "A"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
