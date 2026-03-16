import apiClient, { simulateApiCall } from "./apiInterceptor";
import {
  DashboardData,
  UserDashboardStats,
  AgencyAnalyticsStats,
  PendingQuote,
  DepartureItem,
  UpcomingDeparturesData,
  TodoItem,
  TodoListResponse,
  TopDestinationsResponse,
  ChartDataPoint,
  AgentDashboardStats,
  StatItem,
  HeatMapDataPoint,
  TopPerformerItem,
  ActivityLog,
  SystemHealthData,
} from "@/lib/types/dashboard";
// import { MOCK_DATA, AGENCY_MOCK_DATA } from "@/lib/mocks/dashboard.mock";
import { getApprovedQuotes } from "./quotes.api";

export interface UpcomingDeparture {
  id: number;
  client_name: string;
  client_id: number;
  agent_name: string;
  agent_id: number;
  destination: string;
  origin: string;
  carrier: string;
  ticket_number: string;
  travel_date: string;
  departure_time: string;
  return_date: string;
  urgency: string;
  days_until: number;
  is_urgent: boolean;
}

export interface AgentRevenueOverview {
  monthly_revenue: string;
  revenue_change_percent: string;
  avg_quote_value: string;
  avg_quote_change_percent: string;
  pending_value: string;
  pending_change_percent: string;
}

export interface UpcomingDeparturesResponse {
  total: number;
  urgent_count: number;
  upcoming_departures: UpcomingDeparture[];
}

export interface RevenueOverviewResponse {
  date_labels: string[];
  revenue_values: number[];
}

export interface AgencyWideRevenueResponse {
  date: string;
  revenue: string;
}

export interface MapLocation {
  lat: number;
  lon: number;
  city: string;
  country: string;
  country_code: string;
  formatted: string;
  booking_count: number;
  total_value: number;
  statuses: Record<string, number>;
  sample_trips: Array<{
    id: number;
    title: string;
    status: string;
    start_date: string;
    client_name: string;
  }>;
}

export interface HeatMapResponse {
  locations: MapLocation[];
  total_bookings: number;
  total_locations: number;
  total_value: number;
}

export interface AgencyDashboardStatsResponse {
  total_bookings: number;
  bookings_growth: number;
  clients_contacted: number;
  clients_growth: number;
  quote_conversion: number;
  conversion_growth: number;
  total_revenue: number;
  revenue_growth: number;
  currency: string;
}
export interface AgencyAdminStatsResponse {
  total_agents: number;
  total_bookings: number;
  total_quotes: number;
  conversion_rate: string;
  total_revenue: string;
}
export interface SalesPipelineStat {
  status: string;
  count: number;
  percentage: string;
}
export interface RecentActivityApiItem {
  activity_type: string;
  message: string;
  client_name: string;
  timestamp: string;
  related_id: number;
}
interface ActivityItem {
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}

export interface SalesPipelineResponse {
  quote_status_stats: SalesPipelineStat[];
}

