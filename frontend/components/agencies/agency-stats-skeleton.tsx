import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AgencyStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
          <CardContent className="p-3 sm:p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-xl bg-white shrink-0" />
              <Skeleton className="h-8 w-16 bg-white/50 ml-3" />
            </div>
            <Skeleton className="h-4 w-24 bg-white/50" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
