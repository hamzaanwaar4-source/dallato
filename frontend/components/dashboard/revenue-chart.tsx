"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartDataPoint } from "@/lib/types/dashboard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Skeleton } from "@/components/ui/skeleton"

interface RevenueChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export function   RevenueChart({ data, isLoading = false }: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState('this-month');

  if (isLoading) {
    return (
      <Card className="">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] sm:h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Normalize data to have consistent structure
  const normalizedData = data.map(item => {
    // Check for revenue property even if not in type definition
    const itemAny = item as any;
    const value = item.value !== undefined ? item.value : (itemAny.revenue !== undefined ? Number(itemAny.revenue) : 0);
    
    return {
      name: item.name || (item.date ? new Date(item.date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''),
      value: value,
      date: item.date
    };
  });

  const filteredData = normalizedData.filter(item => {
    // If the date is just a label (like "Jan 1") or missing, show it
    if (!item.date || (item.date as string).length < 10) return true;
    
    const itemDate = new Date(item.date as string);
    if (isNaN(itemDate.getTime())) return true;

    const now = new Date();
    
    switch (timeRange) {
      case 'this-month':
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
      case 'last-3-months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return itemDate >= threeMonthsAgo && itemDate <= now;
      default:
        return true;
    }
  });

  // If filtering results in no data, show all data instead
  let displayData = filteredData.length > 0 ? filteredData : normalizedData;
  
  // If we have only 1 data point, add padding points to show context
  if (displayData.length === 1) {
    const singlePoint = displayData[0];
    const pointDate = new Date(singlePoint.date as string);
    
    // Create points before and after with the same value for better visualization
    const beforeDate = new Date(pointDate);
    beforeDate.setDate(beforeDate.getDate() - 3);
    
    const afterDate = new Date(pointDate);
    afterDate.setDate(afterDate.getDate() + 3);
    
    displayData = [
      {
        name: beforeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: singlePoint.value,
        date: beforeDate.toISOString().split('T')[0]
      },
      singlePoint,
      {
        name: afterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: singlePoint.value,
        date: afterDate.toISOString().split('T')[0]
      }
    ];
  }
  
  // If still no data, generate placeholder data
  if (displayData.length === 0) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    
    displayData = Array.from({ length: Math.min(currentDay, 7) }, (_, i) => {
      const day = currentDay - (Math.min(currentDay, 7) - 1) + i;
      const date = new Date(currentYear, currentMonth, day);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 0,
        date: date.toISOString().split('T')[0]
      };
    });
  }

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'this-month': return 'This Month';
      case 'last-month': return 'Last Month';
      case 'last-3-months': return 'Last 3 Months';
      default: return 'This Month';
    }
  };

  return (
    <Card className="">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">Revenue Overview</CardTitle>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-white h-8 px-3 text-xs font-medium rounded-lg focus-visible:ring-0 focus:ring-0 focus:outline-none">
              {getTimeRangeLabel()}<ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTimeRange('this-month')}>
              This Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('last-month')}>
              Last Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange('last-3-months')}>
              Last 3 Months
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </CardHeader>
      <CardContent>
        <div className="h-[200px] sm:h-[250px] w-full" >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f0" strokeWidth={2} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value;
                    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
                    return (
                      <div className="bg-slate-800 text-white text-xs rounded-lg py-1 px-2 shadow-xl">
                        <p className="font-bold">${formattedValue}</p>
                        <p className="text-slate-300 text-[10px]">{payload[0].payload.date}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 3 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}