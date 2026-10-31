"use client";

import { useCartStore } from "@/stores/useCartStore";
import Button from "@/components/ui/Button";
import { formatPrice } from "@store4riders/shared-utils";
import { Star, Shield, Truck } from "lucide-react";
import { toast } from "sonner";

interface ProductInfoProps {
  product: any; // Ideally IProduct, using any for quick prop mapping for now
}

export function ProductInfo({ product }: ProductInfoProps) {
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: crypto.randomUUID(),
      productId: product._id || product.id,
      quantity: 1,
    });
    toast.success("Added to cart");
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{product.name}</h1>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-yellow-400">
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} fill="currentColor" />
            <Star size={16} className="text-zinc-300" />
          </div>
          <span className="text-sm text-zinc-500">(128 Reviews)</span>
        </div>
        <p className="text-2xl font-bold text-brand">{formatPrice(product.basePrice)}</p>
      </div>

      <div className="prose dark:prose-invert text-zinc-600 dark:text-zinc-300">
        <p>{product.description}</p>
      </div>

      <div className="flex flex-col gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <Button size="lg" className="w-full text-lg" onClick={handleAddToCart}>
          Add to Cart
        </Button>
        <Button variant="outline" size="lg" className="w-full text-lg">
          Add to Wishlist
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
        <div className="flex flex-col items-center text-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
          <Shield className="text-brand" size={24} />
          <span className="text-xs font-semibold">1 Year Warranty</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
          <Truck className="text-brand" size={24} />
          <span className="text-xs font-semibold">Free Delivery</span>
        </div>
      </div>
    </div>
  );
}
