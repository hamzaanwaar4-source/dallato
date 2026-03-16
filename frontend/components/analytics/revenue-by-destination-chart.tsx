"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { ExternalLink, User } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar, 
  Cell
} from 'recharts'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { getRevenueByDestination, getAgentsList } from '@/lib/api/analytics.api'
import { DestinationRevenue, AgentListItem } from '@/lib/types/analytics'
import { toast } from 'sonner'
import { Clock } from "lucide-react"

export function RevenueByDestinationChart() {
  const [data, setData] = useState<DestinationRevenue[]>([]);
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);
  
  // Caching mechanism
  const [cache, setCache] = useState<Record<string, DestinationRevenue[]>>({});

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsList = await getAgentsList();
        setAgents(agentsList);
        if (agentsList.length > 0) {
          setSelectedAgentId(agentsList[0].id.toString());
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
        toast.error("Failed to load agents list");
      } finally {
        setIsAgentsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;

    const fetchData = async () => {
      // Check cache first
      if (cache[selectedAgentId]) {
        setData(cache[selectedAgentId]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getRevenueByDestination(selectedAgentId);
        setData(response);
        // Update cache
        setCache(prev => ({ ...prev, [selectedAgentId]: response }));
      } catch (error) {
        console.error("Failed to fetch revenue by destination:", error);
        toast.error("Failed to load revenue by destination");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedAgentId, cache]);

  const colors = ['#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444'];
  
  const chartData = useMemo(() => data.map((item, index) => ({
    name: item.destination,
    value: item.revenue,
    color: colors[index % colors.length]
  })), [data]);

  const totalRevenue = useMemo(() => chartData.reduce((acc, curr) => acc + curr.value, 0), [chartData]);
  const totalBookings = useMemo(() => data.reduce((acc, curr) => acc + curr.bookings_count, 0), [data]);

  const selectedAgentName = useMemo(() => {
    if (agents.length === 0) return "Select Agent";
    return agents.find(a => a.id.toString() === selectedAgentId)?.name || "Select Agent";
  }, [agents, selectedAgentId]);

  // Custom shape to render the radial bar as 4 distinct segments
  const renderCustomRadialBar = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    const segmentWidth = 20; // degrees
    const angles = [90, 270, 180, 0]; // Top, Bottom, Left, Right
    
    return (
      <g>
        {angles.map((centerAngle, i) => {
          const sAngle = centerAngle - segmentWidth / 2;
          const eAngle = centerAngle + segmentWidth / 2;
          
          const sectorPath = (inner: number, outer: number, s: number, e: number) => {
            const rad = Math.PI / 180;
            const x1 = cx + inner * Math.cos(-s * rad);
            const y1 = cy + inner * Math.sin(-s * rad);
            const x2 = cx + inner * Math.cos(-e * rad);
            const y2 = cy + inner * Math.sin(-e * rad);
            const x3 = cx + outer * Math.cos(-e * rad);
            const y3 = cy + outer * Math.sin(-e * rad);
            const x4 = cx + outer * Math.cos(-s * rad);
            const y4 = cy + outer * Math.sin(-s * rad);
            
            return `M ${x1} ${y1} A ${inner} ${inner} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${outer} ${outer} 0 0 0 ${x4} ${y4} Z`;
          };

          return (
            <path
              key={i}
              d={sectorPath(innerRadius, outerRadius, sAngle, eAngle)}
              fill={fill}
              stroke="none"
            />
          );
        })}
      </g>
    );
  };

  return (
    <Card className="border border-[#F1F5F9] shadow-sm rounded-[24px] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-[18px] font-bold text-[#0F172A]">Revenue by Destination</h3>
          <p className="text-[#64748B] text-[13px]">Top performing destinations sss</p>
        </div>
        <div className="flex items-center gap-3">
          {isAgentsLoading ? (
            <Skeleton className="h-10 w-[180px] rounded-xl" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[180px] bg-white border-[#F1F5F9] rounded-xl h-10 text-[14px] justify-between px-4 font-normal">
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-4 h-4 text-[#64748B] shrink-0" />
                    <span className="truncate">{selectedAgentName}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px] rounded-xl border-[#F1F5F9] bg-white z-[1001]">
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <DropdownMenuItem 
                      key={agent.id} 
                      onClick={() => setSelectedAgentId(agent.id.toString())}
                      className="text-[14px] cursor-pointer"
                    >
                      {agent.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem className="text-[14px] text-[#64748B] cursor-default">
                    No Agent to show
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-[#0EA5E9]" />
          </div> */}
        </div>
      </div>

      <div className="min-h-[220px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-8 w-full">
            <div className="w-1/2 h-[220px] flex items-center justify-center">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
            <div className="w-1/2 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : data.length > 0 ? (
          <div className="flex items-center gap-8 w-full">
            <div className="w-1/2 h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="30%" 
                  outerRadius="100%" 
                  barSize={10} 
                  data={chartData}
                  startAngle={90}
                  endAngle={450}
                >
                  <RadialBar
                    dataKey="value"
                    shape={renderCustomRadialBar}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RadialBar>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-[15px] font-bold text-[#0F172A]">${totalRevenue.toLocaleString()}</p>
                <p className="text-[#64748B] text-[10px]">{totalBookings} Bookings</p>
              </div>
            </div>

            <div className="w-1/2 space-y-4">
              {data.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="text-[#0F172A] text-[14px] font-medium truncate">{item.destination}</span>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <span className="text-[#0F172A] text-[14px] font-semibold">${item.revenue.toLocaleString()}</span>
                    <span className="text-[#64748B] text-[11px]">{item.bookings_count} booking{item.bookings_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-[#64748B] w-full">
            <Clock className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-[15px] font-medium">No data available</p>
          </div>
        )}
      </div>
    </Card>
  )
}
