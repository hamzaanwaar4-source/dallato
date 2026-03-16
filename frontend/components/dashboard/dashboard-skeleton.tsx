import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function DashboardSkeleton({ role }: { role?: string }) {
  if (role === "Platform SuperAdmin") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 p-6 border rounded-xl bg-slate-50/30">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-80 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* 1. System Health Skeleton */}
        <Card className="col-span-full border-none shadow-sm rounded-xl">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Skeleton className="lg:col-span-2 h-[250px] w-full rounded-xl" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 pt-6">
                <Skeleton className="h-[160px] w-[160px] rounded-full shrink-0" />
                <div className="flex-1 w-full sm:w-auto space-y-3 sm:pl-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Skeleton className="w-2.5 h-2.5 rounded-sm mt-1 shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Top Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-white/80" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20 bg-white/50" />
                <div className="flex items-end justify-between">
                  <Skeleton className="h-6 w-16 bg-white/50" />
                  <Skeleton className="h-4 w-10 bg-white/50" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Upcoming Departures Banner */}
      <Skeleton className="h-32 w-full rounded-xl" />

      {/* 3. Middle Section: Charts & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2/3): Charts & Todo */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Heat Map Row */}
          <Card className="border-none shadow-sm rounded-xl">
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-xl">
              <CardContent className="p-6">
                <Skeleton className="h-[250px] w-full" />
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm rounded-xl">
              <CardContent className="p-6">
                <Skeleton className="h-[250px] w-full" />
              </CardContent>
            </Card>
          </div>
          
          {/* To-Do List */}
          <Card className="border-none shadow-sm rounded-xl">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Approved Quotes */}
          <Card className="border-none shadow-sm rounded-xl">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Sidebar Widgets */}
        <div className="xl:col-span-1 space-y-6">
          {/* Travel Suggestions */}
          <Card className="border-none shadow-sm rounded-xl">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-none shadow-sm rounded-xl">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-36" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
