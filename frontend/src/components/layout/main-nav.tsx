"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, User, Menu, ChevronDown, Sparkles } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { STORE_CATEGORIES } from "@/modules/homepage/data/categories";

const MainNav = () => {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);
  const [showShopMenu, setShowShopMenu] = useState(false);

  return (
    <header className="fixed top-3.5 font-sans left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-6xl transition-all duration-300">
      
      {/* Soft Dark Liquid Glass Pill Container */}
      <div className="relative liquid-glass-soft-dark rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between text-white transition-all overflow-hidden">
        
        {/* Specular Light Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-white/5 to-transparent pointer-events-none rounded-full" />

        {/* Mobile Toggle */}
        <button 
          onClick={toggleMobileMenu} 
          aria-label="Toggle Menu"
          className="md:hidden p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-all relative z-10"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group relative z-10">
          <div className="w-8 h-8 rounded-full bg-brand text-white font-black text-sm flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            S
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            Store<span className="text-brand">4</span>Riders
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-300 relative z-10">
          <Link 
            href="/" 
            className="px-4 py-2 rounded-full hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            Home
          </Link>
          
          {/* Shop Trigger */}
          <div 
            className="relative"
            onMouseEnter={() => setShowShopMenu(true)}
            onMouseLeave={() => setShowShopMenu(false)}
          >
            <Link 
              href="/products" 
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all duration-200 ${
                showShopMenu 
                  ? "text-white bg-white/15 shadow-2xs" 
                  : "hover:text-white hover:bg-white/10"
              }`}
            >
              Shop <ChevronDown size={13} className={`transition-transform duration-200 ${showShopMenu ? "rotate-180 text-brand" : "text-slate-400"}`} />
            </Link>
            
            {/* Dropdown Menu */}
            {showShopMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[640px]">
                <div className="liquid-glass-soft-dark-menu rounded-3xl p-6 grid grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-200 text-white">
                  {STORE_CATEGORIES.map((cat) => (
                    <div key={cat.slug} className="group/cat">
                      <Link 
                        href={`/products?category=${cat.slug}`} 
                        className="font-bold text-white hover:text-brand transition-colors text-xs mb-2 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand opacity-0 group-hover/cat:opacity-100 transition-opacity" />
                        {cat.name}
                      </Link>
                      {cat.subcategories && (
                        <ul className="space-y-1 pl-2.5 border-l border-white/15">
                          {cat.subcategories.slice(0, 3).map((sub) => (
                            <li key={sub.slug}>
                              <Link 
                                href={`/products?category=${cat.slug}&subcategory=${sub.slug}`} 
                                className="text-[11px] font-medium text-slate-400 hover:text-white transition-colors block py-0.5"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link 
            href="/products?category=helmets" 
            className="px-4 py-2 rounded-full hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            Helmets
          </Link>
          
          <Link 
            href="/products?category=riding-jackets" 
            className="px-4 py-2 rounded-full hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            Jackets
          </Link>

          <Link 
            href="/sale" 
            className="px-4 py-2 rounded-full text-brand-light font-extrabold hover:bg-brand/20 transition-all flex items-center gap-1"
          >
            <Sparkles size={13} /> Sale
          </Link>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 relative z-10 text-slate-300">
          <Link 
            href="/search" 
            className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3.5 py-1.5 text-xs text-slate-300 transition-all shadow-2xs mr-1"
          >
            <Search size={13} className="text-slate-400" />
            <span className="text-[11px]">Search...</span>
          </Link>

          <Link 
            href="/account" 
            className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-all"
            title="Account"
          >
            <User size={18} />
          </Link>

          <Link 
            href="/cart" 
            className="relative p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-all"
            title="Cart"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-brand text-white text-[10px] font-black h-4 px-1.5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  );
};

export default memo(MainNav);
