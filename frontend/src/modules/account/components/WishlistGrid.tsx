"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import ProductCard from "@/components/ProductCard";
import { Heart } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export function WishlistGrid() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      // 1. Get wishlist IDs
      const res = await apiClient.get("/wishlist/me");
      const productIds = res.data.data?.productIds || [];
      
      if (productIds.length === 0) return [];
      
      // 2. Fetch product details for those IDs
      // (Normally a backend route handles this join, mocking multiple calls for now)
      const productsRes = await Promise.all(
        productIds.map((id: string) => apiClient.get(`/products/${id}`).catch(() => null))
      );
      
      return productsRes.filter(Boolean).map(r => r?.data?.data);
    }
  });

  if (isLoading) return <div className="py-20 text-center">Loading wishlist...</div>;
  if (error) return <div className="py-20 text-center text-red-500">Failed to load wishlist.</div>;

  const products = data || [];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-full text-zinc-400 mb-2">
          <Heart size={48} />
        </div>
        <h2 className="text-2xl font-bold">Your wishlist is empty</h2>
        <p className="text-zinc-500 max-w-md mx-auto mb-4">Save your favorite gear here to easily find it later.</p>
        <Link href="/products"><Button>Explore Gear</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">My Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: any) => (
          <ProductCard key={product._id} product={product} showBuyNow />
        ))}
      </div>
    </div>
  );
}
