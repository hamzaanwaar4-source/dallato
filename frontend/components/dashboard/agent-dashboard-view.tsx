import { StatsCards } from "@/components/dashboard/stats-cards";
import { DeparturesBanner } from "@/components/dashboard/departures-banner";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { DestinationsChart } from "@/components/dashboard/destinations-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TodoList } from "@/components/dashboard/todo-list";
import { ApprovedQuotes } from "@/components/dashboard/quotes-pending";
import { TravelSuggestions } from "@/components/dashboard/travel-suggestions";
import { BookingsHeatMap } from "@/components/dashboard/bookings-heat-map";
import { SalesPipeline } from "@/components/dashboard/sales-pipeline";
import {
  DashboardData,
  StatItem,
  ChartDataPoint,
  ActivityItem,
} from "@/lib/types/dashboard";
import { ApprovedQuote } from "@/lib/types/quotes";
import { RevenueOverview } from "./revenue-overview";
import { AgentRevenueOverview, SalesPipelineStat } from "@/lib/api";

interface AgentDashboardViewProps {
  data: DashboardData;
  approvedQuotes?: ApprovedQuote[];
  topDestinations?: ChartDataPoint[];
  stats?: StatItem[];
  revenueData?: ChartDataPoint[];
  heatMapData?: any[];
  isLoadingStats?: boolean;
  isLoadingRevenue?: boolean;
  isLoadingDestinations?: boolean;
  isLoadingHeatMap?: boolean;
  isLoadingQuotes?: boolean;
  isLoadingActivity?: boolean;
  isLoadingTodos?: boolean;
  isLoadingSuggestions?: boolean;
  isLoadingDepartures?: boolean;
  revenueOverview?: AgentRevenueOverview;
  isLoadingRevenueOverview?: boolean;
  salesPipeline?: SalesPipelineStat[];
  isLoadingSalesPipeline?: boolean;
  recentActivity?: ActivityItem[];

  // isLoadingActivity?: boolean;
}

export function AgentDashboardView({
  data,
  approvedQuotes = [],
  topDestinations = [],
  stats = [],
  revenueData = [],
  heatMapData = [],
  isLoadingStats = false,
  isLoadingRevenue = false,
  isLoadingDestinations = false,
  isLoadingHeatMap = false,
  isLoadingQuotes = false,
  isLoadingActivity = false,
  isLoadingTodos = false,
  isLoadingSuggestions = false,
  isLoadingDepartures = false,
  revenueOverview,
  isLoadingRevenueOverview = false,
  salesPipeline,
  isLoadingSalesPipeline = false,
  recentActivity = [], // ADD THIS
}: AgentDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* 1. Top Stats Row */}
      <StatsCards
        stats={stats.length > 0 ? stats : data.stats}
        isLoading={isLoadingStats}
      />

      {/* 2. Upcoming Departures Banner */}
      <DeparturesBanner
        departures={data.departures}
        showDetails={false}
        isLoading={isLoadingDepartures}
      />

      {/* 3. Middle Section: Charts & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2/3): Charts & Todo */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Heat Map Row */}
          <div className="m-0">
            <BookingsHeatMap
              data={heatMapData.length > 0 ? heatMapData : data.heatMapData}
              isLoading={isLoadingHeatMap}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="m-0 h-full min-h-[380px]">
              {/* <RevenueChart
                data={revenueData.length > 0 ? revenueData : data.revenueData}
                isLoading={isLoadingRevenue}
              /> */}
              <RevenueOverview
                data={revenueOverview}
                isLoading={isLoadingRevenueOverview}
              />
            </div>
            <div className="m-0 h-full min-h-[380px]">
              <SalesPipeline
                data={salesPipeline}
                isLoading={isLoadingSalesPipeline}
              />
            </div>
          </div>

          {/* To-Do List */}
          <div className="m-0">
            <TodoList todos={data.todos} isLoading={isLoadingTodos} />
          </div>

          {/* Approved Quotes */}
          <div className="m-0">
            <ApprovedQuotes
              quotes={approvedQuotes}
              isLoading={isLoadingQuotes}
            />
          </div>
        </div>

        {/* Right Column (1/3): Sidebar Widgets */}
        <div className="xl:col-span-1 space-y-6">
          {(data.travelSuggestions || isLoadingSuggestions) && (
            <TravelSuggestions
              suggestions={data.travelSuggestions || []}
              isLoading={isLoadingSuggestions}
            />
          )}
          <RecentActivity
            activities={recentActivity || []}
            isLoading={isLoadingActivity}
          />
        </div>
      </div>
    </div>
  );
}