export interface SuperAdminAgency {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface SuperAdminAgencyRevenue {
  current_month_revenue: number;
  revenue_change_percent: number;
  total_revenue: number;
  avg_quote_value: number;
  pending_value: number;
  total_quotes: number;
}

export interface SuperAdminTopDestination {
  destination: string;
  bookings: number;
  revenue: number;
}

export interface SuperAdminDashboardStats {
  total_agencies: number;
  active_agencies: number;
  total_agents: number;
  total_revenue: number;
}

interface ManagedBookingApiItem {
  client_id: number;
  client_name: string;
  quote_id: number;
  quote_number: string;
  destination: string;
  price: string;
  status: string;
  created_at: string;
}
export interface ApprovedQuote {
  id: number;
  clientName: string;
  destination: string;
  price: string;
  status: string;
  quoteId: string;
  date: string;
}

export const fetchUserDashboardStats =
  async (): Promise<UserDashboardStats> => {
    const response = await apiClient.get("/agency/user-dashboard-stats/");
    return response.data;
  };

export const fetchAgencyAnalytics = async (): Promise<AgencyAnalyticsStats> => {
  const response = await apiClient.get("/agency/analytics/");
  return response.data;
};

export const fetchTravelSuggestions = async (): Promise<any> => {
  const response = await apiClient.get("/destination-suggestions/");
  return response.data.months;
};

export const fetchPendingQuotes = async (): Promise<PendingQuote[]> => {
  const response = await apiClient.get("/agency/quotes-pending/");
  return response.data.pending_quotes;
};

export const fetchUpcomingDepartures =
  async (): Promise<UpcomingDeparturesData> => {
    const response = await apiClient.get(
      "/agent/dashboard/upcoming-departures/",
    );

    const data = response.data;

    return {
      total: data.total_departures,
      urgent_count: data.urgent_departures,
      items: data.departures.map((dep: any) => ({
        id: dep.client_id.toString(),
        name: dep.client_name,
        location: `${dep.from_airport || "—"} → ${dep.destination}`,
        departureDate: dep.departure_date,
        returnDate: dep.return_date,
        flight: dep.trip_title,
        time: dep.departure_time ?? "—",
        bookingRef: dep.trip_title,
        tag: "UPCOMING",
        tagType: data.urgent_departures > 0 ? "urgent" : "info",
        urgentLevel: data.urgent_departures > 0 ? "high" : "low",
        statusLabel: dep.days_until_departure,
        quoteId: dep.quote_id?.toString(),
        tripId: dep.trip_id?.toString(),
      })),
    };
  };


export const fetchTodoList = async (): Promise<TodoItem[]> => {
  const response = await apiClient.get("/agent/todo-list/");

  return response.data.map((item: any) => {
    const urgent = item.days_pending >= 1;

    let tagColor = "bg-blue-100 text-blue-700";

    if (item.status === "QUOTE_SENT") {
      tagColor = "bg-amber-100 text-amber-700";
    } else if (item.status === "CONFIRMED") {
      tagColor = "bg-emerald-100 text-emerald-700";
    }

    return {
      id: item.quote_id,
      client: item.client_name,
      task: item.trip_title,
      tag: item.status.replace("_", " "),
      tagColor,
      nextAction: "Follow up with client",
      time: item.days_pending === 0 ? "Today" : `${item.days_pending}d pending`,
      urgent,
    };
  });
};

export const fetchTopDestinations = async (): Promise<ChartDataPoint[]> => {
  const response = await apiClient.get<TopDestinationsResponse>(
    "/agency/top-destinations/",
  );
  const { top_destinations } = response.data;

  const colors = ["#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

  return top_destinations.map((item, index) => ({
    name: item.destination,
    value: item.booked_trips, // We'll use absolute value for now, component can calculate % if needed
    participants: item.booked_trips,
    color: colors[index % colors.length],
  }));
};

export const fetchAgentDashboardStats = async (): Promise<StatItem[]> => {
  const response = await apiClient.get<AgentDashboardStats>(
    `/agent/dashboard/analytics/`,
  );
  const data = response.data;

  return [
    {
      id: "total_quotes",
      title: "Total Quotes",
      value: data.total_quotes.toString(),
    },
    {
      id: "new_clients",
      title: "Client this Month",
      value: data.clients_this_month.toString(),
    },
    {
      id: "confirmed_bookings",
      title: "Confirmed Bookings",
      value: data.confirmed_bookings.toString(),
    },
    {
      id: "conversion_rate",
      title: "Conversion Rate",
      value: data.conversion_rate.toString(),
    },
    {
      id: "average_yield",
      title: "Average Yield",
      value: data.average_yield.toString(),
    },
  ];
};

export const fetchAgencyDashboardStats = async (): Promise<StatItem[]> => {
  const response = await apiClient.get<AgencyDashboardStatsResponse>(
    "/agency/dashboard-stats/",
  );
  const data = response.data;

  return [
    {
      id: "total_bookings",
      title: "Total Bookings",
      value: data.total_bookings.toString(),
      change: `${data.bookings_growth > 0 ? "+" : ""}${data.bookings_growth}%`,
      trend: data.bookings_growth >= 0 ? "up" : "down",
      type: "quotes",
    },
    {
      id: "clients_contacted",
      title: "Clients Contacted",
      value: data.clients_contacted.toString(),
      change: `${data.clients_growth > 0 ? "+" : ""}${data.clients_growth}%`,
      trend: data.clients_growth >= 0 ? "up" : "down",
      type: "clients",
    },
    {
      id: "quote_conversion",
      title: "Quote Conversion",
      value: `${data.quote_conversion}%`,
      change: `${data.conversion_growth > 0 ? "+" : ""}${data.conversion_growth}%`,
      trend: data.conversion_growth >= 0 ? "up" : "down",
      type: "revenue",
    },
    {
      id: "total_revenue",
      title: "Total Revenue",
      value: `${data.currency} ${data.total_revenue.toLocaleString()}`,
      change: `${data.revenue_growth > 0 ? "+" : ""}${data.revenue_growth}%`,
      trend: data.revenue_growth >= 0 ? "up" : "down",
      type: "revenue",
    },
  ];
};

export const fetchRevenueOverview = async (): Promise<ChartDataPoint[]> => {
  const response = await apiClient.get<RevenueOverviewResponse>(
    "/agency/revenue-overview/",
  );
  const { date_labels, revenue_values } = response.data;

  return date_labels.map((label, index) => ({
    name: label,
    value: revenue_values[index],
    date: label, // Using label as date for tooltip/filtering if needed
  }));
};

export const fetchAgencyWideRevenueOverview = async (): Promise<
  ChartDataPoint[]
> => {
  const response = await apiClient.get<AgencyWideRevenueResponse[]>(
    "/agency/revenue-overview-agency-wide/",
  );

  return response.data.map((item) => ({
    name: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: parseFloat(item.revenue),
    date: item.date,
  }));
};

export const fetchHeatMapData = async (
  month?: string,
  year?: number
): Promise<HeatMapDataPoint[]> => {
  const params: Record<string, string | number> = {};
  if (month) params.month = month;
  if (year) params.year = year;

  const response = await apiClient.get<any[]>("/agent/dashboard/bookings-map/", {
    params,
  });



  return response.data.map((loc) => ({
    name: loc.destination_city,
    country: loc.destination_country,
    formatted: loc.destination_formatted,
    coordinates: [
      Number(loc.destination_longitude),
      Number(loc.destination_latitude),
    ],
    value: loc.booking_count,
  }));
};

export const getDashboardData = async (
  role: string = "Agency Agent",
): Promise<DashboardData> => {
  // Return empty/default data structure instead of mock
  return Promise.resolve({
    stats: [],
    recentActivity: [],
    upcomingDepartures: { total: 0, urgent_count: 0, items: [] },
    todoList: [],
    topDestinations: [],
    revenueChart: [],
    salesPipeline: []
  } as unknown as DashboardData);
};

export { getApprovedQuotes };

export const fetchAgentRevenueOverview =
  async (): Promise<AgentRevenueOverview> => {
    const response = await apiClient.get(
      "/agent/dashboard/agent-revenue-overview/",
    );
    return response.data;
  };

export const fetchSalesPipeline = async (): Promise<SalesPipelineStat[]> => {
  const response = await apiClient.get<SalesPipelineResponse>(
    "/agent/dashboard/sales-pipeline/",
  );

  return response.data.quote_status_stats;
};

export const fetchRecentActivity = async (): Promise<ActivityItem[]> => {
  const response = await apiClient.get<RecentActivityApiItem[]>(
    "/agent/recent-activity/",
  );

  return response.data.map((item) => {
    const name =
      item.client_name && item.client_name !== "N/A"
        ? item.client_name
        : "System";

    return {
      user: name,
      action: item.message,
      target: "",
      time: new Date(item.timestamp).toLocaleString(),
      avatar: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    };
  });
};

export const fetchManagedBookings = async (): Promise<ApprovedQuote[]> => {
  const response = await apiClient.get<ManagedBookingApiItem[]>(
    "/agent/bookings/managed/",
  );

  return response.data.map((item) => ({
    id: item.quote_id,
    clientName: item.client_name,
    destination: item.destination,
    price: `$${Number(item.price).toLocaleString()}`,
    status: item.status, // "Ready", "Booked", etc.
    quoteId: item.quote_number,
    date: new Date(item.created_at).toLocaleDateString(),
  }));
};
export const fetchAgencyUpcomingDepartures =
  async (): Promise<UpcomingDeparturesData> => {
    const response = await apiClient.get(
      "/agency/analytics/upcoming-departures/",
    );

    const data = response.data;

    return {
      total: data.total_departures,
      urgent_count: data.urgent_departures,
      items: data.departures.map((dep: any) => ({
        id: dep.trip_id.toString(),
        name: dep.client_name,
        location: `${dep.from_airport || "—"} → ${dep.destination}`,
        departureDate: dep.departure_date,
        returnDate: dep.return_date,
        flight: dep.trip_title,
        time: dep.departure_time ?? "—",
        bookingRef: dep.trip_title,
        tag: "UPCOMING",
        tagType: dep.days_until_departure.includes("IN 3 DAYS") || dep.days_until_departure.includes("IN 1 DAY") || dep.days_until_departure.includes("TODAY") ? "urgent" : "info",
        urgentLevel: dep.days_until_departure.includes("IN 3 DAYS") || dep.days_until_departure.includes("IN 1 DAY") || dep.days_until_departure.includes("TODAY") ? "high" : "low",
        statusLabel: dep.days_until_departure,
        quoteId: dep.quote_id?.toString(),
        tripId: dep.trip_id?.toString(),
      })),
    };
  };

export const fetchAgencyAdminDashboardStats = async (): Promise<StatItem[]> => {
  const response = await apiClient.get<AgencyAdminStatsResponse>(
    "/agency/dashboard/stats/",
  );
  const data = response.data;

  return [
    {
      id: "total_agents",
      title: "Total Agents",
      value: data.total_agents.toString(),
      type: "clients",
    },
    {
      id: "total_bookings",
      title: "Total Bookings",
      value: data.total_bookings.toString(),
      type: "quotes",
    },
    {
      id: "total_quotes",
      title: "Total Quotes",
      value: data.total_quotes.toString(),
      type: "quotes",
    },
    {
      id: "conversion_rate",
      title: "Conversion Rate",
      value: `${data.conversion_rate}%`,
      type: "revenue",
    },
    {
      id: "total_revenue",
      title: "Total Revenue",
      value: `$${Number(data.total_revenue).toLocaleString()}`,
      type: "revenue",
    },
  ];
};

export const fetchTopPerformingAgents = async (
  filter: "weekly" | "monthly" | "overall" = "monthly"
): Promise<TopPerformerItem[]> => {
  const response = await apiClient.get("/agency/analytics/top-performing-agents/", {
    params: { filter },
  });
  const data = response.data;

  const performers: TopPerformerItem[] = [];

  if (data.top_revenue_agent) {
    performers.push({
      id: "top-revenue",
      name: data.top_revenue_agent.agent_name,
      metric: "Top Revenue",
      value: `$${Number(data.top_revenue_agent.revenue).toLocaleString()}`,
      progress: 100,
      color: "#0EA5E9",
    });
  }

  if (data.top_bookings_agent) {
    performers.push({
      id: "top-bookings",
      name: data.top_bookings_agent.agent_name,
      metric: "Top Bookings",
      value: `${data.top_bookings_agent.bookings} Bookings`,
      progress: 85,
      color: "#10B981",
    });
  }

  if (data.top_conversion_agent) {
    performers.push({
      id: "top-conversion",
      name: data.top_conversion_agent.agent_name,
      metric: "Top Conversion",
      value: `${data.top_conversion_agent.conversion_rate}%`,
      progress: 70,
      color: "#F59E0B",
    });
  }

  return performers;
};

export const fetchAgencyRecentActivity = async (): Promise<ActivityLog[]> => {
  const response = await apiClient.get<ActivityLog[]>(
    "/agency/dashboard/recent-activity/"
  );

  return response.data;
};

export const fetchSuperAdminAgencies = async (): Promise<SuperAdminAgency[]> => {
  const response = await apiClient.get("/agency/super-admin/agency-list/");
  return response.data;
};

export const fetchSuperAdminAgencyRevenue = async (
  agencyId: string
): Promise<SuperAdminAgencyRevenue> => {
  const response = await apiClient.get("/agency/super-admin/agency-revenue/", {
    params: { agency_id: agencyId },
  });
  return response.data;
};

export const fetchSuperAdminTopDestinations = async (
  agencyId?: string
): Promise<ChartDataPoint[]> => {
  const response = await apiClient.get("/agency/super-admin/top-destinations/", {
    params: agencyId ? { agency_id: agencyId } : {},
  });
  
  const colors = ["#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
  
  return response.data.map((item: SuperAdminTopDestination, index: number) => ({
    name: item.destination,
    value: item.bookings,
    participants: item.bookings,
    color: colors[index % colors.length],
  }));
};

export const fetchSuperAdminDashboardStats = async (): Promise<StatItem[]> => {
  const response = await apiClient.get<SuperAdminDashboardStats>(
    "/agency/super-admin/dashboard/stats/"
  );
  const data = response.data;

  return [
    {
      id: "total_agencies",
      title: "Total Agencies",
      value: data.total_agencies.toString(),
      type: "clients",
    },
    {
      id: "active_agencies",
      title: "Active Agencies",
      value: data.active_agencies.toString(),
      type: "quotes",
    },
    {
      id: "total_agents",
      title: "Total Agents",
      value: data.total_agents.toString(),
      type: "clients",
    },
    {
      id: "total_revenue",
      title: "Total Revenue",
      value: `$${Number(data.total_revenue).toLocaleString()}`,
      type: "revenue",
    },
  ];
};

export const fetchSystemHealth = async (): Promise<SystemHealthData> => {
  const response = await apiClient.get("/auth/system-health/");
  return response.data;
};

export const fetchSuperAdminCRMOverview = async (): Promise<any> => {
  const response = await apiClient.get("/auth/crm-overview/");
  return response.data;
};

export interface SuperAdminHotelListing {
  hotel_name: string;
  average_rating: number | null;
  total_bookings: number;
  booked_dates: string[];
  agencies: Array<{
    agency_id: number;
    agency_name: string;
  }>;
  source: string;
}

export interface SuperAdminFlightListing {
  carrier: string;
  flight_number: string;
  total_bookings: number;
  booked_dates: string[];
  agencies: Array<{
    agency_id: number;
    agency_name: string;
  }>;
  source: string;
}

export const fetchSuperAdminHotels = async (): Promise<SuperAdminHotelListing[]> => {
  const response = await apiClient.get("/agency/super-admin/hotels/");
  return response.data;
};

export const fetchSuperAdminFlights = async (): Promise<SuperAdminFlightListing[]> => {
  const response = await apiClient.get("/agency/super-admin/flights/");
  return response.data;
};

export interface HotelBookingDetail {
  booking_id: number;
  quote_id: number;
  quote_number: string;
  agency_name: string;
  agency_id: number;
  client_name: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  room_type: string | null;
  price: number;
  currency: string;
  booked_date: string;
  status: string;
}

export interface SuperAdminHotelDetail {
  id: number;
  hotel_name: string;
  hotel_image: string | null;
  address: string | null;
  country: string | null;
  country_code: string | null;
  star_rating: number | null;
  average_rating: number | null;
  review_count: number | null;
  total_bookings: number;
  total_revenue: number;
  source: string;
  bookings: HotelBookingDetail[];
}

export interface FlightBookingDetail {
  booking_id: number;
  quote_id: number;
  quote_number: string;
  agency_name: string;
  agency_id: number;
  client_name: string;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  cabin_class: string | null;
  price: number;
  currency: string;
  booked_date: string;
  status: string;
}

export interface SuperAdminFlightDetail {
  id: number;
  carrier: string;
  carrier_logo: string | null;
  flight_number: string;
  aircraft_type: string | null;
  total_bookings: number;
  total_revenue: number;
  source: string;
  bookings: FlightBookingDetail[];
}

export const fetchSuperAdminHotelsDetails = async (): Promise<SuperAdminHotelDetail[]> => {
  const response = await apiClient.get("/agency/super-admin/hotels/details/");
  return response.data;
};

export const fetchSuperAdminFlightsDetails = async (): Promise<SuperAdminFlightDetail[]> => {
  const response = await apiClient.get("/agency/super-admin/flights/details/");
  return response.data;
};
