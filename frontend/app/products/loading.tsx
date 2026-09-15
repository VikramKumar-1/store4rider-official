/**
 * Next.js loading.tsx for /products page.
 * Shows instantly while the page JS chunk downloads.
 */
export default function ProductsLoading() {
  return (
    <div className="w-full min-h-screen bg-white">
      <div className="h-10 bg-neutral-50 animate-pulse" />
      <div className="h-14 bg-white border-b border-neutral-200" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-10 pb-6">
        <div className="h-12 w-64 bg-neutral-100 rounded animate-pulse" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="aspect-[3/4] bg-neutral-100 rounded-sm" />
              <div className="h-3 w-20 bg-neutral-100 rounded" />
              <div className="h-5 w-3/4 bg-neutral-100 rounded" />
              <div className="h-3 w-16 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
