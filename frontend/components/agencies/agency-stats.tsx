import { AgencyDashboardStats } from "@/lib/types/agencies"
import { Building2, TrendingUp, Users, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AgencyStatsProps {
  stats: AgencyDashboardStats
}

export function AgencyStats({ stats }: AgencyStatsProps) {
  const statCards = [
    {
      title: "Total Agencies",
      value: stats.totalAgencies,
      icon: Building2,
    },
    {
      title: "Active Agencies",
      value: stats.activeAgencies,
      icon: TrendingUp,
    },
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: DollarSign,
    },
    {
      title: "Total Agents",
      value: stats.totalAgents,
      icon: Users,
    },
  ]

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {statCards.map((card, index) => (
        <Card key={index} className="bg-[#EFF8FF] border-none shadow-none rounded-xl">
          <CardContent className="p-3 sm:p-4 flex flex-col gap-1.5">
            {/* Icon and Count side by side */}
            <div className="flex items-center gap-2">
              {/* Icon Box */}
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                <card.icon className="h-5 w-5 text-[var(--primary-skyblue)]" />
              </div>
              
              {/* Count */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-none ml-3">
                {card.value}
              </h3>
            </div>
            
            {/* Title - fully visible with responsive text */}
            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-tight">
              {card.title}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
