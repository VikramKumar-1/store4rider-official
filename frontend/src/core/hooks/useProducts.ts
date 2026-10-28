import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";
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
  specialPriceFromDate?: Date | string;
  specialPriceToDate?: Date | string;
  weight?: number;
  weightUnit?: string;
  stockStatus?: number;        // 0 or 1, NOT "stockQuantity"
  productType?: string;        // "simple" | "configurable"
  magentoCategories?: string;  // e.g. "Root/Riding Gear/Boots"
  configurableVariations?: string; // e.g. "sku=CL-FR-BL-7,color=Black|sku=CL-FR-BR-7,color=Brown"
  brand?: string;
  brandSlug?: string;
  brandLogo?: string;
  sizeChart?: string;
  size_chart?: string;
  attributeSetCode?: string;
  categorySlugs?: string[];
  mapPrice?: number;
  msrpPrice?: number;
  qty?: number;
  outOfStockQty?: number;
  minCartQty?: number;
  maxCartQty?: number;
  notifyOnStockBelow?: number;
  countryOfManufacture?: string;
  taxClassName?: string;
  hsnCode?: string;
  visibility?: string;
  status?: "draft" | "published" | "archived";
  isFeatured?: boolean;
  isFreeShipping?: boolean;
  gender?: string;
  brandId?: string;
  tags?: string[];
  crosssellSkus?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  images: Array<{
    id?: string;
    url: string;
    altText?: string;
  }>;
  colorImages?: Record<string, string>;
  colorSwatches?: Record<string, string>;
  variants?: Array<{
    id?: string;
    sku: string;
    price: number;
    specialPrice?: number;
    stock: number;
    attributes?: Record<string, string>;
    imageUrl?: string;
  }>;
  relatedSkus?: string[];
  upsellSkus?: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  allowBackorders?: boolean;
  videoUrl?: string;
  attributes?: Record<string, string>;
}

export interface UseProductsParams {
  category?: string;
  brand?: string;
  brandSlug?: string;
  brandLogo?: string;
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  priceFrom?: number;
  priceTo?: number;
  sort?: string;
  scope?: string;
  status?: string;
  attributeSet?: string;
  attributeSetCode?: string;
  productType?: string;
  sku?: string;
  name?: string;
  id?: string;
  parentOnly?: string;
  // Dynamic attribute filters
  [key: string]: string | number | undefined;
}

export function useProducts(params?: UseProductsParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append("category", params.category);
      if (params?.brand) queryParams.append("brand", params.brand);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.minPrice !== undefined) queryParams.append("minPrice", params.minPrice.toString());
      if (params?.maxPrice !== undefined) queryParams.append("maxPrice", params.maxPrice.toString());
      if (params?.priceFrom !== undefined) queryParams.append("priceFrom", params.priceFrom.toString());
      if (params?.priceTo !== undefined) queryParams.append("priceTo", params.priceTo.toString());
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.scope) queryParams.append("scope", params.scope);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.attributeSet) queryParams.append("attributeSet", params.attributeSet);
      if (params?.attributeSetCode) queryParams.append("attributeSetCode", params.attributeSetCode);
      if (params?.productType) queryParams.append("productType", params.productType);
      if (params?.sku) queryParams.append("sku", params.sku);
      if (params?.name) queryParams.append("name", params.name);
      if (params?.id) queryParams.append("id", params.id);
      if (params?.parentOnly) queryParams.append("parentOnly", String(params.parentOnly));
      
      const DYNAMIC_PARAMS = ['helmet_type', 'material', 'riding_style', 'certification', 'gender', 'size', 'colour', 'inStock', 'onSale'];
      for (const key of DYNAMIC_PARAMS) {
        if (params?.[key]) queryParams.append(key, String(params[key]));
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      
      interface PaginatedResponse {
        items: IBackendProduct[];
        totalCount: number;
        page: number;
        limit: number;
        totalPages: number;
      }
      
      const response = await apiClient.get<{ data: PaginatedResponse }>(`/products${queryString}`);
      return { 
        items: response.data.data.items, 
        totalCount: response.data.data.totalCount || 0,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages
      };
    },
    staleTime: 1000 * 60 * 3, // 3 minutes instant cache
    gcTime: 1000 * 60 * 10,    // 10 minutes memory
    placeholderData: keepPreviousData,
  });
}

export function useAdminProducts(params?: UseProductsParams) {
  return useProducts({
    ...params,
    scope: "admin",
  });
}

export function useProductBySlug(slug: string, initialData?: IBackendProduct) {
  return useQuery({
    queryKey: ["product", slug],
    initialData,
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
 * Fetch smart kit recommendations for a product.
 * Returns complementary gear across different riding categories.
 */
export function useProductKit(slug: string) {
  return useQuery({
    queryKey: ["product-kit", slug],
    queryFn: async () => {
      if (!slug) return [];
      const response = await apiClient.get<{ data: IBackendProduct[] }>(`/products/${slug}/kit`);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch multiple products by their SKUs (for related/upsell sections).
 */
/**
 * Fetch upsell recommendations for a product ("You May Also Like").
 */
export function useProductUpsell(slug: string) {
  return useQuery({
    queryKey: ["product-upsell", slug],
    queryFn: async () => {
      if (!slug) return [];
      const response = await apiClient.get<{ data: IBackendProduct[] }>(`/products/${slug}/upsell`);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch cross-sell recommendations for a product ("Frequently Bought Together").
 */
export function useProductCrossSell(slug: string) {
  return useQuery({
    queryKey: ["product-cross-sell", slug],
    queryFn: async () => {
      if (!slug) return [];
      const response = await apiClient.get<{ data: IBackendProduct[] }>(`/products/${slug}/cross-sell`);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductsBySkus(skus: string[]) {
  return useQuery({
    queryKey: ["products-by-skus", skus],
    queryFn: async () => {
      if (!skus || skus.length === 0) return [];
      const response = await apiClient.get<{ data: IBackendProduct[] }>(`/products/by-skus?skus=${encodeURIComponent(skus.join(','))}`);
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

/**
 * Submit a new review for a product.
 */
export function useAddReview(productId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewData: {
      productId: string;
      rating: number;
      comment: string;
      userName?: string;
      userEmail?: string;
      city?: string;
      title?: string;
      website?: string;
    }) => {
      const response = await apiClient.post<{ data: any }>("/reviews", reviewData);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      const targetId = variables.productId || productId;
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: ["product-reviews", targetId] });
      }
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useBulkUpdateProducts() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const queryClient = useQueryClient();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post("/admin/products/bulk-update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useProductAggregations(params?: any) {
  return useQuery({
    queryKey: ["product_aggregations", params],
    queryFn: async () => {
      const response = await apiClient.get("/products/aggregations", { params });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache since it depends on params now
    placeholderData: keepPreviousData, // PREVENTS SIDEBAR FLICKERING/RELOADING
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post("/products", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["products-by-skus"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/products/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["products-by-skus"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/products/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
