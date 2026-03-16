"use client"

import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MonthYearSelectorProps {
  selectedMonth: number // 0-11
  selectedYear: number
  onSelect: (month: number, year: number) => void
  className?: string
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function MonthYearSelector({
  selectedMonth,
  selectedYear,
  onSelect,
  className,
}: MonthYearSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(selectedYear)

  const handleYearChange = (e: React.MouseEvent, offset: number) => {
    e.preventDefault()
    e.stopPropagation()
    setViewYear((prev) => prev + offset)
  }

  const handleMonthSelect = (monthIdx: number) => {
    onSelect(monthIdx, viewYear)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-3 justify-start text-left font-normal bg-white border-cyan-200 hover:bg-cyan-50 transition-colors rounded-lg shadow-sm",
            className
          )}
        >
          <Calendar className="mr-1.5 h-3.5 w-3.5 text-cyan-600" />
          <span className="text-xs font-medium text-slate-700">
            {months[selectedMonth]} {selectedYear}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2.5 bg-white border border-slate-200 shadow-lg rounded-lg z-[1001]" align="end">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
            onClick={(e) => handleYearChange(e, -1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-semibold text-slate-700">
            {viewYear}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
            onClick={(e) => handleYearChange(e, 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {months.map((month, idx) => {
            const isSelected = idx === selectedMonth && viewYear === selectedYear
            return (
              <Button
                key={month}
                variant="ghost"
                className={cn(
                  "h-7 text-[10px] font-medium transition-all rounded-md",
                  isSelected
                    ? "bg-cyan-500 text-white hover:bg-cyan-600 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                onClick={() => handleMonthSelect(idx)}
              >
                {month.slice(0, 3)}
              </Button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}