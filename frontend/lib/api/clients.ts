export interface FamilyMember {
  id?: number;
  full_name: string;
  relation: string;
  age_group: string;
}

export interface RecentActivity {
  message: string;
  timestamp: string;
  status_code: number;
}

export interface ApiClient {
  id: number;
  name: string;
  full_name?: string; // New field from API
  email: string;
  phone?: string;
  location?: string; // New field from API
  date_of_birth?: string;
  dob?: string; // New field from API
  notes?: string;
  preferences?: Record<string, unknown>;
  tags?: string[];
  travel_style_name?: string;
  client_type_name?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  budget_range?: string;
  origin?: string;
  destination?: string;
  travel_date?: string; // New field from API
  created_at: string;
  updated_at: string;
  owner_name?: string;
  agency?: number;
  owner?: number;
  loyalty_memberships?: any[];
  follow_ups?: any[];
  deals?: any[];
  client_type?: string | number; // ID or Name
  travel_style?: string | number; // ID or Name
  group_members?: { name: string; type: 'adult' | 'child'; relation?: string }[];
  group_memberships?: {
    id: number;
    group: number;
    client: number;
    client_name: string;
    name?: string;
    relation: string;
    age_group?: string;
    created_at: string;
    updated_at: string;
  }[];
  // New fields from API
  upcoming_trips?: number;
  past_trips?: number;
  total_revenue?: string;
  commission_percent?: string;
  family_members?: FamilyMember[];
  recent_activity?: RecentActivity[];
  membership?: string;
}

export interface CreateClientPayload {
  agent_id?: number;
  full_name: string;
  email: string;
  phone?: string;
  dob?: string;
  notes?: string;
  budget_range?: string;
  origin?: string;
  destination?: string;
  travel_date?: string;
  client_type?: string;
  travel_style?: string;
  commission_percent?: string;
  family_members?: FamilyMember[];
  membership?: string;
}

export interface CreateClientResponse {
  message: string;
  client_id: number;
}

export type UpdateClientPayload = Partial<ApiClient>;

export interface ClientType {
  id: number;
  name: string;
  description?: string;
}

export interface TravelStyle {
  id: number;
  name: string;
  description?: string;
}

export interface ApiTrip {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  destination_city: string;
  destination_country: string;
  is_booked: boolean;
  created_at: string;
}

export interface ApiQuote {
  id: number;
  quote_number: string;
  version_number: number;
  currency: string;
  status: string;
  ai_base_total: string;
  created_at: string;
  updated_at: string;
}

