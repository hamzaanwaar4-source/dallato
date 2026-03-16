"use client"
import React from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { getPerformanceLeaderboard } from '@/lib/api/analytics.api'
import { AgentPerformance } from '@/lib/types/analytics'
import { toast } from 'sonner'
import { Clock } from "lucide-react"

export function LeaderboardCard() {
  const [data, setData] = React.useState<AgentPerformance[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [month, setMonth] = React.useState<'this_month' | 'last_month'>('this_month');
  const cache = React.useRef<Record<string, AgentPerformance[]>>({});

  React.useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      // Check cache first
      if (cache.current[month]) {
        setData(cache.current[month]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getPerformanceLeaderboard(month);
        if (!ignore) {
          setData(response.agents);
          // Update cache
          cache.current[month] = response.agents;
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch leaderboard data:", error);
          toast.error("Failed to load leaderboard");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [month]);

  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => parseFloat(d.total_revenue))) : 0;

  return (
    <Card className="border border-[#F1F5F9] shadow-sm rounded-3xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">Agent Performance Leaderboard</h3>
          <p className="text-[#64748B] text-[13px]">Total Revenue by agent</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-[#F8F9FA] border-[#E2E8F0] text-[#0F172A] text-[13px] font-medium rounded-xl h-9">
              {month === 'this_month' ? 'This Month' : 'Last Month'} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setMonth('this_month')}>This Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMonth('last_month')}>Last Month</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-6 h-full flex flex-col justify-center">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))
        ) : data.length > 0 ? (
          data.map((agent, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#0EA5E9] font-bold">#</span>
                  <span className="text-[#0F172A] font-bold text-[14px]">{agent.agent_name}</span>
                </div>
                <span className="text-[#0F172A] font-bold text-[14px]">${parseFloat(agent.total_revenue).toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#0EA5E9] to-[#8B5CF6]"
                  style={{ width: `${(parseFloat(agent.total_revenue) / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[#64748B]">
            <Clock className="h-8 w-8 mb-2 opacity-20 text-center mx-auto" />
            No data available
            </div>
        )}
      </div>
    </Card>
  )
}
