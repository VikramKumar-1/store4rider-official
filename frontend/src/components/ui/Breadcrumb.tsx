"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  /** Explicit breadcrumb items. If omitted, automatically generated from current URL */
  items?: BreadcrumbItem[];
  /** Custom label for the last active item (e.g. Product Name) */
  customLastTitle?: string;
  /** Whether to inject Schema.org JSON-LD structured data for Google Rich Snippets (default: true) */
  enableSchemaJsonLd?: boolean;
}

// User-friendly label formatting dictionary for common e-commerce paths
const KNOWN_LABELS: Record<string, string> = {
  products: "Products",
  cart: "Cart",
  checkout: "Checkout",
  account: "My Account",
  orders: "Orders",
  wishlist: "Wishlist",
  sale: "Sale",
  search: "Search",
  about: "About Us",
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
  returns: "Returns & Exchanges",
  shipping: "Shipping Info",
};

/**
 * Enterprise SEO-Optimized Breadcrumb Component
 * 
 * Features:
 * 1. 🔍 Google Schema.org JSON-LD Structured Data (BreadcrumbList) for rich search snippets.
 * 2. ♿ W3C Semantic HTML (<nav aria-label="Breadcrumb">, <ol>, <li>, aria-current="page").
 * 3. ⚡ 100% Dynamic Auto-Path derivation from usePathname() with custom override support.
 * 4. 🎨 Crisp pixel-perfect responsive styling matching Figma.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  customLastTitle,
  enableSchemaJsonLd = true 
}) => {
  const pathname = usePathname();

  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }

    const segments = (pathname || "").split("/").filter(Boolean);
    if (segments.length === 0) return [];

    const generated: BreadcrumbItem[] = [
      { label: "Home", href: "/" }
    ];

    let cumulativePath = "";
    segments.forEach((seg, index) => {
      cumulativePath += `/${seg}`;
      const isLast = index === segments.length - 1;

      let label = KNOWN_LABELS[seg.toLowerCase()] || 
        seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      if (isLast && customLastTitle) {
        label = customLastTitle;
      }

      generated.push({
        label,
        href: isLast ? undefined : cumulativePath,
      });
    });

    return generated;
  }, [items, pathname, customLastTitle]);

  // JSON-LD Structured Data for Google Rich Snippets
  const schemaJsonLd = useMemo(() => {
    if (!enableSchemaJsonLd || breadcrumbItems.length <= 1) return null;

    // Use deterministic canonical origin to strictly prevent SSR/Client React hydration mismatch
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

    const itemListElement = breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? (item.href.startsWith("http") ? item.href : `${origin}${item.href}`) : undefined,
    }));

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement,
    };
  }, [breadcrumbItems, enableSchemaJsonLd]);

  if (breadcrumbItems.length <= 1) return null;

  return (
    <>
      {/* 1. Google Schema.org JSON-LD Structured Data for SEO Rich Snippets */}
      {schemaJsonLd && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
        />
      )}

      {/* 2. Semantic W3C Accessible Navigation */}
      <nav 
        aria-label="Breadcrumb" 
        className="w-full bg-white border-b border-neutral-100"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <ol 
            itemScope 
            itemType="https://schema.org/BreadcrumbList"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 flex-wrap"
          >
            {breadcrumbItems.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === breadcrumbItems.length - 1;

              return (
                <li
                  key={index}
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                  className="flex items-center gap-2"
                >
                  {/* Position metadata for SEO microdata */}
                  <meta itemProp="position" content={String(index + 1)} />

                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      itemProp="item"
                      className="hover:text-banner transition-colors flex items-center gap-1.5 text-neutral-600 font-medium"
                    >
                      {isFirst && <HomeIcon className="w-3.5 h-3.5 stroke-[2] -mt-0.5 text-neutral-400" />}
                      <span itemProp="name" className="truncate max-w-[150px] sm:max-w-none">
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    <span
                      itemProp="name"
                      aria-current={isLast ? "page" : undefined}
                      className={`truncate max-w-[220px] sm:max-w-none ${
                        isLast ? "text-neutral-900 font-bold" : "text-neutral-600"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Accessible Breadcrumb Separator */}
                  {!isLast && (
                    <ChevronRightIcon 
                      aria-hidden="true" 
                      className="w-3.5 h-3.5 text-neutral-300 stroke-[2.5] shrink-0" 
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
};

export default Breadcrumb;
