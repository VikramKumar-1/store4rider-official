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
