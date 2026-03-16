export interface AnalyticsStat {
  label: string;
  value: string;
  trend: string;
  icon: string;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  revenue: number;
  rank: number;
}

export interface ConversionRateEntry {
  id: string;
  name: string;
  rate: number;
  color: string;
}

export interface QuoteTrendData {
  name: string;
  quotes: number;
}

export interface RevenueDestinationData {
  name: string;
  value: number;
  color: string;
}

export interface SupplierUsageEntry {
  id: string;
  supplier: string;
  totalLeads: string;
  usagePercent: number;
  trend: string;
  distribution: number[];
}

export interface AnalyticsData {
  stats: AnalyticsStat[];
  leaderboard: LeaderboardEntry[];
  conversionRates: ConversionRateEntry[];
  quoteTrends: {
    monthly: QuoteTrendData[];
    weekly: QuoteTrendData[];
  };
  revenueByDestination: RevenueDestinationData[];
  supplierUsage: SupplierUsageEntry[];
  topInsight: string;
}
export interface AnalyticsStatsResponse {
  avg_revenue_per_agent: string;
  avg_clients_per_agent: string;
  total_bookings: number;
}

export interface AgentPerformance {
  agent_name: string;
  total_revenue: string;
}

export interface PerformanceLeaderboardResponse {
  agents: AgentPerformance[];
}

export interface AgentConversionRate {
  agent_name: string;
  conversion_rate: number;
}

export type ConversionRateResponse = AgentConversionRate[];

export interface AgentQuotesGenerated {
  agent_name: string;
  quotes_count: number;
  percentage: number;
}

export type QuotesGeneratedResponse = AgentQuotesGenerated[];

export interface DestinationRevenue {
  destination: string;
  revenue: number;
  bookings_count: number;
}

export type RevenueByDestinationResponse = DestinationRevenue[];

export interface SupplierUsage {
  supplier_name: string;
  total_leads: number;
  usage_percentage: number;
  trend: string;
}

export type SupplierUsageResponse = SupplierUsage[];

export interface AgentListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  clients_count: number;
  commission: number;
}
