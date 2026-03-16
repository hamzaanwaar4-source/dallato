import apiClient from './apiInterceptor';
import { 
  Agency, 
  AgencyDashboardStats, 
  AddAgencyFormData,
  UpdateAgencyFormData,
  ApiAgencyListItem,
  adaptApiAgencyToAgency
} from "@/lib/types/agencies";

export const agenciesApi = {
  // Get all agencies
  async getAgencies(): Promise<Agency[]> {
    const response = await apiClient.get<ApiAgencyListItem[]>('/agency/super-admin/agency-list/');
    return response.data.map(adaptApiAgencyToAgency);
  },

  // Get agency stats
  async getAgencyStats(): Promise<AgencyDashboardStats> {
    const response = await apiClient.get<{
      total_agencies: number;
      active_agencies: number;
      total_agents: number;
      total_revenue: number;
    }>('/agency/super-admin/dashboard-stats/');
    
    return {
      totalAgencies: response.data.total_agencies,
      activeAgencies: response.data.active_agencies,
      totalRevenue: `$${response.data.total_revenue.toFixed(2)}`,
      totalAgents: response.data.total_agents
    };
  },

  // Get single agency detail
  async getAgencyDetail(agencyId: string): Promise<Agency | null> {
    try {
      // Use dedicated detail endpoint
      const response = await apiClient.get<ApiAgencyListItem>(
        `/agency/super-admin/agency-detail/?agency_id=${agencyId}`
      );
      
      // Transform to frontend format
      const agency = adaptApiAgencyToAgency(response.data);
      
      return agency;
    } catch (error) {
      console.error('Failed to fetch agency detail:', error);
      return null;
    }
  },

  // Create new agency
  async createAgency(data: AddAgencyFormData, config?: any): Promise<any> {
    const response = await apiClient.post('/agency/create/', {
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      agency_name: data.agency_name,
      default_currency: data.default_currency.slice(0, 3).toUpperCase(), // Ensure max 3 chars
      default_markup_percent: parseFloat(data.default_markup_percent),
      agent_commission: parseFloat(data.agent_commission)
    }, config);

    return response.data;
  },

  // Update agency
  async updateAgency(agencyId: string, data: UpdateAgencyFormData): Promise<Agency> {
    const payload: any = {
      agency_id: agencyId
    };

    // Map frontend fields to backend fields
    if (data.commission !== undefined) {
      payload.agent_commission = parseFloat(data.commission);
    }
    if (data.default_markup_percent !== undefined) {
      payload.default_markup_percent = parseFloat(data.default_markup_percent);
    }
    if (data.default_currency !== undefined) {
      payload.default_currency = data.default_currency.slice(0, 3).toUpperCase(); // Ensure max 3 chars
    }

    await apiClient.patch('/agency/update/', payload);

    // Refetch the agency to get updated data
    const updatedAgency = await this.getAgencyDetail(agencyId);
    if (!updatedAgency) {
      throw new Error('Failed to fetch updated agency');
    }

    return updatedAgency;
  },

  // Delete agency
  async deleteAgency(agencyId: string): Promise<void> {
    await apiClient.delete('/agency/delete/', {
      data: { agency_id: agencyId }
    });
  },

  // Toggle agency status
  async toggleAgencyStatus(agencyId: string, isActive: boolean): Promise<void> {
    await apiClient.patch('/agency/toggle-status/', {
      agency_id: agencyId,
      is_active: isActive
    });
  }
};
