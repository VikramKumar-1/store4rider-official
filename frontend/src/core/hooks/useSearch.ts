import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface TrendingSearchResponse {
  trending: string[];
  categories: {
    name: string;
    slug: string;
  }[];
}

export interface SearchSuggestProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  image?: string;
  basePrice: number;
  specialPrice: number;
  inStock: boolean;
}

export interface SearchSuggestCategory {
  id: string;
  name: string;
  slug: string;
  url?: string;
}

export interface ScopedSuggestion {
  type: "category" | "brand";
  label: string;
  query: string;
  categorySlug?: string;
  categoryName?: string;
  brand?: string;
}

export interface SearchSuggestResponse {
  products: SearchSuggestProduct[];
  categories: SearchSuggestCategory[];
  brands: string[];
  scopedSuggestions?: ScopedSuggestion[];
  isCorrected?: boolean;
  correctedQuery?: string;
}

/**
 * Hook to fetch dynamic popular/trending searches and quick categories
 */
export function useTrendingSearches() {
  return useQuery<TrendingSearchResponse>({
    queryKey: ["search", "trending"],
    queryFn: async () => {
      const response = await apiClient.get("/search/trending");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook for live autocomplete suggestions with typo tolerance and category/brand discovery
 */
export function useSearchSuggestions(query: string) {
  const trimmed = query.trim();
  return useQuery<SearchSuggestResponse>({
    queryKey: ["search", "suggest", trimmed],
    queryFn: async () => {
      const response = await apiClient.get(`/search/suggest?q=${encodeURIComponent(trimmed)}`);
      return response.data.data;
    },
    enabled: trimmed.length >= 2,
    staleTime: 60 * 1000,
  });
}
