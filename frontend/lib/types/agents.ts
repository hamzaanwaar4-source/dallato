export type AgentStatus = 'Active' | 'Inactive' | 'Suspended';

export interface AgentActivity {
  id: string;
  action: string;
  target: string;
  date: string;
  time: string;
  type: 'itinerary' | 'booking' | 'quote' | 'other';
}

export interface AgentStats {
  commission_percent: number;
  clients_count: number;
  topDestination: string;
  conversionRate?: number;
  avgResponseTime?: string;
  responseTimeTrend?: string;
  bookingsCount?: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar?: string;
  initials: string;
  status: AgentStatus;
  revenue: string;
  clientsCount: number;
  commission_percent: number;
  joinedDate: string;
  commission?: number;

  stats: AgentStats;
  recentActivity: AgentActivity[];
}

export interface AgentDashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalRevenue: string;
  avgConversion: string;
}

// API Response Interfaces
export interface ApiAgentStatsResponse {
  total_agents: number;
  active_agents: number;
  total_revenue: string;
}

export interface ApiAgentListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  clients_count: number;
  commission: number;
}

export interface ApiAgentDetailResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  commission_percent: string;
  clients_count: number;
  top_destination: string;
}

export interface AgentSettings {
  agent_id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  default_commission: string;
}

export interface UpdateAgentSettings {
  name?: string;
  phone?: string;
  location?: string;
  default_commission?: number;
}
