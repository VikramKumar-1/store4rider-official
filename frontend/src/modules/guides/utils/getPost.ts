import { getGuideBySlug } from "../data/guides-data";

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const API_BASE = rawApiBase.includes("/v1")
  ? rawApiBase
  : rawApiBase.endsWith("/api")
  ? `${rawApiBase}/v1`
  : `${rawApiBase}/api/v1`;

export async function fetchGuideOrBlogPost(slug: string): Promise<any | null> {
  if (!slug) return null;

  // 1. First check local static guide posts
  const staticPost = getGuideBySlug(slug);
  if (staticPost) return staticPost;

  // 2. Query dynamic backend blog API
  try {
    const res = await fetch(`${API_BASE}/blog/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}
