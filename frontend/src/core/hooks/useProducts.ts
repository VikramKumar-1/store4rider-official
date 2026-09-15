import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

/**
 * Frontend interface matching the ACTUAL MongoDB product schema.
 * Field names must match backend model (product.model.ts) exactly.
 * See: .agents/rules/CODING_STANDARDS.md Section 7
 */
export interface IBackendProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  categoryId?: string;
  basePrice: number;
  specialPrice?: number;       // NOT "salePrice"
  weight?: number;
  stockStatus?: number;        // 0 or 1, NOT "stockQuantity"
  productType?: string;        // "simple" | "configurable"
  magentoCategories?: string;  // e.g. "Root/Riding Gear/Boots"
  configurableVariations?: string; // e.g. "sku=CL-FR-BL-7,color=Black|sku=CL-FR-BR-7,color=Brown"
  brand?: string;
  images: Array<{
    id?: string;
    url: string;
    altText?: string;
  }>;
  variants?: Array<{
    id?: string;
    sku: string;
    price: number;
    stock: number;
    attributes?: Record<string, string>;
  }>;
  relatedSkus?: string[];
  upsellSkus?: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { items: IBackendProduct[] } }>("/products");
      return response.data.data.items;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes instant cache
    gcTime: 1000 * 60 * 10,    // 10 minutes memory
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await apiClient.get<{ data: IBackendProduct }>(`/products/${slug}`);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 3, // 3 minutes instant cache
    gcTime: 1000 * 60 * 10,    // 10 minutes memory
  });
}

/**
 * Fetch multiple products by their SKUs (for related/upsell sections).
 */
export function useProductsBySkus(skus: string[]) {
  return useQuery({
    queryKey: ["products-by-skus", skus],
    queryFn: async () => {
      if (!skus || skus.length === 0) return [];
      const response = await apiClient.get<{ data: IBackendProduct[] }>(`/products/by-skus?skus=${skus.join(',')}`);
      return response.data.data;
    },
    enabled: skus.length > 0,
  });
}

/**
 * Fetch reviews for a specific product.
 */
export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: any[] }>(`/reviews/product/${productId}`);
      return response.data.data;
    },
    enabled: !!productId,
  });
}
