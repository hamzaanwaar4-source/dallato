import apiClient from './apiInterceptor';
import { ApiClient, CreateClientPayload, UpdateClientPayload, ApiTrip, ApiQuote, CreateClientResponse } from '@/lib/api/clients';
import { Client } from '@/lib/types/clients';

export interface CRMActivity {
  id: number;
  description: string;
  time: string;
  user: string;
  action_type: string;
}

export interface CRMOverviewResponse {
  total_clients: number;
  total_clients_growth: string;
  new_clients: number;
  high_value_clients: number;
  recent_activity: CRMActivity[];
}

export const clientsApi = {
  getClients: async () => {
    const response = await apiClient.get<ApiClient[]>('/agent/clients/list/');
    // The new endpoint returns a direct array
    if (Array.isArray(response.data)) {
        return response.data as ApiClient[];
    }
    return [];
  },

  getClient: async (id: number) => {
    const response = await apiClient.get<ApiClient>(`/agent/clients/detail/?client_id=${id}`);
    return response.data;
  },

  createClient: async (data: CreateClientPayload) => {
    const response = await apiClient.post<CreateClientResponse>('/agent/clients/create/', data);
    return response.data;
  },

  updateClient: async (id: number, data: UpdateClientPayload) => {
    const payload = {
      client_id: id,
      ...data
    };
    const response = await apiClient.patch<{ message: string }>('/agent/clients/update/', payload);
    return response.data;
  },

  deleteClient: async (id: number) => {
    const formData = new FormData();
    formData.append('client_id', id.toString());
    const response = await apiClient.delete<{ message: string }>('/agent/clients/delete/', {
      data: formData
    });
    return response.data;
  },
  
  getActivityLogs: async () => {
    const response = await apiClient.get<{ results: any[] }>('/clients/activity-logs/');
    return response.data.results;
  },

  getCRMOverview: async () => {
    const response = await apiClient.get<CRMOverviewResponse>('/clients/crm-overview/');
    return response.data;
  },

  getPastTrips: async (clientId: number) => {
    const response = await apiClient.get<ApiTrip[]>(`/agent/clients/past-trips/?client_id=${clientId}`);
    return response.data;
  },

  getUpcomingTrips: async (clientId: number) => {
    const response = await apiClient.get<ApiTrip[]>(`/agent/clients/upcoming-trips/?client_id=${clientId}`);
    return response.data;
  },

  getClientQuotes: async (clientId: number) => {
    const response = await apiClient.get<ApiQuote[]>(`/agent/clients/quotes/?client_id=${clientId}`);
    return response.data;
  },

  getClientNotes: async (clientId: number) => {
    const response = await apiClient.get<{ client_id: number; client_name: string; notes: string }>(`/agent/clients/notes/?client_id=${clientId}`);
    return response.data;
  }
};

// Helper function to format client type for display
const formatClientType = (clientType?: string): string => {
    if (!clientType) return '';
    // Convert FAMILY_FRIENDS to "Family/Friends", CORPORATE to "Corporate", etc.
    return clientType
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join('/');
};

// Helper function to format travel style for display
const formatTravelStyle = (travelStyle?: string): string => {
    if (!travelStyle) return '';
    // Convert LUXURY to "Luxury", BUSINESS to "Business", etc.
    return travelStyle.charAt(0) + travelStyle.slice(1).toLowerCase();
};

// Helper function to format activity timestamp
const formatActivityTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Adapter to convert ApiClient to UI Client type
export const adaptClientToUI = (apiClient: ApiClient): Client => {
    const clientName = apiClient.full_name || apiClient.name;
    
    // Generate tags from client_type and travel_style
    const tags: string[] = [];
    if (apiClient.client_type) {
        const typeStr = typeof apiClient.client_type === 'string' 
            ? apiClient.client_type 
            : apiClient.client_type_name || '';
        if (typeStr) {
            tags.push(formatClientType(typeStr));
        }
    }
    
    return {
        id: apiClient.id.toString(),
        name: clientName,
        email: apiClient.email,
        phone: apiClient.phone || '',
        location: apiClient.location || apiClient.origin || '',
        initials: clientName.substring(0, 2).toUpperCase(),
        color: 'bg-blue-500', // Default color
        tags: tags.length > 0 ? tags : (apiClient.tags || []),
        notes: apiClient.notes || '',
        trips: [], // Populated from separate trips API
        quotes: [], // Populated from separate quotes API
        joinedDate: apiClient.created_at,
        totalSpent: apiClient.total_revenue ? `$${apiClient.total_revenue}` : '$0',
        status: 'Active',
        lastContact: apiClient.updated_at,
        isFavorite: false,
        budgetRange: apiClient.budget_range || '',
        travelStyle: apiClient.travel_style 
            ? (typeof apiClient.travel_style === 'string' 
                ? formatTravelStyle(apiClient.travel_style)
                : apiClient.travel_style_name || '')
            : '',
        clientType: apiClient.client_type 
            ? (typeof apiClient.client_type === 'string' 
                ? formatClientType(apiClient.client_type)
                : apiClient.client_type_name || '')
            : '',
        interests: [],
        groupMembers: apiClient.family_members?.map(m => ({
            id: m.id,
            name: m.full_name,
            relation: m.relation,
            ageGroup: m.age_group
        })).filter(m => m.id !== undefined) as { id: number; name: string; relation: string; ageGroup: string; }[] || 
        apiClient.group_memberships?.map(m => ({
            id: m.id,
            name: m.name || m.client_name || '',
            relation: m.relation,
            ageGroup: m.age_group
        })).filter(m => m.id !== undefined) as { id: number; name: string; relation: string; ageGroup?: string; }[] || [],
        loyaltyPrograms: apiClient.loyalty_memberships?.map(m => ({
            name: m.program_name || m.name || '',
            number: m.membership_number || m.number || '',
            type: (m.type?.toLowerCase() === 'airline' ? 'airline' : 'hotel') as 'airline' | 'hotel'
        })) || [],
        importantDates: (apiClient.dob || apiClient.date_of_birth) 
            ? [{ type: 'Birthday', date: apiClient.dob || apiClient.date_of_birth || '' }] 
            : [],
        recentActivity: apiClient.recent_activity?.map(activity => ({
            action: activity.message,
            date: formatActivityTimestamp(activity.timestamp),
            status: activity.status_code === 200 || activity.status_code === 201 ? 'Success' : 'Failed',
            statusColor: activity.status_code === 200 || activity.status_code === 201 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
        })) || [],
        upcomingTripsCount: apiClient.upcoming_trips || 0,
        pastTripsCount: apiClient.past_trips || 0,
        ownerName: apiClient.owner_name,
        agency: apiClient.agency,
        owner: apiClient.owner,
        loyaltyMemberships: apiClient.loyalty_memberships || [],
        followUps: apiClient.follow_ups || [],
        deals: apiClient.deals || [],
        destination: apiClient.destination || '',
        travelDate: apiClient.travel_date || '',
        commissionPercent: apiClient.commission_percent || '0.00',
        membership: apiClient.membership || ''
    };
};
