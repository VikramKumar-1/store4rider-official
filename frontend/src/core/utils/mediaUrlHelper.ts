export interface VideoEmbedInfo {
  type: "youtube" | "vimeo" | "video" | "iframe";
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
  thumbnailUrl?: string;
}

/**
 * Normalizes external/third-party image URLs so that:
 * 1. Google Drive preview links become direct viewable image links
 * 2. Dropbox share links become direct image links (?raw=1)
 * 3. Imgur page links become direct image links
 * 4. Google Images search redirect URLs extract the genuine image URL
 * 5. Insecure "http://" URLs are upgraded to "https://" to prevent browser Mixed Content Blocking
 */
export function normalizeExternalImageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim().replace(/^["']|["']$/g, "");
  if (!url) return "";

  // 1. Google Images redirect: extract actual imgurl parameter
  if (url.includes("google.") && url.includes("/imgres")) {
    try {
      const parsed = new URL(url);
      const imgurl = parsed.searchParams.get("imgurl");
      if (imgurl) {
        url = decodeURIComponent(imgurl);
      }
    } catch {
      // Keep as-is
    }
  }

  // 2. Google Drive share links -> direct high-speed image stream
  // Examples:
  // - https://drive.google.com/file/d/1A2B3C.../view?usp=sharing
  // - https://drive.google.com/open?id=1A2B3C...
  // - https://drive.google.com/uc?id=1A2B3C...
  const gDriveMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=))([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 3. Dropbox share links -> direct raw file
  if (url.includes("dropbox.com")) {
    if (url.includes("?dl=0")) {
      url = url.replace("?dl=0", "?raw=1");
    } else if (!url.includes("?raw=1") && !url.includes("&raw=1")) {
      url = `${url}${url.includes("?") ? "&" : "?"}raw=1`;
    }
  }

  // 4. Imgur page links -> direct image
  const imgurMatch = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/i);
  if (imgurMatch && imgurMatch[1] && !["a", "gallery"].includes(imgurMatch[1])) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // 5. Upgrade http to https where applicable to avoid browser Mixed Content Blocking
  if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    url = url.replace("http://", "https://");
  }

  // 6. Append cache-busting version query parameter to CloudFront URLs
  // This guarantees all client browsers instantly discard stale low-res thumbnails from local disk cache
  if (url.includes("d2zuvpvc0pfkya.cloudfront.net") && !url.includes("?v=") && !url.includes("&v=")) {
    url = `${url}?v=2`;
  }

  return url;
}

/**
 * Parses video URLs (YouTube, Vimeo, HTML5 .mp4/.webm, or generic embeds)
 * and returns ready-to-use embed metadata for responsive players.
 */
