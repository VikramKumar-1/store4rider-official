export interface CatalogProduct {
  id: string;
  name: string;
  category: string; // The small grey text above the title (e.g. JACKET)
  priceFormatted: string; // e.g. IDR 300.000 or ₹ 300
  imageUrl: string;
  rating: number; // e.g. 4.95
  productUrl: string;
}

export interface CatalogProps {
  products: CatalogProduct[];
  totalCount?: number;
  isLoading?: boolean;
  isFetching?: boolean;
}

