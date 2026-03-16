"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeatMapDataPoint } from "@/lib/types/dashboard"
import { Map as MapIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"
import { fetchHeatMapData } from "@/lib/api/dashboard.api"

// Dynamically import the map component to avoid SSR issues with Leaflet
const SatelliteMap = dynamic(() => import("./satellite-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full bg-slate-800" />
})

import { MonthYearSelector } from "@/components/ui/month-year-selector"

interface BookingsHeatMapProps {
  data?: HeatMapDataPoint[];
  isLoading?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function BookingsHeatMap({ data: initialData, isLoading: initialLoading = false }: BookingsHeatMapProps) {
  const now = new Date()

  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth())
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear())
  const [heatMapData, setHeatMapData] = React.useState<HeatMapDataPoint[]>(initialData || [])
  const [isLoading, setIsLoading] = React.useState(initialLoading)

  // Fetch data when month or year changes
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const monthName = MONTH_NAMES[selectedMonth]
        const data = await fetchHeatMapData(monthName, selectedYear)
        setHeatMapData(data)
      } catch (error) {
        console.error("Failed to fetch heat map data:", error)
        setHeatMapData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedMonth, selectedYear])

  if (isLoading) {
    return (
      <Card className="h-full bg-white border border-slate-200 text-slate-900 overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-slate-400" />
            <Skeleton className="h-6 w-48 bg-slate-100" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[350px] w-full bg-slate-50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white border border-slate-200 text-slate-900 overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        {/* Left */}
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-slate-400" />
          <CardTitle className="text-base font-bold">
            Global Booking Heat Map
          </CardTitle>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Demo Only
          </span>
        </div>

        {/* Right – Month Filter */}
        <MonthYearSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelect={(month, year) => {
            setSelectedMonth(month)
            setSelectedYear(year)
          }}
        />
      </CardHeader>
      <CardContent className="p-0 relative">
        <div className="h-[350px] w-full">
          <SatelliteMap data={heatMapData} />
        </div>
      </CardContent>
    </Card>
  )
}

