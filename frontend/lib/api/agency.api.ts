import apiClient from './apiInterceptor';
import { authStore } from '@/lib/auth-store';

export interface CRMActivity {
  id: number;
  agent_name: string;
  performer_name:string;
  agency_name:string;
  status_code: number;
  message: string;
  created_at: string;
}

export interface CRMOverviewResponse {
  total_clients: number;
  new_clients: number;
  high_value_clients: number;
  recent_activities: CRMActivity[];
}

export const agencyApi = {
  getCRMOverview: async (agencyId?: number): Promise<CRMOverviewResponse> => {
    const id = agencyId || authStore.getUser()?.agency || 1;
    const response = await apiClient.get<CRMOverviewResponse>(`/agency/crm-overview?agency_id=${id}`);
    return response.data;
  }
};
