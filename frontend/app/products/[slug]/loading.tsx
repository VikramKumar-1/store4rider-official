/**
 * Next.js App Router loading.tsx — shows INSTANTLY when navigating
 * to /products/[slug]. No API call needed, no JS bundle download needed.
 * This is the #1 way to make page transitions feel instant.
 */
export default function ProductDetailLoading() {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="h-10 bg-neutral-50 animate-pulse" />
      <div className="h-14 bg-white border-b border-neutral-200" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6">
        {/* Breadcrumb skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-3 w-12 bg-neutral-100 rounded" />
          <div className="h-3 w-4 bg-neutral-100 rounded" />
          <div className="h-3 w-24 bg-neutral-100 rounded" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Gallery skeleton */}
          <div className="w-full lg:w-[40%]">
            <div className="aspect-square bg-neutral-100 rounded-md animate-pulse" />
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-20 h-20 bg-neutral-100 rounded-sm animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="w-full lg:w-[60%] space-y-5 pt-2">
            <div className="h-3 w-28 bg-neutral-100 rounded animate-pulse" />
            <div className="h-8 w-4/5 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
            <div className="h-7 w-32 bg-neutral-100 rounded animate-pulse" />
            <div className="space-y-2 mt-6">
              <div className="h-3 w-full bg-neutral-100 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-neutral-100 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
