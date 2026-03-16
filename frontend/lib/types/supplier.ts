export type ApiStatus = 'Connected' | 'Error' | 'Pending' | 'Active';

export interface Supplier {
  id: string;
  name: string;
  logo?: string;
  apiStatus: ApiStatus;
  commission: string;
  agentUsage: string;
  availability: string;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
}

export interface SupplierStats {
  mostUsed: {
    name: string;
    value: string;
    subtitle: string;
  };
  bestCommission: {
    name: string;
    value: string;
    subtitle: string;
  };
  fastestGrowing: {
    name: string;
    value: string;
    subtitle: string;
  };
}

// API Response Interfaces
export interface ApiManagedSupplier {
  supplier_name: string;
  supplier_type: string;
  api_status: string;
  commission: string;
  bookings_count: number;
  usage_percent: string;
  trend_percent: string;
}

export interface ManagedSuppliersResponse {
  suppliers: ApiManagedSupplier[];
}
