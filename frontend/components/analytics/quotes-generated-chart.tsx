"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts'
import { getQuotesGenerated } from '@/lib/api/analytics.api'
import { AgentQuotesGenerated } from '@/lib/types/analytics'
import { toast } from 'sonner'
import { Clock } from "lucide-react"

export function QuotesGeneratedChart() {
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [data, setData] = useState<AgentQuotesGenerated[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const cache = useRef<Record<string, AgentQuotesGenerated[]>>({});

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      if (cache.current[view]) {
        setData(cache.current[view]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getQuotesGenerated(view);
        if (!ignore) {
          setData(response);
          cache.current[view] = response;
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch quotes generated data:", error);
          toast.error("Failed to load quotes generated data");
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
  }, [view]);

  const colors = ['#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <Card className="border border-[#F1F5F9] shadow-sm rounded-[24px] p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">Quotes Generated</h3>
          <p className="text-[#64748B] text-[13px]">Quote volume by agent</p>
        </div>
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg px-4 h-8 text-[12px] font-medium ${view === 'monthly' ? 'bg-[#0EA5E9] text-white shadow-sm hover:bg-[#0EA5E9] hover:text-white' : 'text-[#64748B]'}`}
            onClick={() => setView('monthly')}
          >
            Monthly
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-lg px-4 h-8 text-[12px] font-medium ${view === 'weekly' ? 'bg-[#0EA5E9] text-white shadow-sm hover:bg-[#0EA5E9] hover:text-white' : 'text-[#64748B]'}`}
            onClick={() => setView('weekly')}
          >
            Weekly
          </Button>
        </div>
      </div>

      <div className="h-[250px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-end gap-4 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="flex-1 rounded-t-lg" 
                style={{ height: `${Math.random() * 60 + 20}%` }} 
              />
            ))}
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="0" />
              <XAxis 
                dataKey="agent_name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#F8F9FA' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [value, 'Quotes']}
              />
              <Bar 
                dataKey="quotes_count" 
                radius={[6, 6, 0, 0]} 
                barSize={50}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#64748B]">
            <Clock className="h-8 w-8 mb-2 opacity-20 text-center mx-auto" />
            No data available
          </div>
        )}
      </div>
    </Card>
  )
}
