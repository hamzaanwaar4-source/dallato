import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function QuoteHistory() {
  return (
    <Card className="shadow-sm bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
      <CardContent className="p-3 md:p-4 flex items-center justify-between">
        <span className="text-sm md:text-base font-semibold text-gray-900">History</span>
        <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
          <Clock className="h-4 w-4 md:h-5 md:w-5 text-[#111827]" />
        </div>
      </CardContent>
    </Card>
  )
}
