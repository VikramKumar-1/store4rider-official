export interface VideoEmbedInfo {
  type: "youtube" | "vimeo" | "video";
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
}

/**
 * Parses a video URL (YouTube, Vimeo, or direct MP4/WebM) and produces
 * a secure, privacy-preserving embed URL for responsive iframes.
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
  const ytRegex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      originalUrl: trimmed,
      videoId,
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

  // 3. Direct HTML5 video file (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "video",
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  return null;
}
