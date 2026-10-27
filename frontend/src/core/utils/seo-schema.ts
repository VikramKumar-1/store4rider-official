/**
 * Enterprise SEO Schema.org Utilities
 * Standardized, Google Rich Results compliant JSON-LD generator for Store4Riders.
 * Adheres to Google Search Central & Schema.org specifications (2024-2026).
 */

export interface SchemaBreadcrumbItem {
  name: string;
  url: string;
}

export interface SchemaFaqItem {
  question: string;
  answer: string;
}

export interface SchemaShippingOption {
  freeShippingThreshold?: number;
  currency?: string;
  handlingDaysMin?: number;
  handlingDaysMax?: number;
  transitDaysMin?: number;
  transitDaysMax?: number;
}

/**
 * Strips HTML tags, entities, and whitespace for clean plain text descriptions.
 */
export function cleanText(input?: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds Schema.org WebSite JSON-LD with Sitelinks Searchbox action.
 */
export function buildWebSiteSchema(siteUrl: string = "https://store4riders.com") {
  const normalizedUrl = siteUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${normalizedUrl}/#website`,
    url: normalizedUrl,
    name: "Store4Riders",
    description: "Premium Motorcycle Riding Gear & Accessories Store in India",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${normalizedUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Builds authoritative Schema.org Organization + OnlineStore JSON-LD.
 * Single source of truth for brand identity, merchant policies, and contact points.
 */
export function buildOrganizationSchema(params?: {
  siteUrl?: string;
  legalName?: string;
  phone?: string;
  email?: string;
  streetAddress?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  returnWindowDays?: number;
  socialLinks?: string[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}) {
  const siteUrl = (params?.siteUrl || "https://store4riders.com").replace(/\/+$/, "");
  const legalName = params?.legalName || "Store4Riders";
  const email = params?.email || "contact@store4riders.com";
  const returnDays = params?.returnWindowDays ?? 7;
  const socials = params?.socialLinks && params.socialLinks.length > 0
    ? params.socialLinks
    : [
        "https://www.facebook.com/store4riders/",
        "https://www.instagram.com/store4riders/",
        "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
      ];

  const orgSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    "@id": `${siteUrl}/#organization`,
    name: legalName,
    url: siteUrl,
    logo: `${siteUrl}/Store4riders-Logo.jpg`,
    image: `${siteUrl}/Store4riders-Logo.jpg`,
    description: "India's premier destination for certified motorcycle riding helmets, jackets, boots, gloves, and riding accessories.",
    email: email,
    acceptedPaymentMethod: [
      "https://schema.org/PaymentCard",
      "Cash on Delivery",
      "Credit Card",
      "Debit Card",
      "UPI",
      "Net Banking",
      "EMI",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: params?.streetAddress || "Plot 14, Commercial Lane, Near Highway Bypass",
      addressLocality: params?.locality || "Pune",
      addressRegion: params?.region || "Maharashtra",
      postalCode: params?.postalCode || "411001",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: email,
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      name: "7-Day Size & Gear Exchange Policy",
      merchantReturnLink: `${siteUrl}/returns`,
      applicableCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: returnDays,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
      refundType: [
        "https://schema.org/ExchangeRefund",
        "https://schema.org/StoreCreditRefund",
      ],
    },
    sameAs: socials,
  };

  if (params?.phone) {
    orgSchema.telephone = params.phone;
    orgSchema.contactPoint.telephone = params.phone;
  }

  if (params?.aggregateRating && params.aggregateRating.reviewCount > 0) {
    orgSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(params.aggregateRating.ratingValue.toFixed(1)),
      reviewCount: Math.round(params.aggregateRating.reviewCount),
      bestRating: 5,
      worstRating: 1,
    };
  }

  return orgSchema;
}

/**
 * Builds Schema.org BreadcrumbList JSON-LD with full canonical path preservation.
 */
export function buildBreadcrumbSchema(
  items: SchemaBreadcrumbItem[],
  siteUrl: string = "https://store4riders.com"
) {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const fullUrl = item.url.startsWith("http")
        ? item.url
        : `${normalizedSiteUrl}${item.url.startsWith("/") ? "" : "/"}${item.url}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}

/**
 * Builds 100% Google Rich Results compliant Schema.org Product JSON-LD.
 * Includes complete offers, seller, return policy, and shipping details.
 */
export function buildProductSchema(
  product: any,
  siteUrl: string = "https://store4riders.com",
  categoryName?: string,
  shippingOpts?: SchemaShippingOption
) {
  if (!product) return null;
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const productUrl = `${normalizedSiteUrl}/${product.slug}`;

  // Image extraction
  const images: string[] = [];
  if (Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      const url = typeof img === "string" ? img : img?.url;
      if (url && typeof url === "string" && !images.includes(url)) {
        images.push(url);
      }
    });
  }
  if (images.length === 0 && product.image) {
    images.push(product.image);
  }

  const sku = product.sku || product._id || product.slug;
  const rawPrice = product.specialPrice || product.basePrice || 0;
  const price = Number(Number(rawPrice).toFixed(2));
  const isInStock =
    product.stockStatus === 1 ||
    product.stockStatus === true ||
    (typeof product.stockQuantity === "number" && product.stockQuantity > 0) ||
    (typeof product.qty === "number" && product.qty > 0);

  // Price valid until: next year same date for standard catalog
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const productSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    url: productUrl,
    image: images.length > 0 ? images : [`${normalizedSiteUrl}/Store4riders-Logo.jpg`],
    description: cleanText(product.metaDescription || product.shortDescription || product.description || product.name),
    sku: sku,
    mpn: product.hsnCode || sku,
    brand: {
      "@type": "Brand",
      name: product.brand || "Store4Riders",
    },
    offers: {
      "@type": "Offer",
      "@id": `${productUrl}#offer`,
      url: productUrl,
      priceCurrency: "INR",
      price: price,
      priceValidUntil: priceValidUntil,
      itemCondition: "https://schema.org/NewCondition",
      availability: isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Store4Riders",
        url: normalizedSiteUrl,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        name: "7-Day Size & Gear Exchange Policy",
        merchantReturnLink: `${normalizedSiteUrl}/returns`,
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
        refundType: [
          "https://schema.org/ExchangeRefund",
          "https://schema.org/StoreCreditRefund",
        ],
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: product.isFreeShipping || price >= (shippingOpts?.freeShippingThreshold ?? 999) ? 0 : 99,
          currency: shippingOpts?.currency || "INR",
        },
        shippingDestination: [
          {
            "@type": "DefinedRegion",
            addressCountry: "IN",
          },
        ],
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: shippingOpts?.handlingDaysMin ?? 0,
            maxValue: shippingOpts?.handlingDaysMax ?? 1,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: shippingOpts?.transitDaysMin ?? 2,
            maxValue: shippingOpts?.transitDaysMax ?? 5,
            unitCode: "d",
          },
        },
      },
    },
  };

  if (categoryName || product.categorySlugs?.[0]) {
    productSchema.category = categoryName || product.categorySlugs[0].replace(/[-_]/g, " ");
  }

  // Google Rich Results Star Rating
  if (product.avgRating && product.reviewCount && product.reviewCount > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(Number(product.avgRating).toFixed(1)),
      reviewCount: Math.round(product.reviewCount),
      bestRating: 5,
      worstRating: 1,
    };
  }

  return productSchema;
}

