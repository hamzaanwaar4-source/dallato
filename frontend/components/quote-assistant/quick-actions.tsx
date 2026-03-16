import { TrendingUp, Users, Calendar, FileBarChart, Sparkles, LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuickActionItem } from "@/lib/types/quoteAssistant"

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Users,
  Calendar,
  FileBarChart
}

interface QuickActionsProps {
  actions: QuickActionItem[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card className="shadow-sm bg-white rounded-xl">
      <CardHeader className="pb-2 px-3 md:px-4 pt-3 md:pt-4">
        <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 !text-[var(--quote-icons)]" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-3">
        <div className="space-y-1.5 md:space-y-2">
          {actions.map((action) => {
            const Icon = iconMap[action.iconName] || TrendingUp
            
            return (
              <div key={action.id} className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-[var(--quote-icons-bg)] flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 !text-[var(--quote-icons)]" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">{action.title}</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">{action.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
