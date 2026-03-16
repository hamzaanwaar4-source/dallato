"use client"

import React from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/analytics/agent-analytics-stat-card'
import { LeaderboardCard } from '@/components/analytics/leaderboard-card'
import { ConversionRateCard } from '@/components/analytics/conversion-rate-card'
import { QuotesGeneratedChart } from '@/components/analytics/quotes-generated-chart'
import { RevenueByDestinationChart } from '@/components/analytics/revenue-by-destination-chart'
import { SupplierUsageTable } from '@/components/analytics/supplier-usage-table'
// import { ANALYTICS_MOCK_DATA } from '@/lib/mocks/analytics.mock'
import { getAnalyticsStats } from '@/lib/api/analytics.api'
import { AnalyticsStatsResponse } from '@/lib/types/analytics'
import { toast } from 'sonner'

export default function AgentAnalyticsPage() {
  // const data = ANALYTICS_MOCK_DATA;
  const [stats, setStats] = React.useState<AnalyticsStatsResponse | null>(null);
  const [isStatsLoading, setIsStatsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getAnalyticsStats();
        setStats(statsData);
      } catch (error) {
        // console.error("Failed to fetch analytics stats:", error);
        toast.error("Failed to load analytics stats");
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-8 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[#64748B] text-[14px]">
            Comprehensive performance metrics and insights across all agents
          </p>
        </div>
        {/* <Button className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white rounded-xl px-6 h-11 font-bold text-[14px] flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button> */}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Avg Revenue Per Agent" 
          value={stats ? `$${parseFloat(stats.avg_revenue_per_agent).toLocaleString()}` : undefined}
          isLoading={isStatsLoading}
        />
        <StatCard 
          label="Avg Clients Per Agent" 
          value={stats ? stats.avg_clients_per_agent : undefined}
          isLoading={isStatsLoading}
        />
        <StatCard 
          label="Total Bookings" 
          value={stats ? stats.total_bookings : undefined}
          isLoading={isStatsLoading}
        />
      </div>

      {/* Leaderboard and Conversion Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardCard />
        <ConversionRateCard />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuotesGeneratedChart />
        <RevenueByDestinationChart />
      </div>

      {/* Supplier Usage Table */}
      <SupplierUsageTable />
    </div>
  )
}
