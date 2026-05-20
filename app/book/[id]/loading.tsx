export default function BookDetailLoading() {
  return (
    <div className="min-h-screen bg-cream pt-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto py-10">
        {/* Breadcrumb skeleton */}
        <div className="h-3 w-48 bg-sand/40 animate-pulse rounded-sm mb-8" />

        {/* Two-column detail layout */}
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Left - image column */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="aspect-[3/4] bg-sand/40 animate-pulse rounded-sm" />
            {/* Thumbnail strip */}
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-14 bg-sand/30 animate-pulse rounded-sm" />
              ))}
            </div>
          </div>

          {/* Right - info column */}
          <div className="space-y-4">
            {/* Title */}
            <div className="h-9 bg-sand/60 animate-pulse rounded-sm w-4/5" />
            <div className="h-6 bg-sand/40 animate-pulse rounded-sm w-3/5" />

            {/* Author */}
            <div className="h-4 bg-sand/30 animate-pulse rounded-sm w-2/5 mt-1" />

            <div className="border-t border-sand my-4" />

            {/* Price */}
            <div className="h-8 w-28 bg-sand/50 animate-pulse rounded-sm" />

            {/* Condition selector */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 w-24 bg-sand/40 animate-pulse rounded-sm" />
              ))}
            </div>

            {/* Add to cart button */}
            <div className="h-12 bg-sage/20 animate-pulse rounded-sm w-full mt-2" />

            <div className="border-t border-sand my-4" />

            {/* Description lines */}
            <div className="space-y-2">
              <div className="h-3 bg-sand/30 animate-pulse rounded-sm w-full" />
              <div className="h-3 bg-sand/30 animate-pulse rounded-sm w-11/12" />
              <div className="h-3 bg-sand/30 animate-pulse rounded-sm w-4/5" />
              <div className="h-3 bg-sand/30 animate-pulse rounded-sm w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
