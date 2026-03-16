import apiClient from './apiInterceptor';
import { AnalyticsStatsResponse, PerformanceLeaderboardResponse, ConversionRateResponse, QuotesGeneratedResponse, RevenueByDestinationResponse, SupplierUsageResponse, AgentListItem } from '@/lib/types/analytics';

/**
 * Fetches agent list for analytics filters
 */
export const getAgentsList = async (): Promise<AgentListItem[]> => {
  const response = await apiClient.get<AgentListItem[]>('/agency/agents/list/');
  return response.data;
};

/**
 * Fetches agent analytics stats
 */
export const getAnalyticsStats = async (): Promise<AnalyticsStatsResponse> => {
  const response = await apiClient.get<AnalyticsStatsResponse>('/agency/analytics/stats/');
  return response.data;
};

/**
 * Fetches agent performance leaderboard
 */
export const getPerformanceLeaderboard = async (month: 'this_month' | 'last_month'): Promise<PerformanceLeaderboardResponse> => {
  const response = await apiClient.get<PerformanceLeaderboardResponse>(`/agency/analytics/performance-leaderboard/?month=${month}`);
  return response.data;
};

/**
 * Fetches agent conversion rates
 */
export const getConversionRates = async (): Promise<ConversionRateResponse> => {
  const response = await apiClient.get<ConversionRateResponse>('/agency/analytics/conversion-rate/');
  return response.data;
};

/**
 * Fetches quotes generated data
 */
export const getQuotesGenerated = async (period: 'weekly' | 'monthly'): Promise<QuotesGeneratedResponse> => {
  const response = await apiClient.get<QuotesGeneratedResponse>(`/agency/analytics/quotes-generated/?period=${period}`);
  return response.data;
};

/**
 * Fetches revenue by destination data
 */
export const getRevenueByDestination = async (agentId?: string): Promise<RevenueByDestinationResponse> => {
  const url = agentId ? `/agency/analytics/revenue-by-destination/?agent_id=${agentId}` : '/agency/analytics/revenue-by-destination/';
  const response = await apiClient.get<RevenueByDestinationResponse>(url);
  return response.data;
};

/**
 * Fetches supplier usage data
 */
export const getSupplierUsage = async (): Promise<SupplierUsageResponse> => {
  const response = await apiClient.get<SupplierUsageResponse>('/agency/analytics/supplier-usage/');
  return response.data;
};
