
import { AlertTriangle, AlertCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertItem } from "@/lib/types/dashboard"

interface AlertsProps {
  alerts: AlertItem[];
}

const styleMap = {
  urgent: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-100", color: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-yellow-50", border: "border-yellow-100", color: "text-yellow-600" },
  info: { icon: AlertCircle, bg: "bg-blue-50", border: "border-blue-100", color: "text-blue-500" },
};

export function Alerts({ alerts }: AlertsProps) {
  const urgentCount = alerts.filter(a => a.type === 'urgent').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-500" />
          <CardTitle className="text-base">Alerts & Warnings</CardTitle>
        </div>
        {urgentCount > 0 && (
          <Badge variant="destructive" className="bg-red-500">{urgentCount} Urgent</Badge>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        {alerts.map((alert) => {
          const style = styleMap[alert.type];
          const Icon = style.icon;
          
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${style.bg} ${style.border}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${style.color}`} />
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  {alert.subtitle && (
                    <p className="text-xs text-muted-foreground">{alert.subtitle}</p>
                  )}
                </div>
              </div>
              <Button variant="link" className="text-xs text-blue-500 h-auto p-0">
                View
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  )
}
