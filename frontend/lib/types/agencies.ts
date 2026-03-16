export type AgencyStatus = 'Active' | 'Inactive' | 'Suspended';

export interface AgencyStats {
  totalRevenue: string;
  totalAgents: number;
  totalClients: number;
  conversionRate: number;
}

export interface Agency {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  phone: string;
  location: string;
  avatar?: string;
  initials: string;
  status: AgencyStatus;
  agentsCount: number;
  clientsCount: number;
  revenue: string;
  joinedDate: string;
  commission?: number;
  stats: AgencyStats;
}

export interface AgencyDashboardStats {
  totalAgencies: number;
  activeAgencies: number;
  totalRevenue: string;
  totalAgents: number;
}

export interface AddAgencyFormData {
  username: string;
  full_name: string;
  email: string;
  agency_name: string;
  default_currency: string;
  default_markup_percent: string;
  agent_commission: string;
}

export interface UpdateAgencyFormData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  commission?: string;
  default_currency?: string;
  default_markup_percent?: string;
}


// API Response Interfaces
export interface ApiAgencyListItem {
  id: number;
  name: string;
  slug: string;
  admin_username: string;
  admin_email: string;
  is_active: boolean;
  agents_count: number;
  clients_count: number;
  default_currency: string;
  default_markup_percent: string;
  agent_commission: string;
  created_at: string;
}

export interface ApiAgencyDetailResponse {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  default_markup_percent: string;
}

export interface UpdateAgencyPayload {
  agency_id: string;
  default_markup_percent?: number;
  agent_commission?: number;
  default_currency?: string;
  is_active?: boolean;
}

export interface DeleteAgencyPayload {
  agency_id: string;
}

// Adapter functions to transform API responses to frontend types
export function adaptApiAgencyToAgency(apiAgency: ApiAgencyListItem): Agency {
  const initials = apiAgency.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    id: apiAgency.id.toString(),
    name: apiAgency.name,
    email: apiAgency.admin_email,
    phone: '', 
    location: '', 
    is_active: apiAgency.is_active,

    initials,
    status: apiAgency.is_active ? 'Active' : 'Inactive',
    agentsCount: apiAgency.agents_count,
    clientsCount: apiAgency.clients_count,
    revenue: '$0', // Will be calculated from revenue endpoint
    joinedDate: new Date(apiAgency.created_at).toISOString().split('T')[0],
    commission: parseFloat(apiAgency.agent_commission),
    stats: {
      totalRevenue: '$0', // Will be calculated
      totalAgents: apiAgency.agents_count,
      totalClients: apiAgency.clients_count,
      conversionRate: 0 // Will be calculated
    }
  };
}
