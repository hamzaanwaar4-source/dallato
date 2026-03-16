"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DayItem } from "@/lib/types/itinerary"

interface ItineraryDetailProps {
  day: DayItem
}

export function ItineraryDetail({ day }: ItineraryDetailProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Badge className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)] text-white px-3 py-1 text-sm rounded-md shrink-0">Day {day.day}</Badge>
          <div className="flex items-center gap-3 text-sm text-gray-500 overflow-hidden">
            <span className="truncate">{day.activitiesCount} activities</span>
            <span className="h-1 w-1 rounded-full bg-gray-300 shrink-0" />
            <span className="truncate">$725 total</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-[var(--primary-skyblue)] border-blue-200 hover:bg-blue-50 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1" /> Add Activity
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-[16px] md:left-[24px] top-4 bottom-10 w-[2px] bg-gray-100" />

          <div className="space-y-6 md:space-y-8">
            {day.activities.map((activity, index) => (
              <div key={index} className="relative pl-12 md:pl-16">
                {/* Time Marker */}
                <div className={cn(
                  "absolute left-0 top-0 h-8 w-8 md:h-12 md:w-12 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-sm z-10",
                  activity.color
                )}>
                  {activity.time}
                </div>

                {/* Activity Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-base md:text-lg">{activity.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{activity.location}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{activity.description}</p>

                  {activity.infoBox && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span className="text-xs font-medium text-gray-700">{activity.infoBox}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span className="font-bold text-gray-900">{activity.price}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
