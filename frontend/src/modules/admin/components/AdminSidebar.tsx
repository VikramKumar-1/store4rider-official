import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ChevronLeft,
  Instagram,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Search,
  Plus,
  BookOpen,
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
  allowedRoles?: string[];
}

const navItems: NavItem[] = [
  // 1. Orders
  { 
    name: "Orders", 
    icon: ShoppingCart, 
    allowedRoles: ["super_admin", "admin", "logistic", "order_manager"],
    subItems: [
      { name: "All Placed Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Failed Transactions", href: "/admin/orders/failed", icon: AlertTriangle },
      { name: "Exchange Requests", href: "/admin/orders/exchanges", icon: RefreshCw },
    ],
  },
  // 2. Logistics
  { 
    name: "Logistics", 
    href: "/admin/shipping", 
    icon: Truck, 
    allowedRoles: ["super_admin", "admin", "logistic"] 
  },
  // 3. Products
  { 
    name: "Products", 
    href: "/admin/products", 
    icon: Box, 
    allowedRoles: ["super_admin", "admin"] 
  },
  // 4. Blogs
  { 
    name: "Blog", 
    icon: BookOpen, 
    allowedRoles: ["super_admin", "admin"],
    subItems: [
      { name: "All Articles", href: "/admin/blog", icon: FileText },
      { name: "New Article", href: "/admin/blog/new", icon: Plus },
      { name: "Categories", href: "/admin/blog/categories", icon: FolderTree },
    ],
  },
  // 5. Homepage
  {
    name: "Homepage",
    icon: LayoutTemplate,
    allowedRoles: ["super_admin", "admin"],
    subItems: [
      { name: "Hero & SEO", href: "/admin/homepage/hero-seo", icon: Globe },
      { name: "Section Edit", href: "/admin/homepage/sections", icon: Layers },
      { name: "Store4Riders on Insta", href: "/admin/homepage/reels", icon: Instagram },
    ],
  },
  // Remaining items
  { 
    name: "Dashboard", 
    href: "/admin", 
    icon: Home, 
    allowedRoles: ["super_admin", "admin"] 
  },
  { 
    name: "Categories", 
    href: "/admin/categories", 
    icon: FolderTree, 
    allowedRoles: ["super_admin", "admin"] 
  },
  { 
    name: "Brands", 
    href: "/admin/brands", 
    icon: Tags, 
    allowedRoles: ["super_admin", "admin"] 
  },
  { 
    name: "Users", 
    icon: Users, 
    allowedRoles: ["super_admin", "admin"],
    subItems: [
      { name: "Staff & Team", href: "/admin/users?tab=staff", icon: ShieldCheck },
      { name: "Customers", href: "/admin/users?tab=customers", icon: UserCheck },
    ],
  },
  { 
    name: "Contact Inquiries", 
    href: "/admin?tab=inquiries", 
    icon: MessageSquare, 
    allowedRoles: ["customer_care", "customer_support", "super_admin", "admin"] 
  },
  { 
    name: "Order Search", 
    href: "/admin?tab=orders", 
    icon: Search, 
    allowedRoles: ["customer_care", "customer_support"] 
  },
  { 
    name: "Failed Transactions", 
    href: "/admin/orders/failed", 
    icon: AlertTriangle, 
    allowedRoles: ["customer_care", "customer_support"] 
  },
  { 
    name: "Bulk Upload", 
    href: "/admin/products/migration", 
    icon: Database, 
    allowedRoles: ["super_admin", "admin"] 
  },
  { 
    name: "Settings", 
    href: "/admin/settings", 
    icon: Settings, 
    allowedRoles: ["super_admin", "admin"] 
  },
];

const getRoleBadge = (role?: string) => {
  switch (role) {
    case "super_admin":
      return { label: "Super Admin", className: "bg-red-500/20 text-red-400 border border-red-500/30" };
    case "admin":
      return { label: "Admin", className: "bg-blue-500/20 text-blue-400 border border-blue-500/30" };
    case "logistic":
      return { label: "Logistics", className: "bg-amber-500/20 text-amber-400 border border-amber-500/30" };
    case "customer_care":
    case "customer_support":
      return { label: "Customer Care", className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
    default:
      return { label: role?.replace("_", " ") || "Staff", className: "bg-slate-800 text-slate-300 border border-slate-700" };
  }
};

export function AdminSidebar() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Orders: pathname.startsWith("/admin/orders"),
    Blog: pathname.startsWith("/admin/blog"),
    Homepage: pathname.startsWith("/admin/homepage"),
    Users: pathname.startsWith("/admin/users"),
  });

  useEffect(() => {
    if (pathname.startsWith("/admin/orders")) {
      setOpenMenus(prev => ({ ...prev, Orders: true }));
    }
    if (pathname.startsWith("/admin/blog")) {
      setOpenMenus(prev => ({ ...prev, Blog: true }));
    }
    if (pathname.startsWith("/admin/homepage")) {
      setOpenMenus(prev => ({ ...prev, Homepage: true }));
    }
    if (pathname.startsWith("/admin/users")) {
      setOpenMenus(prev => ({ ...prev, Users: true }));
    }
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return user?.role && item.allowedRoles.includes(user.role);
  });

  const roleBadge = getRoleBadge(user?.role);

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl z-10">
      <div className="p-6 border-b border-slate-800 flex items-center">
        <Link href={user?.role === "logistic" ? "/admin/shipping" : "/admin"} className="hover:opacity-80 transition-opacity block w-full relative h-10">
          <Image
            src="/Store4riders-Logo.jpg"
            alt="Store4Riders"
            fill
            sizes="200px"
            className="object-contain rounded"
            priority
          />
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {filteredNavItems.map((item) => {
          // If item has sub-items (like Orders, Blog, Homepage or Users)
          if (item.subItems) {
            const isSubActive = item.subItems.some((sub) => {
              const baseHref = sub.href.split("?")[0];
              return pathname === baseHref || pathname.startsWith(baseHref + "/");
            });
            const isOpen = openMenus[item.name] ?? isSubActive;

            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleMenu(item.name)}
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
                  {isOpen ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-5">
                    {item.subItems.map((sub) => {
                      const isChildActive = sub.href === "/admin/orders"
                        ? (pathname === "/admin/orders" || /^\/admin\/orders\/[0-9a-fA-F-]+$/.test(pathname))
                        : sub.href.includes("?") ? (pathname === sub.href.split("?")[0] && currentTab === new URLSearchParams(sub.href.split("?")[1]).get("tab")) : (pathname === sub.href || pathname.startsWith(sub.href + "/"));
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
          let isActive = false;
          if (item.href === "/admin") {
            isActive = pathname === "/admin" && !currentTab;
          } else if (item.href === "/admin?tab=inquiries") {
            isActive = pathname === "/admin" && (currentTab === "inquiries" || (!currentTab && (user?.role === "customer_care" || user?.role === "customer_support")));
          } else if (item.href === "/admin?tab=orders") {
            isActive = pathname === "/admin" && currentTab === "orders";
          } else if (item.href) {
            const baseHref = item.href.split("?")[0];
            isActive = pathname === baseHref || pathname.startsWith(baseHref + "/");
          } 

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
        <div className="flex items-center px-2 py-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-sm font-bold mr-3 shrink-0">
            {user?.firstName?.[0] || "A"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold truncate text-white">{user?.firstName} {user?.lastName}</span>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadge.className}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
