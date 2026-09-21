import Link from "next/link";
import { Home, Users, Box, ShoppingCart, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter, usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Products", href: "/admin/products", icon: Box },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl z-10">
      <div className="p-6 text-xl font-bold tracking-wider border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 bg-brand rounded flex items-center justify-center text-white text-sm">S4</div>
        <Link href="/admin" className="hover:text-slate-300 transition-colors">Store4Riders</Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          // Exact match for /admin, startsWith for others to handle sub-routes like /admin/products/[id]
          const isActive = item.href === "/admin" 
            ? pathname === "/admin" 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
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