export function getVideoEmbedInfo(url?: string | null): VideoEmbedInfo | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube formats:
  // - https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // - https://youtu.be/dQw4w9WgXcQ
  // - https://www.youtube.com/embed/dQw4w9WgXcQ
  // - https://www.youtube.com/shorts/dQw4w9WgXcQ
  // - https://www.youtube.com/live/dQw4w9WgXcQ
  const ytRegex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      originalUrl: trimmed,
      videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 2. Vimeo formats:
  // - https://vimeo.com/123456789
  // - https://player.vimeo.com/video/123456789
  const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+))/i;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
      originalUrl: trimmed,
      videoId,
    };
  }

  // 3. Direct HTML5 video file (.mp4, .webm, .ogg, .mov, including S3 signed URLs)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "video",
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  // 4. Generic iframe / embed URL (e.g. Cloudflare Stream, Bunny Stream, Dailymotion embed, etc.)
  if (trimmed.includes("/embed/") || trimmed.includes("player.")) {
    return {
      type: "iframe",
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  return null;
}


/**
 * Normalizes a string for comparison by stripping all non-alphanumeric characters.
 */
export function normalizeForCompare(str?: string | null): string {
  if (!str) return "";
  return str.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * Detects whether an image is a common utility graphic, safety certification,
 * size chart, warranty badge, or technical specification sheet rather than a product photo.
 * Ensures these utility images never leak as product card thumbnails or variant colors.
 */
export function isUtilityOrInfographicImage(
  img?: { url?: string; altText?: string } | string | null
): boolean {
  if (!img) return false;
  const url = typeof img === "string" ? img : img.url || "";
  const alt = typeof img === "string" ? "" : img.altText || "";
  const text = `${url} ${alt}`.toLowerCase();

  const utilityPatterns = [
    /\bsafety\b/,
    /\bcertif(?:ied|ication|icate)?\b/,
    /\bece[-_\s]?(?:22[-_\.]?0[56])?\b/,
    /\b(?:dot|snell|isi)[-_\s]?(?:certified|mark|approved)?\b/,
    /\bce[-_\s]?level\b/,
    /\bimpact[-_\s]?protection\b/,
    /\bwarranty\b/,
    /\bguarantee\b/,
    /\bsize[-_\s]?(?:chart|guide)\b/,
    /\bsizing\b/,
    /\bdimension(?:s)?\b/,
    /\bspec(?:ification|s)?\b/,
    /\bfeature(?:s)?\b/,
    /\binfographic\b/,
    /\banatomy\b/,
    /\bdiagram\b/,
    /\bwash[-_\s]?care\b/,
    /\bcare[-_\s]?instruction\b/,
    /\bhow[-_\s]?to[-_\s]?measure\b/,
  ];

  return utilityPatterns.some((pattern) => pattern.test(text));
}

/**
 * Detects which known color an image belongs to based on altText or URL tokens.
 * Accurately parses altText formats: 'Product - Color', 'Product-Color', 'Product- Color', etc.
 */
export function detectImageColor(
  img: { url?: string; altText?: string },
  knownColors: string[]
): string | null {
  if (!img || !knownColors || knownColors.length === 0) return null;
  // Safety certifications, size charts, warranty, and utility graphics NEVER represent a color variant
  if (isUtilityOrInfographicImage(img)) return null;

  const alt = (img.altText || "").toLowerCase();
  const url = (img.url || "").toLowerCase();

  // 1. Check altText split by dash (supports '-', ' - ', '- ', ' _ ')
  const altParts = alt.split(/-(?:\s*)/);
  if (altParts.length > 1) {
    const lastPart = altParts[altParts.length - 1].trim();
    for (const c of knownColors) {
      if (normalizeForCompare(lastPart) === normalizeForCompare(c)) {
        return c;
      }
    }
  }

  // 2. Exact or substring match in altText or URL
  for (const c of knownColors) {
    const cNorm = normalizeForCompare(c);
    if (normalizeForCompare(alt).includes(cNorm)) return c;

    // Multi-color tokens (e.g. 'orange', 'green', 'red', 'yellow')
    const tokens = c.toLowerCase().split(/[\/\\&\-_+ ]/).filter((t) => t.length > 2);
    const nonBlackTokens = tokens.filter((t) => t !== "black");
    if (nonBlackTokens.length > 0) {
      if (nonBlackTokens.every((t) => alt.includes(t) || url.includes(t))) {
        return c;
      }
    }
  }

  return null;
}

/**
 * Extracts angle / sequence number from image filenames (e.g., -2_1.jpg -> 2, _1_2.jpg -> 1, _2.jpg -> 2, -_1_.jpg -> 1).
 */
export function extractAngleNumber(filename?: string | null): number {
  if (!filename) return 1;
  const clean = filename.split("?")[0].replace(/\.[^/.]+$/, "");
  const match = clean.match(/(?:[-_])(\d+)(?:_\d+|_)?$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 1;
}

/**
 * Enterprise product image deduplicator:
 * 1. Groups images by color and sequence angle.
 * 2. Deduplicates Magento duplicate re-uploads (_1.jpg, -1_1.jpg, _1_2.jpg).
 * 3. Keeps exactly one clean, canonical photo per (color, angle).
 * 4. Orders images logically by angle (1, 2, 3...) per color.
 */
export function deduplicateProductImages(
  images: Array<{ url: string; altText?: string; detectedColor?: string; angle?: number }>,
  knownColors: string[],
  productName: string = ""
): Array<{ url: string; altText: string; detectedColor?: string; angle: number }> {
  if (!images || images.length === 0) return [];

  const seenKeys = new Set<string>();
  const result: Array<{ url: string; altText: string; detectedColor?: string; angle: number }> = [];

  for (const img of images) {
    if (!img || !img.url || img.url === "/no-image.svg") continue;
    const cleanUrl = normalizeExternalImageUrl(img.url);
    const filename = cleanUrl.split("/").pop() || "";
    const isUtility = isUtilityOrInfographicImage(img);
    const color = isUtility ? null : (img.detectedColor || detectImageColor(img, knownColors));
    const angle = img.angle !== undefined ? img.angle : extractAngleNumber(filename);

    let key: string;
    if (color) {
      key = `${color.toLowerCase()}-angle-${angle}`;
    } else if (isUtility) {
      const baseFn = filename.replace(/\.[^/.]+$/, "");
      key = `utility-${baseFn}`;
    } else {
      const baseFn = filename.replace(/\.[^/.]+$/, "").replace(/(?:[-_])\d+(?:_\d+|_)?$/, "");
      key = `common-${baseFn}-angle-${angle}`;
    }

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      const cleanAlt = color && productName ? `${productName} - ${color}` : (img.altText || productName);
      result.push({
        url: cleanUrl,
        altText: cleanAlt,
        detectedColor: color || undefined,
        angle,
      });
    }
  }

  // Sort: keep colors grouped, with angles 1, 2, 3...
  result.sort((a, b) => {
    if (a.detectedColor && b.detectedColor) {
      if (a.detectedColor !== b.detectedColor) {
        const idxA = knownColors.findIndex((c) => normalizeForCompare(c) === normalizeForCompare(a.detectedColor));
        const idxB = knownColors.findIndex((c) => normalizeForCompare(c) === normalizeForCompare(b.detectedColor));
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.detectedColor.localeCompare(b.detectedColor);
      }
      return a.angle - b.angle;
    }
    if (a.detectedColor && !b.detectedColor) return -1;
    if (!a.detectedColor && b.detectedColor) return 1;
    return a.angle - b.angle;
  });

  return result;
}

/**
 * Generates SEO-compliant alt text for a child variant image.
 * Incorporates Product Name, Color, and Size/Volume.
 * 
 * Rules:
 * - If color is "Standard" or omitted, color is excluded: "Product Name (Size)"
 * - If size is omitted: "Product Name - Color"
 * - If both color & size exist: "Product Name - Color (Size)"
 * - If product name is empty, defaults to "Product"
 */
export function buildVariantAltText(
  productName?: string,
  color?: string,
  size?: string
): string {
  const pName = productName?.trim() || "Product";
  const c = color?.trim();
  const s = size?.trim();
  const isStandard = !c || c.toLowerCase() === "standard";

  if (isStandard) {
    return s ? `${pName} (${s})` : pName;
  }
  return s ? `${pName} - ${c} (${s})` : `${pName} - ${c}`;
}

/**
 * Enterprise image resolver for Cart items, Drawers, and Checkout.
 * Accurately shows the selected variant / color image instead of defaulting to product.images[0].
 */
export function getCartItemImage(item: any, fallback: string = "/no-image.svg"): string {
  if (!item) return fallback;
  const product = item.product || {};
  const rawColor = (
    product.selectedColor ||
    item.selectedColor ||
    item.selectedAttributes?.Color ||
    item.selectedAttributes?.color ||
    ""
  ).toLowerCase().trim();
  const isDummyColor = ["standard", "default", "none", "n/a", "na", "-", "--"].includes(rawColor);
  const selectedColor = isDummyColor ? "" : rawColor;

  // 1. Explicit item image
  if (item.image && typeof item.image === "string" && item.image !== "/no-image.svg") {
    return normalizeExternalImageUrl(item.image);
  }

  // 2. Explicit product image attached to item
  if (product.image && typeof product.image === "string" && product.image !== "/no-image.svg") {
    return normalizeExternalImageUrl(product.image);
  }

  // 3. Match against product images by color
  const images = Array.isArray(product.images) ? product.images : [];
  if (selectedColor && images.length > 0) {
    const matchingImg = images.find((img: any) => {
      const alt = (img?.altText || "").toLowerCase();
      const url = (img?.url || "").toLowerCase();
      const detected = (img?.detectedColor || "").toLowerCase();
      return (
        detected === selectedColor ||
        alt.split(/[-_/\s]+/).includes(selectedColor) ||
        alt.includes(selectedColor) ||
        url.includes(selectedColor)
      );
    });
    if (matchingImg?.url) {
      return normalizeExternalImageUrl(matchingImg.url);
    }
  }

  // 4. Default to first product image
  if (images.length > 0 && images[0]?.url) {
    return normalizeExternalImageUrl(images[0].url);
  }

  return fallback;
}

/**
 * Determines the preferred in-stock color for a product:
 * If the default thumbnail's color is out of stock (stock === 0),
 * finds and returns the first variant color that is actually in stock.
 */
export function getPreferredInStockColor(product: any): string | null {
  if (!product) return null;
  const variants = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants
    : (Array.isArray(product.rawVariants) && product.rawVariants.length > 0 ? product.rawVariants : []);

  // Collect total stock per color
  const colorStockMap = new Map<string, number>();
  if (variants.length > 0) {
    for (const v of variants) {
      if (!v) continue;
      const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
      const col = attrs.color || attrs.colour || v.color || v.colour;
      if (col && typeof col === "string") {
        const cName = col.trim();
        const current = colorStockMap.get(cName) || 0;
        colorStockMap.set(cName, current + (Number(v.stock) || 0));
      }
    }
  }

  // If no variants with color attributes, check product.colors or product.colorImages
  if (colorStockMap.size === 0) {
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      for (const c of product.colors) {
        const name = typeof c === "string" ? c : c?.name;
        if (name && typeof name === "string") colorStockMap.set(name.trim(), 1);
      }
    } else if (product.colorImages) {
      const cMap = product.colorImages instanceof Map ? Object.fromEntries(product.colorImages) : product.colorImages;
      for (const k of Object.keys(cMap)) {
        if (k) colorStockMap.set(k.trim(), 1);
      }
    }
  }

  if (colorStockMap.size === 0) return null;

  // Check which color the primary thumbnail or image represents
  const knownColors = Array.from(colorStockMap.keys());
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImg = (
    (product.thumbnail && !isUtilityOrInfographicImage(product.thumbnail) ? product.thumbnail : null) ||
    images.find((img: any) => !isUtilityOrInfographicImage(img)) ||
    images[0]
  );
  const primaryImgObj = typeof primaryImg === "string" ? { url: primaryImg } : primaryImg;
  const primaryColor = primaryImgObj ? detectImageColor(primaryImgObj, knownColors) : null;

  // If backorders are allowed, prefer primary color if valid, otherwise first known color
  if (product.allowBackorders) {
    return primaryColor || knownColors[0] || null;
  }

  // If primary color has stock > 0, keep it
  if (primaryColor && (colorStockMap.get(primaryColor) || 0) > 0) {
    return primaryColor;
  }

  // Otherwise, find the first color with stock > 0
  for (const [col, stock] of colorStockMap.entries()) {
    if (stock > 0) {
      return col;
    }
  }

  // Fallback: if all colors have 0 stock, return primaryColor (matching the card photo)
  // or the first known color, rather than null (which breaks color sync between card and PDP)
  return primaryColor || knownColors[0] || null;
}

/**
 * Resolves the primary thumbnail/display image for any product across catalog,
 * homepage, search, admin, and cart.
 *
 * Priority:
 * 1. If preferredColor is supplied, finds matching image from colorImages, variants, or images
 * 2. If no preferredColor, checks for preferred in-stock color so out-of-stock items aren't featured
 * 3. product.thumbnail (explicit thumbnail)
 * 4. product.images[0].url (first valid gallery image)
 * 5. product.image (legacy image field)
 * 6. First image from product.colorImages map
 * 7. First variant image from product.variants
 * 8. Fallback: fallback string (defaults to "/no-image.svg")
 */
export function getProductThumbnailUrl(
  product: any,
  preferredColor?: string,
  fallback: string = "/no-image.svg"
): string {
  if (!product) return fallback;

  // Automatically prefer in-stock color if no specific color filter was requested
  if (!preferredColor) {
    const inStockColor = getPreferredInStockColor(product);
    if (inStockColor) {
      preferredColor = inStockColor;
    }
  }

  // 1. If preferredColor is specified, try to match it first
  if (preferredColor) {
    const normColor = preferredColor.trim().toLowerCase();

    // 1a. Check colorImages map
    if (product.colorImages) {
      const cMap: Record<string, string> = product.colorImages instanceof Map
        ? Object.fromEntries(product.colorImages)
        : product.colorImages;
      const matchedKey = Object.keys(cMap).find(
        (k) => k.trim().toLowerCase() === normColor || normColor.includes(k.trim().toLowerCase())
      );
      if (matchedKey && cMap[matchedKey] && cMap[matchedKey] !== fallback) {
        const clean = normalizeExternalImageUrl(cMap[matchedKey]);
        if (clean) return clean;
      }
    }

    // 1b. Check variants
    const variantsList = Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants
      : (Array.isArray(product.rawVariants) && product.rawVariants.length > 0 ? product.rawVariants : []);

    if (variantsList.length > 0) {
      const matchedVariant = variantsList.find((v: any) => {
        const vAttrs = v?.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v?.attributes || {});
        const vColor = (vAttrs.color || vAttrs.colour || v?.color || v?.colour || "").trim().toLowerCase();
        return vColor && (vColor === normColor || vColor.includes(normColor) || normColor.includes(vColor));
      });
      const vUrl = matchedVariant?.imageUrl || matchedVariant?.images?.[0]?.url;
      if (vUrl && vUrl !== fallback && !isUtilityOrInfographicImage(vUrl)) {
        const clean = normalizeExternalImageUrl(vUrl);
        if (clean) return clean;
      }
    }

    // 1c. Check images altText or url (strictly skipping utility images)
    if (Array.isArray(product.images) && product.images.length > 0) {
      const matchedImg = product.images.find((img: any) => {
        if (isUtilityOrInfographicImage(img)) return false;
        const alt = (img?.altText || "").toLowerCase();
        const url = (typeof img === "string" ? img : img?.url || "").toLowerCase();
        return alt.includes(normColor) || url.includes(normColor.replace(/\s+/g, "-"));
      });
      const mUrl = typeof matchedImg === "string" ? matchedImg : matchedImg?.url;
      if (mUrl && mUrl !== fallback) {
        const clean = normalizeExternalImageUrl(mUrl);
        if (clean) return clean;
      }
    }
  }

  // 2. Explicit thumbnail (if genuine product photo)
  if (
    product.thumbnail &&
    typeof product.thumbnail === "string" &&
    product.thumbnail !== fallback &&
    !isUtilityOrInfographicImage(product.thumbnail)
  ) {
    const clean = normalizeExternalImageUrl(product.thumbnail);
    if (clean) return clean;
  }

  // 3. First genuine product gallery image (skipping utility/safety graphics)
  if (Array.isArray(product.images) && product.images.length > 0) {
    const genuinePhoto = product.images.find(
      (img: any) => !isUtilityOrInfographicImage(img) && (typeof img === "string" ? img : img?.url) !== fallback
    );
    if (genuinePhoto) {
      const u = typeof genuinePhoto === "string" ? genuinePhoto : genuinePhoto.url;
      const clean = normalizeExternalImageUrl(u);
      if (clean) return clean;
    }
  }

  // 4. Explicit image field (if genuine product photo)
  if (
    product.image &&
    typeof product.image === "string" &&
    product.image !== fallback &&
    !isUtilityOrInfographicImage(product.image)
  ) {
    const clean = normalizeExternalImageUrl(product.image);
    if (clean) return clean;
  }

  // 5. colorImages map (first available)
  if (product.colorImages) {
    const cMap = product.colorImages instanceof Map
      ? Object.fromEntries(product.colorImages)
      : product.colorImages;
    for (const val of Object.values(cMap)) {
      if (typeof val === "string" && val && val !== fallback && !isUtilityOrInfographicImage(val)) {
        const clean = normalizeExternalImageUrl(val);
        if (clean) return clean;
      }
    }
  }

  // 6. Variants imageUrl (first available)
  const variantsPool = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants
    : (Array.isArray(product.rawVariants) && product.rawVariants.length > 0 ? product.rawVariants : []);

  if (variantsPool.length > 0) {
    for (const v of variantsPool) {
      const vUrl = v?.imageUrl || v?.images?.[0]?.url;
      if (vUrl && vUrl !== fallback && !isUtilityOrInfographicImage(vUrl)) {
        const clean = normalizeExternalImageUrl(vUrl);
        if (clean) return clean;
      }
    }
  }

  // 7. Last resort fallback to any gallery image (even utility if that's literally all that exists)
  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      const u = typeof img === "string" ? img : img?.url;
      if (u && u !== fallback) {
        const clean = normalizeExternalImageUrl(u);
        if (clean) return clean;
      }
    }
  }

  return fallback;
}

