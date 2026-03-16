import { CalendarCheck, UserRoundPlus, CircleDollarSign, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatItem } from "@/lib/types/dashboard"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StatsCardsProps {
  stats: StatItem[];
  isLoading?: boolean;
}

const iconMap: Record<string, any> = {
  'total_quotes': CalendarCheck,
  'new_clients': UserRoundPlus,
  'confirmed_bookings': CalendarCheck,
  'conversion_rate': TrendingUp,
  'average_yield': DollarSign,
};

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  if (isLoading || !stats || stats.length === 0) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
            <CardContent className="p-3 sm:p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-xl bg-white/80" />
                <Skeleton className="h-6 w-16 bg-white/50" />
              </div>
              <Skeleton className="h-3 w-full bg-white/50" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => {
        const Icon = iconMap[stat.id] || CircleDollarSign;

        return (
          <Card key={stat.id} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
            <CardContent className="p-3 sm:p-4 flex flex-col gap-1.5">
              {/* Icon and Count side by side */}
              <div className="flex items-center gap-2">
                {/* Icon Box */}
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-[var(--primary-skyblue)]" />
                </div>
                
                {/* Count */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-none ml-3">
                  {stat.value}
                </h3>
              </div>
              
              {/* Title - fully visible with responsive text */}
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  )
}