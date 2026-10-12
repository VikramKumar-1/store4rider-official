import { permanentRedirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Legacy Product Route Redirect:
 * Permanently redirects (HTTP 301) /products/[slug] to the clean root-level URL /[slug].
 * Preserves SEO equity and prevents broken links for existing bookmarks.
 */
export default async function LegacyProductDetailPage({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/${slug}`);
}