/**
 * Returns all distinct, valid candidate image URLs available for a product.
 * Useful for image error fallback chains before falling back to placeholder.
 */
export function getProductCandidateImages(product: any): string[] {
  if (!product) return [];
  const candidates: string[] = [];
  const seen = new Set<string>();

  const add = (raw?: string | null) => {
    if (!raw || typeof raw !== "string" || raw === "/no-image.svg") return;
    const clean = normalizeExternalImageUrl(raw);
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      candidates.push(clean);
    }
  };

  if (product.thumbnail) add(product.thumbnail);
  if (product.image) add(product.image);
  if (Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      add(typeof img === "string" ? img : img?.url);
    });
  }
  if (product.colorImages) {
    const cMap = product.colorImages instanceof Map
      ? Object.fromEntries(product.colorImages)
      : product.colorImages;
    Object.values(cMap).forEach((val: any) => add(val));
  }
  if (Array.isArray(product.variants)) {
    product.variants.forEach((v: any) => {
      add(v?.imageUrl);
      if (Array.isArray(v?.images)) {
        v.images.forEach((im: any) => add(typeof im === "string" ? im : im?.url));
      }
    });
  }

  // Prioritize genuine product photos before utility/infographic graphics
  const nonUtility = candidates.filter((u) => !isUtilityOrInfographicImage(u));
  const utility = candidates.filter((u) => isUtilityOrInfographicImage(u));
  return [...nonUtility, ...utility];
}

