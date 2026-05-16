export default function CategoryLoading() {
  return (
    <div className="pt-20 pb-16 px-6 bg-offwhite min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        {/* Back link skeleton */}
        <div className="h-3 w-20 bg-sand/50 rounded-sm mb-4 animate-pulse" />

        {/* Category header skeleton */}
        <div className="text-center mb-10">
          <div className="h-10 w-10 bg-sand/50 rounded-full mx-auto mb-2 animate-pulse" />
          <div className="h-8 w-52 bg-sand/60 rounded-sm mx-auto mb-2 animate-pulse" />
          <div className="divider divider-white" />
          <div className="h-4 w-80 bg-sand/40 rounded-sm mx-auto mt-3 animate-pulse" />
          <div className="h-3 w-16 bg-sand/30 rounded-sm mx-auto mt-2 animate-pulse" />
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
    </div>
  )
}
