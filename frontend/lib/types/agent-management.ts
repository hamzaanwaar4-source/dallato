export interface AgentPermissions {
  quoteAssistant: boolean;
  itineraryBuilder: boolean;
  crmAccess: boolean;
  supplierComparison: boolean;
  analyticsDashboard: boolean;
}

export interface AddAgentFormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  commission: string;
  permissions: AgentPermissions;
}
