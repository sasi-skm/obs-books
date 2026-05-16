export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-cream pt-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Page header skeleton */}
        <div className="py-8 border-b border-sand mb-6">
          <div className="h-8 w-48 bg-sand/60 animate-pulse rounded-sm mb-2" />
          <div className="h-4 w-72 bg-sand/40 animate-pulse rounded-sm" />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex gap-2 flex-wrap mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 bg-sand/50 animate-pulse rounded-sm"
            />
          ))}
        </div>

        {/* Book card grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-cream border border-sand rounded-sm overflow-hidden"
            >
              {/* Square image placeholder */}
              <div className="aspect-square bg-sand/40 animate-pulse" />
              {/* Text lines */}
              <div className="p-4 space-y-2">
                <div className="h-4 bg-sand/50 animate-pulse rounded-sm w-5/6" />
                <div className="h-3 bg-sand/40 animate-pulse rounded-sm w-3/4" />
                <div className="h-3 bg-sand/30 animate-pulse rounded-sm w-1/2 mt-1" />
                <div className="flex items-center justify-between mt-3">
                  <div className="h-5 w-16 bg-sand/50 animate-pulse rounded-sm" />
                  <div className="h-7 w-20 bg-sage/20 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