/**
 * Builds Schema.org CollectionPage JSON-LD.
 * Omit ItemList if empty to prevent Google Rich Results unparsable element errors.
 */
export function buildCollectionSchema(params: {
  title: string;
  description: string;
  url: string;
  siteUrl?: string;
  products?: any[];
}) {
  const siteUrl = (params.siteUrl || "https://store4riders.com").replace(/\/+$/, "");
  const collection: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.title,
    description: cleanText(params.description),
    url: params.url,
    isPartOf: {
      "@type": "WebSite",
      name: "Store4Riders",
      url: siteUrl,
    },
  };

  if (Array.isArray(params.products) && params.products.length > 0) {
    collection.mainEntity = {
      "@type": "ItemList",
      name: `${params.title} List`,
      description: cleanText(params.description),
      url: params.url,
      numberOfItems: params.products.length,
      itemListElement: params.products.map((p: any, idx: number) => {
        const pUrl = `${siteUrl}/${p.slug}`;
        const pPrice = Number(Number(p.specialPrice || p.basePrice || 0).toFixed(2));
        const inStock = p.stockStatus === 1 || p.stockStatus === true;

        return {
          "@type": "ListItem",
          position: idx + 1,
          url: pUrl,
          item: {
            "@type": "Product",
            name: p.name,
            url: pUrl,
            ...(p.images?.[0]?.url ? { image: p.images[0].url } : {}),
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: pPrice,
              availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            },
          },
        };
      }),
    };
  }

  return collection;
}

/**
 * Builds Schema.org FAQPage JSON-LD.
 * Surfaces Google Search Accordion Rich Results.
 */
export function buildFAQSchema(faqs?: SchemaFaqItem[]) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  const validItems = faqs
    .filter((f) => f && f.question && f.answer)
    .map((f) => ({
      "@type": "Question",
      name: cleanText(f.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: cleanText(f.answer),
      },
    }));

  if (validItems.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validItems,
  };
}
