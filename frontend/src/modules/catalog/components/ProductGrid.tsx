"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";

interface ProductGridProps {
  products: any[];
}

const QUICK_FILTER_PILLS = [
  { label: "All Gear", slug: "" },
  { label: "Helmets", slug: "helmets" },
  { label: "Jackets", slug: "riding-jackets" },
  { label: "Boots", slug: "riding-boots" },
  { label: "Gloves", slug: "riding-gloves" },
  { label: "Luggage", slug: "motorcycle-bags-bike-luggage" },
  { label: "Accessories", slug: "motorcycle-accessories-online" },
];

export function ProductGrid({ products }: ProductGridProps) {
  const searchParams = useSearchParams();
  const category = searchParams?.get("category") || "";
  const title = "All Premium Gear";

  return (
    <main className="flex-1 min-w-0">
      
      {/* Top Header & Result Counter */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Certified ECE 22.06 & D3O Protection
          </p>
        </div>
        <div className="bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-full shadow-sm">
          {products.length} Products
        </div>
      </div>

      {/* Horizontal Top Quick Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none border-b border-slate-200/80">
        {QUICK_FILTER_PILLS.map((pill) => {
          const isActive = category === pill.slug || (!category && !pill.slug);
          return (
            <Link
              key={pill.slug}
              href={pill.slug ? `/${pill.slug}` : "/products"}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-brand text-white shadow-md shadow-brand/20"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {pill.label}
            </Link>
          );
        })}
      </div>

      {/* Grid Content */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8">
          <p className="text-slate-500 font-bold text-lg">No products found in this category.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {products.map((product: any) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </motion.div>
      )}
    </main>
  );
}
