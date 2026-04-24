interface SkeletonLoaderProps {
  rows?: number
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse flex space-x-4 p-4 border-b border-gray-100">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-5 bg-gray-200 rounded-full w-16" />
      <div className="h-4 bg-gray-200 rounded w-24" />
    </div>
  )
}

export default function SkeletonLoader({ rows = 5 }: SkeletonLoaderProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  )
}
