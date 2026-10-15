import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import {
  IHomepageConfig,
  IHeroSectionConfig,
  IHomepageSeoConfig,
  IHomepageSectionsConfig,
} from "@store4riders/shared-types";
import { toast } from "sonner";

export function useHomepageConfig() {
  return useQuery<IHomepageConfig>({
    queryKey: ["homepage", "config"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: IHomepageConfig }>("/homepage");
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function usePublicHomepageConfig() {
  return useQuery<IHomepageConfig>({
    queryKey: ["homepage", "public"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: IHomepageConfig }>("/homepage/public");
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateHeroAndSeo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { hero: IHeroSectionConfig; seo: IHomepageSeoConfig }) => {
      const res = await apiClient.put("/homepage/hero-seo", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toast.success("Hero & SEO settings saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update Hero & SEO");
    },
  });
}

export function useUpdateHomepageSections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { sections: IHomepageSectionsConfig }) => {
      const res = await apiClient.put("/homepage/sections", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toast.success("Homepage sections saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update homepage sections");
    },
  });
}
