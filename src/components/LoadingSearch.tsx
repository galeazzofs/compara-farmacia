export default function LoadingSearch() {
  return (
    <div className="flex flex-col gap-6">
      {/* Status text */}
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 shrink-0">
          <svg
            className="animate-spin text-teal-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600">
          Buscando preços em 5 farmácias…
        </p>
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-1 rounded-full bg-gray-200" />
          <div className="h-4 w-28 rounded-md bg-gray-200" />
        </div>
        <div className="h-5 w-20 rounded-full bg-gray-200" />
      </div>

      {/* Product name */}
      <div className="flex flex-col gap-1.5">
        <div className="h-3.5 w-full rounded bg-gray-200" />
        <div className="h-3.5 w-3/4 rounded bg-gray-200" />
      </div>

      {/* Price block */}
      <div className="flex flex-col gap-2 rounded-xl bg-gray-50 px-4 py-3">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-12 rounded bg-gray-200" />
          <div className="h-3 w-14 rounded bg-gray-200" />
        </div>
        <div className="mt-2 border-t border-gray-200 pt-2 flex justify-between items-center">
          <div className="h-4 w-10 rounded bg-gray-200" />
          <div className="h-6 w-24 rounded bg-gray-200" />
        </div>
      </div>

      {/* CTA */}
      <div className="h-10 w-full rounded-xl bg-gray-200" />
    </div>
  );
}
