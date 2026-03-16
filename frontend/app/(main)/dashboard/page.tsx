"use client";

import { useEffect, useState } from "react";
import {
  getDashboardData,
  fetchPendingQuotes,
  fetchTravelSuggestions,
  fetchUpcomingDepartures,
  fetchTodoList,
  getApprovedQuotes,
  fetchTopDestinations,
  fetchAgentDashboardStats,
  fetchAgencyDashboardStats,
  fetchRevenueOverview,
  fetchAgencyWideRevenueOverview,
  fetchHeatMapData,
  fetchAgentRevenueOverview,
  AgentRevenueOverview,
  fetchSalesPipeline,
  SalesPipelineStat,
  fetchRecentActivity,
  ApprovedQuote,
  fetchManagedBookings,
  fetchAgencyUpcomingDepartures,
  fetchAgencyAdminDashboardStats,
  fetchAgencyRecentActivity,
} from "@/lib/api/dashboard.api";
import { clientsApi } from "@/lib/api/clients.api";
import { authStore } from "@/lib/auth-store";
import dynamic from "next/dynamic";

const AgentDashboardView = dynamic(() =>
  import("@/components/dashboard/agent-dashboard-view").then(
    (mod) => mod.AgentDashboardView,
  ),
);
const AgencyDashboardView = dynamic(() =>
  import("@/components/dashboard/agency-dashboard-view").then(
    (mod) => mod.AgencyDashboardView,
  ),
);
const SuperAdminDashboardView = dynamic(() =>
  import("@/components/dashboard/super-admin-dashboard-view").then(
    (mod) => mod.SuperAdminDashboardView,
  ),
);
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ActivityItem, DashboardData } from "@/lib/types/dashboard";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [approvedQuotes, setApprovedQuotes] = useState<any[] | null>(null);
  const [topDestinations, setTopDestinations] = useState<any[] | null>(null);
  const [agentStats, setAgentStats] = useState<any[] | null>(null);
  const [revenueData, setRevenueData] = useState<any[] | null>(null);
  const [heatMapData, setHeatMapData] = useState<any[] | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[] | null>(
    null,
  );
  const [loadingRecentActivity, setLoadingRecentActivity] = useState(true);
  const [loadingApprovedQuotes, setLoadingApprovedQuotes] = useState(true);

  useEffect(() => {
    const user = authStore.getUser();
    const userRole = user?.role || "Agency Agent";
    // console.log("Dashboard - User role:", userRole);
    // console.log("Dashboard - User:", user);
    setRole(userRole);

    const fetchInitialData = async () => {
      try {
        const dashboardData = await getDashboardData(userRole);
        // Exclude mock revenue data - we'll fetch real data separately
        setData({ ...dashboardData, revenueData: [] });
      } catch (error) {
        console.error("Failed to fetch initial dashboard data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    const fetchIndependentData = async () => {
      // Skip API calls for Platform SuperAdmin - they have their own static dashboard
      if (userRole === "Platform SuperAdmin") {
        setLoadingRecentActivity(false);
        setLoadingApprovedQuotes(false);
        return;
      }

      // Fetch stats
      (userRole === "Agency Agent"
        ? fetchAgentDashboardStats()
        : fetchAgencyAdminDashboardStats()
      )
        .then(setAgentStats)
        .catch((err: any) => console.error("Stats fetch failed:", err));

      if (userRole === "Agency Agent") {
        fetchRecentActivity()
          .then(setRecentActivity)
          .catch((err) => console.error("Recent activity fetch failed", err))
          .finally(() => setLoadingRecentActivity(false));

        fetchTravelSuggestions().then((suggestions) =>
          setData((prev) =>
            prev ? { ...prev, travelSuggestions: suggestions } : null,
          ),
        );
        fetchUpcomingDepartures().then((departures) =>
          setData((prev) => (prev ? { ...prev, departures } : null)),
        );
        fetchTodoList().then((todos) =>
          setData((prev) => (prev ? { ...prev, todos } : null)),
        );
        fetchHeatMapData().then(setHeatMapData);
        fetchManagedBookings()
          .then(setApprovedQuotes)
          .catch((err) => console.error("Approved quotes fetch failed", err))
          .finally(() => setLoadingApprovedQuotes(false));
      } else {
        // Agency Admin specific fetches
        fetchAgencyWideRevenueOverview().then((revenue) => {

          setRevenueOverview(undefined); // Reset agent-specific overview
          setRevenueData(revenue);
        });
        fetchAgencyUpcomingDepartures().then((departures) =>
          setData((prev) => (prev ? { ...prev, departures } : null)),
        );
        fetchAgencyRecentActivity()
          .then((activityLogs) => {
            setData((prev) => (prev ? { ...prev, activityLogs } : null));
          })
          .catch((err) => console.error("Agency recent activity fetch failed", err))
          .finally(() => setLoadingRecentActivity(false));
      }
    };

    fetchInitialData();
    fetchIndependentData();
  }, []);

  const [revenueOverview, setRevenueOverview] = useState<
    AgentRevenueOverview | undefined
  >();

  const [loadingRevenueOverview, setLoadingRevenueOverview] = useState(true);
  useEffect(() => {
    if (!role || role !== "Agency Agent") {
      setLoadingRevenueOverview(false);
      return;
    }
    setLoadingRevenueOverview(true);
    fetchAgentRevenueOverview()
      .then((data) => {
 
        setRevenueOverview(data);
      })
      .catch((err) => {
        console.error("Revenue overview API failed", err);
      })
      .finally(() => {
        setLoadingRevenueOverview(false);
      });
  }, [role]);

  const [salesPipeline, setSalesPipeline] = useState<
    SalesPipelineStat[] | undefined
  >();

  const [loadingSalesPipeline, setLoadingSalesPipeline] = useState(true);
  useEffect(() => {
    if (!role || role !== "Agency Agent") {
      setLoadingSalesPipeline(false);
      return;
    }
    setLoadingSalesPipeline(true);
    fetchSalesPipeline()
      .then((data) => {

        setSalesPipeline(data); 
      })
      .catch((err) => {
        console.error("Sales pipeline fetch failed", err);
      })
      .finally(() => {
        setLoadingSalesPipeline(false);
      });
  }, [role]);

  if (isInitialLoading) {
    return (
      <div className="p-4 md:p-8">
        <DashboardSkeleton role={role || undefined} />
      </div>
    );
  }

  if (!data) {
    return <div>Error loading dashboard data.</div>;
  }

  if (role === "Platform SuperAdmin") {
    return <SuperAdminDashboardView />;
  }

  if (role === "Agency Admin") {
    return (
      <AgencyDashboardView
        data={data}
        stats={agentStats || []}
        revenueData={revenueData || []}
        isLoadingStats={agentStats === null}
        isLoadingRevenue={revenueData === null}
        isLoadingDepartures={data.departures === undefined}
        isLoadingActivity={loadingRecentActivity}
      />
    );
  }

  return (
    <AgentDashboardView
      data={data}
      approvedQuotes={approvedQuotes || []}
      topDestinations={topDestinations || []}
      stats={agentStats || []}
      revenueData={revenueData || []}
      heatMapData={heatMapData || []}
      isLoadingStats={agentStats === null}
      isLoadingRevenue={revenueData === null}
      isLoadingDestinations={topDestinations === null}
      isLoadingHeatMap={heatMapData === null}
      isLoadingTodos={data.todos === undefined}
      isLoadingSuggestions={data.travelSuggestions === undefined}
      isLoadingDepartures={data.departures === undefined}
      revenueOverview={revenueOverview}
      isLoadingRevenueOverview={loadingRevenueOverview}
      salesPipeline={salesPipeline}
      isLoadingSalesPipeline={loadingSalesPipeline}
      recentActivity={recentActivity || []}
      isLoadingActivity={loadingRecentActivity}
      isLoadingQuotes={loadingApprovedQuotes}
    />
  );
}
