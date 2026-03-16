import { Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TaskItem } from "@/lib/types/dashboard"

interface OverviewListProps {
  tasks: TaskItem[];
}

const colorMap: Record<string, string> = {
  call: "bg-red-50 text-red-600",
  message: "bg-blue-50 text-blue-600",
  task: "bg-blue-50 text-blue-600",
  alert: "bg-red-50 text-red-600",
};

export function OverviewList({ tasks }: OverviewListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Today's Overview</CardTitle>
        <Button variant="link" className="text-xs text-blue-500">
          View All &gt;
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between rounded-lg border p-4 ${
              task.type === "call" || task.type === "alert" ? "bg-red-50/50" : "bg-card"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-2 ${colorMap[task.type]}`}>
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{task.time}</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <Clock className="h-4 w-4" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
