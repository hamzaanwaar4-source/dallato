import { Zap, Sparkles, MessageSquare, Clock, Lightbulb, LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AICapabilityItem } from "@/lib/types/quoteAssistant"

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  MessageSquare,
  Clock,
  Lightbulb
}

interface AICapabilitiesProps {
  capabilities: AICapabilityItem[]
}

export function AICapabilities({ capabilities }: AICapabilitiesProps) {
  return (
    <Card className="shadow-sm bg-white rounded-xl">
      <CardHeader className="pb-2 px-3 md:px-4 pt-3 md:pt-4">
        <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 !text-[var(--quote-icons)]" />
          AI Capabilities
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-3">
        <div className="space-y-1.5 md:space-y-2">
          {capabilities.map((capability) => {
            const Icon = iconMap[capability.iconName] || Sparkles
            
            return (
              <div key={capability.id} className="flex items-start gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer hover:border-gray-200">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-[var(--quote-icons-bg)] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 !text-[var(--quote-icons)]" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">{capability.title}</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">{capability.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
