import { Skeleton } from "@/components/ui/skeleton"

export function QuoteItemSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 flex items-center gap-4 border-b border-gray-50">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-1/3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-4 bg-gray-50/30">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
        <div className="flex flex-col items-center">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
        <div className="flex flex-col items-end">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      </div>

      <div className="px-4 py-3 flex justify-between items-center border-t border-gray-50">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  )
}
