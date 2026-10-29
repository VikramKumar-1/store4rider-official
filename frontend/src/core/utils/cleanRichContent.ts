/**
 * Utility to sanitize, clean, and format rich HTML content from Magento / CMS.
 * Ensures:
 * 1. Zero horizontal scrolling on all mobile screens (responsive tables, images, wrapping).
 * 2. Rewriting legacy store4riders.com & .html URLs to internal Next.js routes.
 * 3. External links (e.g. YouTube) safely open in new tabs with target="_blank" rel="noopener noreferrer".
 * 4. Stripping legacy inline typography/colors to enforce Store4Riders brand design.
 */

export function cleanRichContent(rawHtml: string): string {
  if (!rawHtml) return "";
  let clean = rawHtml;

  // 0. Security: Strip dangerous executable tags & event handlers before rendering on storefront
  clean = clean.replace(/<(script|style|object|embed|iframe|applet)[\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/<(script|iframe|embed|object)[^>]*>/gi, "");
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // 1. Strip FAQs if accidentally embedded inside category or brand description
  const faqSplit = clean.split(/(?:<(?:h[1-6]|p)[^>]*>(?:<[^>]+>)*\s*(?:Frequently\s*asked\s*questions|faqs?)\b|<(?:p|div|h[1-6])[^>]*>(?:<[^>]+>)*\s*(?:Question|Q\d*)[\s:.]|\bFrequently\s+Asked\s+Questions\b)/i);
  if (faqSplit.length > 1) {
    clean = faqSplit[0];
  }

  // 2. Strip inline typography & legacy colors/widths to enforce site fonts & brand theme
  clean = clean.replace(/style="([^"]*)"/gi, (_match, styles) => {
    const cleanedStyles = styles
      .replace(/font-family:[^;]+;?/gi, "")
      .replace(/font-size:[^;]+;?/gi, "")
      .replace(/line-height:[^;]+;?/gi, "")
      .replace(/color:[^;]+;?/gi, "")
      .replace(/width:[^;]+;?/gi, "")
      .replace(/min-width:[^;]+;?/gi, "")
      .replace(/max-width:[^;]+;?/gi, "")
      .replace(/height:[^;]+;?/gi, "")
      .replace(/white-space:\s*nowrap;?/gi, "")
      .trim();
    return cleanedStyles ? `style="${cleanedStyles}"` : "";
  });

  // 3. Strip legacy attributes like width, height, nowrap, colgroup
  clean = clean.replace(/<colgroup[\s\S]*?<\/colgroup>/gi, "");
  clean = clean.replace(/\s+(?:width|height|nowrap)=["'][^"']*["']/gi, "");
  clean = clean.replace(/\snowrap\b/gi, "");

  // 4. Rewrite old store4riders absolute URLs and .html relative URLs to clean internal Next.js paths
  clean = clean.replace(/href=["']https?:\/\/(?:www\.)?store4riders\.com\/?([^"']*)["']/gi, (_match, path) => {
    const cleanPath = path ? `/${path.replace(/\.html(\?.*)?$/i, "$1")}` : "/";
    return `href="${cleanPath}"`;
  });
  clean = clean.replace(/href=["']\/([^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');
  clean = clean.replace(/href=["']([^"'\/][^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');

  // Rewrite legacy Magento price bracket category links to active query params
  clean = clean
    .replace(/href=["'][^"']*\/bike-riding-jackets-below-6000["']/gi, 'href="/riding-gear/riding-jackets?maxPrice=6000"')
    .replace(/href=["'][^"']*\/riding-jackets-between-rs-6000-8000["']/gi, 'href="/riding-gear/riding-jackets?minPrice=6000&maxPrice=8000"')
    .replace(/href=["'][^"']*\/bike-jackets-between-8000-10000["']/gi, 'href="/riding-gear/riding-jackets?minPrice=8000&maxPrice=10000"')
    .replace(/href=["'][^"']*\/best-riding-jackets-between-10000-20000["']/gi, 'href="/riding-gear/riding-jackets?minPrice=10000&maxPrice=20000"')
    .replace(/href=["'][^"']*\/premium-mesh-riding-jackets["']/gi, 'href="/riding-gear/riding-jackets?minPrice=20000"')
    .replace(/href=["'][^"']*\/riding-gloves-below-rs-3000["']/gi, 'href="/riding-gear/riding-gloves/short-motorbike-gloves?maxPrice=3000"');

  // External links (e.g. YouTube, third-party sites): ensure target="_blank" and rel="nofollow noopener noreferrer" to protect SEO
  clean = clean.replace(
    /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/(?!(?:www\.)?store4riders\.com)[^"']+)["']([^>]*)>/gi,
    (_match, url, rest) => {
      const cleanRest = rest.replace(/\s*(?:target|rel)=["'][^"']*["']/gi, "");
      return `<a href="${url}" target="_blank" rel="nofollow noopener noreferrer"${cleanRest}>`;
    }
  );

  // 5. Force tables to be responsive with smooth scroll container without overflowing page
  clean = clean.replace(/<div class="[^"]*overflow-[^"]*">\s*<table/gi, "<table");
  clean = clean.replace(/<\/table>\s*<\/div>/gi, "</table>");

  clean = clean.replace(
    /<table[^>]*>/gi,
    '<div class="w-full max-w-full overflow-x-auto my-3 rounded-lg border border-neutral-200 shadow-2xs"><table class="w-full min-w-full border-collapse border border-neutral-200 text-xs sm:text-sm text-neutral-800">'
  );
  clean = clean.replace(/<\/table>/gi, "</table></div>");
  clean = clean.replace(
    /<th[^>]*>/gi,
    '<th class="border border-neutral-200 bg-neutral-100/90 p-2 text-left font-bold align-top text-xs sm:text-sm">'
  );
  clean = clean.replace(
    /<td[^>]*>/gi,
    '<td class="border border-neutral-200 p-2 align-top text-xs sm:text-sm">'
  );

  // 6. Force images to never exceed container width
  clean = clean.replace(/<img([^>]*)>/gi, '<img$1 class="max-w-full h-auto rounded-md shadow-xs my-2" loading="lazy" />');

  return clean;
}

/**
 * Strips HTML tags and entities for Google Search bot structured data (JSON-LD FAQPage Schema)
 */
export function stripHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Handles clicks inside rich HTML content.
 * Routes internal links via Next.js router, opens external links in a new tab.
 */
export function handleRichTextClick(e: React.MouseEvent<HTMLElement>, router: { push: (url: string) => void }) {
  const target = e.target as HTMLElement;
  const link = target.closest("a");
  if (!link) return;

  const hrefAttr = link.getAttribute("href") || link.href;
  if (!hrefAttr) return;

  // Check if it's an internal link or old store4riders link
  const isInternal =
    hrefAttr.startsWith("/") ||
    hrefAttr.startsWith("#") ||
    link.hostname === window.location.hostname ||
    link.hostname.includes("store4riders.com");

  if (isInternal) {
    e.preventDefault();
    let targetPath = hrefAttr;
    try {
      const parsed = new URL(hrefAttr, window.location.origin);
      if (parsed.hostname.includes("store4riders.com") || parsed.hostname === window.location.hostname) {
        targetPath = parsed.pathname.replace(/\.html$/i, "") + parsed.search + parsed.hash;
      }
    } catch {
      targetPath = hrefAttr.replace(/^https?:\/\/(?:www\.)?store4riders\.com/i, "").replace(/\.html$/i, "");
    }

    if (targetPath.startsWith("#")) {
      const elem = document.querySelector(targetPath);
      if (elem) elem.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(targetPath);
    }
    return;
  }

  // External link (e.g. YouTube, external sites): open in new tab
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener noreferrer");
}
