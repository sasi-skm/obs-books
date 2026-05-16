export default function ShopLoading() {
  return (
    <div className="pt-20 pb-16 px-6">
      {/* Page heading skeleton */}
      <div className="text-center mb-10">
        <div className="h-8 w-48 bg-sand/60 rounded-sm mx-auto mb-3 animate-pulse" />
        <div className="divider divider-cream" />
        <div className="h-4 w-72 bg-sand/40 rounded-sm mx-auto mt-3 animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="max-w-[1200px] mx-auto mb-8">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-sand/50 rounded-sm animate-pulse" />
          ))}
        </div>
        <div className="max-w-md mx-auto h-10 bg-sand/40 rounded-sm animate-pulse" />
      </div>

      {/* Book grid skeleton */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-cream border border-sand rounded-sm overflow-hidden">
            <div className="aspect-square bg-parchment animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-sand/60 rounded-sm animate-pulse" />
              <div className="h-3 w-3/4 bg-sand/40 rounded-sm animate-pulse" />
              <div className="h-3 w-1/2 bg-sand/40 rounded-sm animate-pulse" />
              <div className="flex items-center justify-between mt-3">
                <div className="h-5 w-16 bg-sand/50 rounded-sm animate-pulse" />
                <div className="h-7 w-20 bg-parchment rounded-sm animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