export const S3_MEDIA_BASE = "https://store4riders.s3.ap-south-2.amazonaws.com";

/**
 * Resolves legacy Magento media directives, wysiwyg paths, and corrupted image URLs
 * into valid, high-resolution direct AWS S3 URLs.
 */
export function resolveMagentoMediaUrls(html: string): string {
  if (!html) return "";

  let clean = html;

  // 1. Decode escaped HTML entities if content contains escaped tags (e.g. from CSV exports)
  if (/&lt;[a-z\/][\s\S]*?&gt;/i.test(clean)) {
    clean = clean
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }

  // 2. Normalize doubled quotes from CSV exports ("" -> ")
  clean = clean.replace(/""/g, '"');

  // 3. Fix broken /catalog/product/ URLs in S3 image paths for description/wysiwyg images.
  // In the imported catalog, CMS/wysiwyg images were mistakenly prefixed with /catalog/product/.
  // S3 stores all CMS description images under /wysiwyg/ (e.g. wysiwyg/smk-twister-specification.JPG).
  clean = clean.replace(
    /https?:\/\/store4riders\.s3\.ap-south-2\.amazonaws\.com\/catalog\/product\/([^"'\s>]+)/gi,
    (_match, filePath) => {
      let cleanPath = filePath
        .replace(/&quot;/g, "")
        .replace(/^["']|["']$/g, "")
        .replace(/^wysiwyg\//i, "")
        .trim();
      const encoded = cleanPath
        .split("/")
        .map((seg: string) => encodeURIComponent(decodeURIComponent(seg)))
        .join("/");
      return `${S3_MEDIA_BASE}/wysiwyg/${encoded}`;
    }
  );

  // 4. Resolve Magento {{media url="..."}} tokens
  clean = clean.replace(
    /\{\{media\s+url=(?:&quot;|""|"|'|\\")?(.*?)(?:&quot;|""|"|'|\\")?\}\}/gi,
    (_match, rawPath) => {
      let cleanPath = rawPath
        .replace(/&quot;/g, "")
        .replace(/^["'\\]+|["'\\]+$/g, "")
        .trim();

      if (cleanPath.startsWith("pub/media/")) {
        cleanPath = cleanPath.substring(10);
      } else if (cleanPath.startsWith("media/")) {
        cleanPath = cleanPath.substring(6);
      }

      // If it doesn't already start with wysiwyg/ or catalog/, CMS media belongs under wysiwyg/
      if (!cleanPath.startsWith("wysiwyg/") && !cleanPath.startsWith("catalog/")) {
        cleanPath = `wysiwyg/${cleanPath}`;
      }

      const encoded = cleanPath
        .split("/")
        .map((seg: string) => encodeURIComponent(decodeURIComponent(seg)))
        .join("/");
      return `${S3_MEDIA_BASE}/${encoded}`;
    }
  );

  // 5. Resolve legacy mmpl.store4riders.com or store4riders.com media domains in img src
  clean = clean.replace(
    /src=(["']?)https?:\/\/(?:www\.)?(?:mmpl\.)?store4riders\.com\/(?:pub\/)?media\/(?:wysiwyg\/)?([^"'\s>]+)\1/gi,
    (_match, _quote, filePath) => {
      const cleanPath = filePath.replace(/&quot;/g, "").trim();
      const encoded = cleanPath
        .split("/")
        .map((seg: string) => encodeURIComponent(decodeURIComponent(seg)))
        .join("/");
      return `src="${S3_MEDIA_BASE}/wysiwyg/${encoded}"`;
    }
  );

  // 6. Resolve raw relative media paths: src="/media/...", src="/pub/media/...", src="media/..."
  clean = clean.replace(
    /src=(["']?)\/?(?:pub\/)?media\/(?:wysiwyg\/)?([^"'\s>]+)\1/gi,
    (_match, _quote, filePath) => {
      const cleanPath = filePath.replace(/&quot;/g, "").trim();
      const encoded = cleanPath
        .split("/")
        .map((seg: string) => encodeURIComponent(decodeURIComponent(seg)))
        .join("/");
      return `src="${S3_MEDIA_BASE}/wysiwyg/${encoded}"`;
    }
  );

  // 7. Resolve raw wysiwyg paths: src="/wysiwyg/..." or src="wysiwyg/..."
  clean = clean.replace(
    /src=(["']?)\/?wysiwyg\/([^"'\s>]+)\1/gi,
    (_match, _quote, filePath) => {
      const cleanPath = filePath.replace(/&quot;/g, "").trim();
      const encoded = cleanPath
        .split("/")
        .map((seg: string) => encodeURIComponent(decodeURIComponent(seg)))
        .join("/");
      return `src="${S3_MEDIA_BASE}/wysiwyg/${encoded}"`;
    }
  );

  // 8. Ensure any spaces inside existing S3 image URLs are URL-encoded
  clean = clean.replace(
    /src=(["'])(https?:\/\/store4riders\.s3\.ap-south-2\.amazonaws\.com\/[^"'\s>]+(?:\s+[^"'\s>]+)*)\1/gi,
    (_match, _quote, fullUrl) => {
      try {
        const urlObj = new URL(fullUrl);
        const encodedPath = urlObj.pathname
          .split("/")
          .map((seg: string) => encodeURIComponent(decodeURIComponent(seg)))
          .join("/");
        return `src="${urlObj.origin}${encodedPath}${urlObj.search}"`;
      } catch {
        return `src="${encodeURI(fullUrl)}"`;
      }
    }
  );

  return clean;
}

