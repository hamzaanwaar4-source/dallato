
"use client"

import { Plus, Sparkles, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DayItem } from "@/lib/types/itinerary"

interface ItineraryListProps {
  days: DayItem[]
  selectedDayId: number
  onSelectDay: (dayId: number) => void
}

export function ItineraryList({ days, selectedDayId, onSelectDay }: ItineraryListProps) {
  return (
    <div className="flex flex-col h-fit max-h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Trip Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-bold text-lg text-gray-900">Itinerary</h2>
        <p className="text-sm text-gray-500 mt-1">Paris, France</p>
        <p className="text-xs text-gray-400 mt-0.5">Dec 15-25, 2024 • 2 travelers</p>
      </div>

      {/* Days List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2  pb-30">
        {days.map((day, index) => (
          <div 
            key={day.day}
            onClick={() => onSelectDay(day.day)}
            className={cn(
              "p-3 rounded-xl border transition-all cursor-pointer relative group",
              selectedDayId === day.day
                ? "bg-blue-50/50 border-[var(--primary-skyblue)] shadow-sm" 
                : "bg-gray-50/50 border-transparent hover:bg-gray-100"
            )}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Day {day.day}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{day.date}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{day.activitiesCount} activities</p>
              </div>
              {day.hasWarning && (
                <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
              )}
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full h-10 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 text-sm">
          <Plus className="h-3.5 w-3.5 mr-2" /> Add Day
        </Button>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 space-y-2 border-t border-gray-100">
        <Button className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md text-sm">
          <Sparkles className="h-3.5 w-3.5 mr-2" /> AI Auto-Build
        </Button>
        <Button variant="outline" className="w-full h-9 border-gray-200 text-gray-700 hover:bg-gray-50 text-sm">
          <Download className="h-3.5 w-3.5 mr-2" /> Export PDF
        </Button>
      </div>
    </div>
  )
}
