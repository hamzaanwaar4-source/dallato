import { StatsCards } from "@/components/dashboard/stats-cards"
import { DeparturesBanner } from "@/components/dashboard/departures-banner"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { TopPerformers } from "@/components/dashboard/top-performers"
import { ChartDataPoint, DashboardData, StatItem, mapActivityLogsToItems } from "@/lib/types/dashboard"

interface AgencyDashboardViewProps {
  data: DashboardData;
  stats?: StatItem[];
  revenueData?: ChartDataPoint[];
  isLoadingStats?: boolean;
  isLoadingRevenue?: boolean;
  isLoadingDepartures?: boolean;
  isLoadingActivity?: boolean;
  isLoadingPerformers?: boolean;
}

export function AgencyDashboardView({ 
  data, 
  stats,
  revenueData = [],
  isLoadingStats = false,
  isLoadingRevenue = false,
  isLoadingDepartures = false,
  isLoadingActivity = false,
  isLoadingPerformers = false
}: AgencyDashboardViewProps) {
  return (
    <div className="space-y-8 pb-8">
      {/* 1. Top Stats Row */}
      <StatsCards stats={stats || data.stats} isLoading={isLoadingStats} />
      
      {/* 2. Middle & Bottom Section: Charts, Activity & Departures */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2/3): Revenue & Departures */}
        <div className="xl:col-span-2 space-y-6">
          <RevenueChart data={revenueData.length > 0 ? revenueData : data.revenueData} isLoading={isLoadingRevenue} />
          <DeparturesBanner departures={data.departures} showDetails={true} isLoading={isLoadingDepartures} />
        </div>

        {/* Right Column (1/3): Top Performers & Activity */}
        <div className="xl:col-span-1 space-y-6">
          <TopPerformers performers={data.topPerformers} isLoading={isLoadingPerformers} />
          <RecentActivity
            activities={mapActivityLogsToItems(data.activityLogs)}
            isLoading={isLoadingActivity}
          />

        </div>
      </div>
    </div>
  );
}
