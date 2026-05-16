export default function BookDetailLoading() {
  return (
    <div className="pt-20 pb-16 px-6 min-h-screen bg-cream">
      <div className="max-w-[1100px] mx-auto">
        {/* Back link skeleton */}
        <div className="h-3 w-24 bg-sand/50 rounded-sm mb-6 animate-pulse" />

        <div className="grid md:grid-cols-[45%_55%] gap-10">
          {/* LEFT: image + description skeleton */}
          <div>
            {/* Main image */}
            <div className="relative overflow-hidden border border-sand mb-2 bg-parchment animate-pulse" style={{ aspectRatio: '2/3' }} />
            {/* Description */}
            <div className="border-t border-sand pt-5 space-y-2">
              <div className="h-3 w-28 bg-sand/50 rounded-sm animate-pulse" />
              <div className="h-4 w-full bg-sand/40 rounded-sm animate-pulse" />
              <div className="h-4 w-5/6 bg-sand/40 rounded-sm animate-pulse" />
              <div className="h-4 w-4/6 bg-sand/40 rounded-sm animate-pulse" />
            </div>
          </div>

          {/* RIGHT: details skeleton */}
          <div className="space-y-3">
            {/* Title */}
            <div className="h-7 w-3/4 bg-sand/60 rounded-sm animate-pulse" />
            {/* Author */}
            <div className="h-4 w-1/3 bg-sand/40 rounded-sm animate-pulse" />
            {/* Category */}
            <div className="h-3 w-24 bg-sand/40 rounded-sm animate-pulse" />
            {/* Condition */}
            <div className="h-4 w-40 bg-sand/40 rounded-sm animate-pulse mt-2" />
            {/* Price */}
            <div className="h-9 w-28 bg-sand/50 rounded-sm animate-pulse mt-2" />
            {/* Add to cart button */}
            <div className="h-11 w-full bg-parchment rounded-sm animate-pulse" />
            {/* Delivery */}
            <div className="h-12 border border-sand rounded-sm bg-parchment/50 animate-pulse" />
            {/* Ship note */}
            <div className="h-10 bg-parchment rounded-sm animate-pulse" />
            {/* Specs table */}
            <div className="border border-sand rounded-sm overflow-hidden mt-4">
              <div className="h-8 bg-parchment border-b border-sand animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-2.5 border-b border-sand last:border-0">
                  <div className="h-3 w-20 bg-sand/40 rounded-sm animate-pulse" />
                  <div className="h-3 w-32 bg-sand/30 rounded-sm animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
