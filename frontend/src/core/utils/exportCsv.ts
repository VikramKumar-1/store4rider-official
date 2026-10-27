import { apiClient } from "@/core/api/client";
import { toast } from "sonner";

/**
 * Downloads product catalog CSV either for a specific brand or all brands.
 *
 * @param brandName Optional brand name or slug. If omitted or 'all', exports all products.
 */
export async function downloadBrandProductCsv(brandName?: string): Promise<void> {
  const isSpecificBrand = Boolean(brandName && brandName.trim() && brandName !== "all");
  const targetLabel = isSpecificBrand ? `"${brandName!.trim()}"` : "full catalog";
  const toastId = toast.loading(`Generating CSV export for ${targetLabel}...`);

  try {
    const params = isSpecificBrand ? { brand: brandName!.trim() } : {};
    const res = await apiClient.get("/products/export", {
      params,
      responseType: "blob",
    });

    const safeBrand = isSpecificBrand
      ? brandName!.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "")
      : "all";
    const filename = isSpecificBrand
      ? `store4riders_${safeBrand}_products.csv`
      : "store4riders_products.csv";

    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Downloaded CSV for ${targetLabel}!`, { id: toastId });
  } catch (err: any) {
    toast.error(err.response?.data?.error || err.message || "Failed to export CSV", { id: toastId });
  }
}
