import { CalendarCheck, UserRoundPlus, CircleDollarSign, DollarSign, LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { QuoteStatItem } from "@/lib/types/quotes"

const iconMap: Record<string, LucideIcon> = {
  CalendarCheck,
  UserRoundPlus,
  CircleDollarSign,
  DollarSign
}

interface QuotesStatsProps {
  stats: QuoteStatItem[]
}

export function QuotesStats({ stats }: QuotesStatsProps) {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const isNegative = stat.trend === 'down';
        const Icon = iconMap[stat.iconName] || CircleDollarSign;

        return (
          <Card key={stat.id} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
            <CardContent className="p-4 md:p-6 flex items-center gap-4">
              {/* Icon Box */}
              <div className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 md:h-6 md:w-6 text-[var(--primary-skyblue)]" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">
                  {stat.title}
                </p>
                <div className="flex items-end justify-between mt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                  <span
                    className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 md:px-2 md:py-1 rounded-[6px] ${
                      isNegative
                        ? 'bg-[#FFACB1] text-black'
                        : 'bg-white text-black'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  )
}
