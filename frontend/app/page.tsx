import HomepageModule from "@/modules/homepage";

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
    // Fetch products from our backend API
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const fetchUrl = baseUrl.includes('/v1') ? `${baseUrl}/products` : `${baseUrl}/v1/products`;
    const res = await fetch(fetchUrl, { 
      next: { revalidate: 10 } // Revalidate every 10 seconds
    });
    if (res.ok) {
      const data = await res.json();
      backendProducts = data?.data?.items || [];
    }
  } catch (error) {
    console.error("Failed to fetch products for homepage:", error);
  }

  return <HomepageModule backendProducts={backendProducts} />;
}
