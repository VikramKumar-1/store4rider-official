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
 * Detects which known color an image belongs to based on altText or URL tokens.
 * Accurately parses altText formats: 'Product - Color', 'Product-Color', 'Product- Color', etc.
 */
export function detectImageColor(
  img: { url?: string; altText?: string },
  knownColors: string[]
): string | null {
  if (!img || !knownColors || knownColors.length === 0) return null;
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
    const color = img.detectedColor || detectImageColor(img, knownColors);
    const angle = img.angle !== undefined ? img.angle : extractAngleNumber(filename);

    let key: string;
    if (color) {
      key = `${color.toLowerCase()}-angle-${angle}`;
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

