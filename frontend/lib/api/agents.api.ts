import apiClient from "./apiInterceptor";
// import { mockAgents, mockAgentStats } from "../mocks/agents.mock";
import { Agent, AgentDashboardStats, ApiAgentStatsResponse, ApiAgentListItem, ApiAgentDetailResponse } from "../types/agents";
import { AddAgentFormData } from "../types/agent-management";

// Helper to map backend agent list item to frontend Agent type
const mapApiAgentListToAgent = (apiAgent: ApiAgentListItem): Agent => {
  return {
    id: apiAgent.id.toString(),
    name: apiAgent.name,
    email: apiAgent.email,
    phone: apiAgent.phone || '',
    location: apiAgent.location || '',
    initials: apiAgent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
    status: apiAgent.status as 'Active' | 'Inactive' | 'Suspended',
    revenue: '$0', // Will be calculated from backend if available
    clientsCount: apiAgent.clients_count,
    joinedDate: '', // Not available in list endpoint
    commission: apiAgent.commission,
    commission_percent: apiAgent.commission,
    stats: {
      conversionRate: 0,
      avgResponseTime: '0h',
      responseTimeTrend: '0%',
      topDestination: '-',
      bookingsCount: 0,
      commission_percent: apiAgent.commission,
      clients_count: apiAgent.clients_count
    },
    recentActivity: []
  };
};

// Helper to map backend agent detail to frontend Agent type
const mapApiAgentDetailToAgent = (apiAgent: ApiAgentDetailResponse, baseAgent: Agent): Agent => {
  return {
    ...baseAgent,
    id: apiAgent.id.toString(),
    name: apiAgent.name,
    email: apiAgent.email,
    phone: apiAgent.phone || '',
    location: apiAgent.location || '',
    initials: apiAgent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
    clientsCount: apiAgent.clients_count,
    commission: parseFloat(apiAgent.commission_percent),
    commission_percent: parseFloat(apiAgent.commission_percent),
    stats: {
      ...baseAgent.stats,
      topDestination: apiAgent.top_destination || '-',
      bookingsCount: apiAgent.clients_count, // Using clients count as proxy
      commission_percent: parseFloat(apiAgent.commission_percent),
      clients_count: apiAgent.clients_count
    }
  };
};

export const agentsApi = {
  getAgents: async (): Promise<Agent[]> => {
    try {
      const response = await apiClient.get('/agency/agents/list/');
      const results: ApiAgentListItem[] = response.data || [];
      return results.map(mapApiAgentListToAgent);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
      return [];
    }
  },

  getAgentDetail: async (id: string): Promise<Agent | null> => {
    try {
      // Get base agent data from list first
      const listResponse = await apiClient.get('/agency/agents/list/');
      const agents: ApiAgentListItem[] = listResponse.data || [];
      const baseAgent = agents.find(a => a.id.toString() === id);
      
      if (!baseAgent) {
        return null;
      }
      
      // Fetch detailed data with agent_id parameter
      const response = await apiClient.get('/agency/agents/detail/', {
        params: { agent_id: id }
      });
      const detailData: ApiAgentDetailResponse = response.data;
      
      const mappedBaseAgent = mapApiAgentListToAgent(baseAgent);
      return mapApiAgentDetailToAgent(detailData, mappedBaseAgent);
    } catch (error) {
      console.error("Failed to fetch agent detail:", error);
      return null;
    }
  },

  createAgent: async (data: AddAgentFormData, config?: any): Promise<Agent> => {
    const payload = {
      full_name: data.fullName,
      username: data.username,
      email: data.email,
      phone: data.phone,
      location: data.location,
      commission: parseFloat(data.commission) || 0
    };
    const response = await apiClient.post('/agency/agents/add/', payload, config);
    // Return a basic agent object since the API returns minimal data
    return {
      id: response.data.agent_id.toString(),
      name: response.data.name,
      email: response.data.email,
      phone: data.phone,
      location: data.location,
      initials: response.data.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      status: 'Active',
      revenue: '$0',
      clientsCount: 0,
      joinedDate: new Date().toLocaleDateString(),
      commission: parseFloat(data.commission) || 0,
      commission_percent: parseFloat(data.commission) || 0,
      stats: {
        conversionRate: 0,
        avgResponseTime: '0h',
        responseTimeTrend: '0%',
        topDestination: '-',
        bookingsCount: 0,
        commission_percent: parseFloat(data.commission) || 0,
        clients_count: 0
      },
      recentActivity: []
    };
  },

  getAgentStats: async (): Promise<AgentDashboardStats> => {
    try {
      const response = await apiClient.get('/agency/agents/stats/');
      const data: ApiAgentStatsResponse = response.data;
      
      return {
        totalAgents: data.total_agents,
        activeAgents: data.active_agents,
        totalRevenue: `$${parseFloat(data.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        avgConversion: '0%' // Not provided by API yet
      };
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
      return {
        totalAgents: 0,
        activeAgents: 0,
        totalRevenue: '$0.00',
        avgConversion: '0%'
      };
    }
  },

  toggleAgentStatus: async (agent_id: string, is_active: boolean): Promise<void> => {
    await apiClient.patch('/agency/toggle-status/', { 
      agent_id: parseInt(agent_id), 
      is_active 
    });
  },

  suspendAgent: async (id: string): Promise<void> => {
    await apiClient.patch('/agency/toggle-status/', { 
      agent_id: parseInt(id), 
      is_active: false 
    });
  },

  resetPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/reset-password/', { email });
  },

  setCommission: async (id: string, commission: number): Promise<void> => {
    await apiClient.patch('/agency/agents/set-commission/', { 
      agent_id: parseInt(id),
      commission: commission 
    });
  },

  updatePermissions: async (id: string, permissions: any): Promise<void> => {
    await apiClient.post(`/agency/agents/set-permissions/${id}/`, { permissions });
  },

  removeAgent: async (id: string): Promise<void> => {
    const formData = new FormData();
    formData.append('agent_id', id);
    await apiClient.delete('/agency/agents/remove/', { data: formData });
  },

  getAgentSettings: async (): Promise<any> => {
    const response = await apiClient.get('/agent/settings/');
    return response.data;
  },

  updateAgentSettings: async (data: any): Promise<void> => {
    await apiClient.post('/agent/settings/', data);
  },
};
