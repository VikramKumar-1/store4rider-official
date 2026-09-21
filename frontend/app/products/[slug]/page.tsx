import type { Metadata } from "next";
import { ProductDetailPageModule } from "@/modules/product-detail/components/ProductDetailPageModule";

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const API_BASE = rawApiBase.includes("/v1")
  ? rawApiBase
  : rawApiBase.endsWith("/api")
  ? `${rawApiBase}/v1`
  : `${rawApiBase}/api/v1`;


interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_BASE}/products/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: "Product Not Found | Store4Riders",
        description: "The requested riding gear could not be found.",
      };
    }

    const json = await res.json();
    const product = json?.data;

    if (!product) {
      return {
        title: "Product Details | Store4Riders",
        description: "Explore premium motorcycle riding gear at Store4Riders.",
      };
    }

    const title = product.metaTitle?.trim() || `${product.name} | Store4Riders`;
    const cleanDescription =
      product.metaDescription?.trim() ||
      product.shortDescription?.trim() ||
      `Buy ${product.name} at Store4Riders. Certified motorcycle riding gear with best prices & express delivery.`;
    const keywords = product.metaKeywords
      ? product.metaKeywords
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean)
      : [];
    const imageUrl = product.images?.[0]?.url;

    return {
      title,
      description: cleanDescription,
      keywords: keywords.length > 0 ? keywords : ["riding gear", "motorcycle", "store4riders", product.name],
      openGraph: {
        title,
        description: cleanDescription,
        type: "website",
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: cleanDescription,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: "Product Details | Store4Riders",
      description: "Explore premium motorcycle riding gear at Store4Riders.",
    };
  }
}

export default function ProductDetailPage() {
  return <ProductDetailPageModule />;
}
