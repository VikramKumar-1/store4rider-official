import type { Metadata } from "next";
import HomepageModule from "@/modules/homepage";

export const metadata: Metadata = {
  title: "Store4Riders | Premium Motorcycle Riding Gear & Accessories",
  description: "Shop certified motorcycle helmets, riding jackets, pants, boots, and safety gear in India. Genuine products, best prices & express delivery at Store4Riders.",
  openGraph: {
    title: "Store4Riders | Premium Motorcycle Riding Gear & Accessories",
    description: "Shop certified motorcycle helmets, riding jackets, pants, boots, and safety gear in India.",
    type: "website",
  },
};

/**
 * Home Page Route
 * 
 * Clean, lightweight page component that strictly imports and renders
 * the HomepageModule UI. All UI component logic is cleanly modularized
 * under src/modules/homepage.
 */
export default async function Home() {
  let backendProducts = [];
  try {
    // Fetch products from our backend API with sufficient limit for all homepage sections
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const fetchUrl = baseUrl.includes('/v1') ? `${baseUrl}/products` : `${baseUrl}/v1/products`;
    console.log("Building homepage, fetching products from:", fetchUrl);
    
    const res = await fetch(`${fetchUrl}?limit=50`, { 
      next: { revalidate: 10 } // Revalidate every 10 seconds
    });
    
    if (res.ok) {
      const data = await res.json();
      backendProducts = data?.data?.items || [];
      console.log(`Successfully fetched ${backendProducts.length} products for homepage.`);
    } else {
      console.error(`Failed to fetch products: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error("Network error fetching products for homepage:", error);
  }

  return <HomepageModule backendProducts={backendProducts} />;
}
