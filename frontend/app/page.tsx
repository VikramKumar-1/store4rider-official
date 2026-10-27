import type { Metadata } from "next";
import HomepageModule from "@/modules/homepage";
import { buildOrganizationSchema } from "@/core/utils/seo-schema";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const homepageUrl = baseUrl.includes('/v1') ? `${baseUrl}/homepage/public` : `${baseUrl}/v1/homepage/public`;

  try {
    const res = await fetch(homepageUrl, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      const seo = data?.data?.seo;
      if (seo) {
        return {
          title: {
            absolute: seo.metaTitle || "Store4Riders - Buy Riding Gear Online | Helmet online",
          },
          description: seo.metaDescription || "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
          keywords: seo.metaKeywords || "Biker helmets, riding jacket, biker gloves, motorcycle helmet, riding boots, bike accessories near me",
          alternates: {
            canonical: "/",
          },
          openGraph: {
            title: seo.ogTitle || seo.metaTitle || "Store4Riders - Buy Riding Gear Online | Helmet online",
            description: seo.ogDescription || seo.metaDescription || "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
            type: "website",
            images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
          },
        };
      }
    }
  } catch (e) {
    // Fallback to defaults
  }

  return {
    title: {
      absolute: "Store4Riders - Buy Riding Gear Online | Helmet online",
    },
    description: "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
    keywords: "Biker helmets, riding jacket, biker gloves, motorcycle helmet, riding boots, bike accessories near me",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "Store4Riders - Buy Riding Gear Online | Helmet online",
      description: "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
      type: "website",
    },
  };
}

/**
 * Home Page Route
 * 
 * Clean, lightweight page component that strictly imports and renders
 * the HomepageModule UI. All UI component logic is cleanly modularized
 * under src/modules/homepage.
 */
export default async function Home() {
  let backendProducts = [];
  let storeSettings: any = null;
  let homepageConfig: any = null;
  let storeReviews: any[] = [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const fetchUrl = baseUrl.includes('/v1') ? `${baseUrl}/products` : `${baseUrl}/v1/products`;
    const settingsUrl = baseUrl.includes('/v1') ? `${baseUrl}/settings/public` : `${baseUrl}/v1/settings/public`;
    const homepageUrl = baseUrl.includes('/v1') ? `${baseUrl}/homepage/public` : `${baseUrl}/v1/homepage/public`;
    const reviewsUrl = baseUrl.includes('/v1') ? `${baseUrl}/reviews/store` : `${baseUrl}/v1/reviews/store`;

    const [prodResult, settingsResult, homepageResult, reviewsResult] = await Promise.allSettled([
      fetch(`${fetchUrl}?limit=50`, { 
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(settingsUrl, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(homepageUrl, {
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(reviewsUrl, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (prodResult.status === "fulfilled" && prodResult.value.ok) {
      const data = await prodResult.value.json();
      backendProducts = data?.data?.items || [];
    }

    if (settingsResult.status === "fulfilled" && settingsResult.value.ok) {
      const sData = await settingsResult.value.json();
      storeSettings = sData?.data || null;
    }

    if (homepageResult.status === "fulfilled" && homepageResult.value.ok) {
      const hData = await homepageResult.value.json();
      homepageConfig = hData?.data || null;
    }

    if (reviewsResult.status === "fulfilled" && reviewsResult.value.ok) {
      const rData = await reviewsResult.value.json();
      storeReviews = rData?.data || [];
    }
  } catch (error) {
    // Fallback gracefully
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
  const activePhone = storeSettings?.supportPhone || storeSettings?.whatsappNumber || storeSettings?.storeOriginPhone || process.env.NEXT_PUBLIC_STORE_PHONE;
  const activeEmail = storeSettings?.supportEmail || "contact@store4riders.com";
  const activeReturnDays = storeSettings?.returnWindowDays ?? 7;
  const activeFb = storeSettings?.facebookUrl || "https://www.facebook.com/store4riders/";
  const activeInsta = storeSettings?.instagramUrl || "https://www.instagram.com/store4riders/";
  const activeYt = storeSettings?.youtubeUrl || "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg";

  const validReviews = Array.isArray(storeReviews)
    ? storeReviews.filter((r: any) => typeof r.rating === "number" && r.rating > 0)
    : [];
  const aggregateRating = validReviews.length > 0
    ? {
        ratingValue: validReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / validReviews.length,
        reviewCount: validReviews.length,
      }
    : undefined;

  const homepageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema({
        siteUrl,
        legalName: storeSettings?.legalBusinessName || "Store4Riders",
        phone: activePhone,
        email: activeEmail,
        streetAddress: storeSettings?.storeOriginAddress,
        locality: storeSettings?.storeOriginCity || "Pune",
        region: storeSettings?.storeOriginState || "Maharashtra",
        postalCode: storeSettings?.storeOriginPincode || "411001",
        returnWindowDays: activeReturnDays,
        socialLinks: [activeFb, activeInsta, activeYt].filter(Boolean),
        aggregateRating,
      }),
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#homepage`,
        url: siteUrl,
        name: "Store4Riders - Buy Riding Gear Online | Helmet online",
        description: "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
        },
        about: {
          "@id": `${siteUrl}/#organization`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      />
      <HomepageModule
        backendProducts={backendProducts}
        homepageConfig={homepageConfig}
        storeReviews={storeReviews}
      />
    </>
  );
}
