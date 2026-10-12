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

  // 1. Strip FAQs if accidentally embedded inside category description
  const faqSplit = clean.split(/<h[23]>FAQs<\/h[23]>/i);
  if (faqSplit.length > 1) {
    clean = faqSplit[0];
  }

  // 2. Strip inline typography & legacy colors/widths to enforce site fonts & brand theme
  clean = clean.replace(/style="([^"]*)"/gi, (match, styles) => {
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
  clean = clean.replace(/href=["']https?:\/\/(?:www\.)?store4riders\.com\/?([^"']*)["']/gi, (match, path) => {
    const cleanPath = path ? `/${path.replace(/\.html(\?.*)?$/i, "$1")}` : "/";
    return `href="${cleanPath}"`;
  });
  clean = clean.replace(/href=["']\/([^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');
  clean = clean.replace(/href=["']([^"'\/][^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');

  // External links (e.g. YouTube): ensure target="_blank" and rel="noopener noreferrer"
  clean = clean.replace(
    /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/(?!(?:www\.)?store4riders\.com)[^"']+)["']([^>]*)>/gi,
    (match, url, rest) => {
      const cleanRest = rest.replace(/\s*(?:target|rel)=["'][^"']*["']/gi, "");
      return `<a href="${url}" target="_blank" rel="noopener noreferrer"${cleanRest}>`;
    }
  );

  // 5. Force tables to be 100% responsive without horizontal scrolling on mobile
  clean = clean.replace(
    /<table[^>]*>/gi,
    '<div class="w-full max-w-full overflow-hidden my-3"><table class="w-full max-w-full table-fixed border-collapse border border-neutral-200 text-[10px] min-[375px]:text-[11px] sm:text-xs text-neutral-800 break-words [overflow-wrap:anywhere] [word-break:break-word] [hyphens:auto]">'
  );
  clean = clean.replace(/<\/table>/gi, "</table></div>");
  clean = clean.replace(
    /<th[^>]*>/gi,
    '<th class="border border-neutral-200 bg-neutral-100/90 p-1 sm:p-2 text-left font-bold break-words [overflow-wrap:anywhere] [word-break:break-word] align-top text-[10px] min-[375px]:text-[11px] sm:text-xs">'
  );
  clean = clean.replace(
    /<td[^>]*>/gi,
    '<td class="border border-neutral-200 p-1 sm:p-2 break-words [overflow-wrap:anywhere] [word-break:break-word] align-top text-[10px] min-[375px]:text-[11px] sm:text-xs">'
  );

  // 6. Force images to never exceed container width
  clean = clean.replace(/<img([^>]*)>/gi, '<img$1 class="max-w-full h-auto rounded-md shadow-xs my-2" />');

  return clean;
}

/**
 * Strips HTML tags for Google Search bot structured data (JSON-LD FAQPage Schema)
 */
export function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
