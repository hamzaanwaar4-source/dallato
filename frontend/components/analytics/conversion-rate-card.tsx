"use client"

import React from 'react'
import { TrendingUp } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getConversionRates } from '@/lib/api/analytics.api'
import { AgentConversionRate } from '@/lib/types/analytics'
import { toast } from 'sonner'
import { Clock } from "lucide-react"

export function ConversionRateCard() {
  const [data, setData] = React.useState<AgentConversionRate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getConversionRates();
        setData(response);
      } catch (error) {
        console.error("Failed to fetch conversion rates:", error);
        toast.error("Failed to load conversion rates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const colors = ['#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444'];

  const topAgent = data.length > 0 
    ? data.reduce((max, current) => current.conversion_rate > max.conversion_rate ? current : max, data[0])
    : null;

  return (
    <Card className="border border-[#F1F5F9] shadow-sm rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">Conversion Rate by Agent</h3>
          <p className="text-[#64748B] text-[13px]">Quote to booking conversion</p>
        </div>
        <TrendingUp className="text-[#10B981] w-5 h-5" />
      </div>

      <div className="space-y-4 mb-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="flex-1 h-8 rounded-lg" />
            </div>
          ))
        ) : data.length > 0 ? (
          data.map((agent, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-[#0F172A] font-bold text-[13px] w-20 truncate">{agent.agent_name}</span>
              <div className="flex-1 h-8 bg-[#F8F9FA] rounded-lg relative overflow-hidden">
                <div 
                  className="h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-500" 
                  style={{ 
                    width: `${agent.conversion_rate}%`, 
                    backgroundColor: colors[index % colors.length] 
                  }}
                >
                  <span className="text-white text-[11px] font-bold">{agent.conversion_rate}%</span>
                </div>
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

      <div className="bg-[#F0FDF4] rounded-xl p-4 flex items-center gap-3">
        <span className="text-[#10B981] font-bold text-[13px] whitespace-nowrap">Top Insight:</span>
        <p className="text-[#64748B] text-[13px]">
          {topAgent 
            ? `${topAgent.agent_name} has the highest conversion rate at ${topAgent.conversion_rate}%.`
            : "You will see the top insights here..."}
        </p>
      </div>
    </Card>
  )
}
