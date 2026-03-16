"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartDataPoint } from "@/lib/types/dashboard"
import { SuperAdminAgency } from "@/lib/api/dashboard.api"
import { Clock, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AgencySelector } from "@/components/dashboard/agency-selector"

interface DestinationsChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
  headerAction?: React.ReactNode;
  agencies?: SuperAdminAgency[];
  selectedAgencyId?: string;
  onAgencyChange?: (agencyId: string) => void;
}

export function DestinationsChart({
  data,
  isLoading = false,
  headerAction,
  agencies,
  selectedAgencyId,
  onAgencyChange,
}: DestinationsChartProps) {
  const COLORS = [
    "#0ea5e9", // Sky 500
    "#38bdf8", // Sky 400
    "#7dd3fc", // Sky 300
    "#bae6fd", // Sky 200
    "#f3f4f6", // Gray 100
  ];

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-6 w-32" />
          {agencies && onAgencyChange && (
            <Skeleton className="h-8 w-[180px]" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 pt-6">
            <Skeleton className="h-[160px] w-[160px] rounded-full shrink-0" />
            <div className="flex-1 w-full sm:w-auto space-y-3 sm:pl-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="w-2.5 h-2.5 rounded-sm mt-1 shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-[400px] flex flex-col">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between pb-2">
          <CardTitle className="text-base font-bold">Top Destinations</CardTitle>
          {agencies && onAgencyChange && (
            <AgencySelector
              agencies={agencies}
              selectedAgencyId={selectedAgencyId}
              onSelect={onAgencyChange}
            />
          )}
        </CardHeader>
        <CardContent className="flex flex-col align-center justify-center h-full">
          <div className="text-sm text-gray-500 text-center py-15">
            <Clock className="h-8 w-8 mb-2 opacity-20 text-center mx-auto" />
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayData = data.slice(0, 5).map((item, index) => ({
    ...item,
    color: COLORS[index] || COLORS[COLORS.length - 1]
  }));

  return (
    <Card className="h-[400px]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-bold">Top Destinations</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {agencies && onAgencyChange && (
            <AgencySelector
              agencies={agencies}
              selectedAgencyId={selectedAgencyId}
              onSelect={onAgencyChange}
            />
          )}
          {headerAction}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 pt-6">
          <div className="h-[180px] w-full sm:w-[160px] shrink-0 relative flex justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={160}>
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 w-full sm:w-auto space-y-3 sm:pl-4">
            {displayData.map((item, index) => (
              <div key={index} className="flex items-start gap-2 justify-center sm:justify-start">
                <div
                  className="w-2.5 h-2.5 rounded-sm mt-1 shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-none">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 text-center sm:text-left">
                    {item.value} Booked Trips
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}