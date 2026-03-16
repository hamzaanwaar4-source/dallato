import { Plane, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DepartureItem, UpcomingDeparturesData } from "@/lib/types/dashboard"

interface DeparturesProps {
  departures: UpcomingDeparturesData;
}

const tagColorMap = {
  urgent: "bg-red-100 text-red-600",
  warning: "bg-orange-100 text-orange-600",
  info: "bg-blue-100 text-blue-600",
};

export function Departures({ departures }: DeparturesProps) {
  const urgentCount = departures.urgent_count;

  return (
    <Card className="bg-orange-50/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-base">Upcoming Departures</CardTitle>
        </div>
        {urgentCount > 0 && (
          <Badge className="bg-orange-500 hover:bg-orange-600">{urgentCount} Urgent</Badge>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {departures.items.map((dep) => (
          <Card key={dep.id} className="bg-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div>
                    <p className="font-medium text-sm">{dep.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {dep.location}
                    </p>
                  </div>
                </div>

                <span className={`text-xs px-2 py-1 rounded-full font-medium ${dep.tagType ? tagColorMap[dep.tagType] : 'bg-gray-100 text-gray-600'}`}>
                  {dep.tag}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <p className="text-muted-foreground">Departure</p>
                  <p className="font-medium">{dep.departureDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Return</p>
                  <p className="font-medium">{dep.returnDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-xs">
                  <p className="font-medium">Flight: {dep.flight}</p>
                  <p className="text-muted-foreground">Time: {dep.time}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle2 className="h-3 w-3" />
                  {dep.status}
                </div>
              </div>
              
              <div className="mt-2 text-[10px] text-blue-400">
                Booking: {dep.bookingRef}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
