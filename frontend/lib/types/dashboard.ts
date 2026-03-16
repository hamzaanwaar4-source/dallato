export interface StatItem {
  id: string;
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  type?: "quotes" | "clients" | "revenue" | "departures";
}

export interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: "call" | "message" | "task" | "alert";
  status: "pending" | "completed";
}

export interface RecommendationItem {
  id: string;
  name: string;
  action: string;
  price: string;
  probability: number;
  reason: string;
  image?: string;
}

export interface AlertItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "urgent" | "warning" | "info";
}

export interface ConversationItem {
  id: string;
  name: string;
  location: string;
  status: string;
  progress: number;
  lastMessage: string;
  avatarColor: string; // In real app this might be an image URL
}

export interface DepartureItem {
  id: string;
  name: string;
  location: string;
  departureDate: string;
  returnDate: string;
  flight: string;
  time: string;
  status: string;
  bookingRef: string; // Changed from bookingId to match modal
  tag?: string;
  tagType?: "urgent" | "warning" | "info";
  urgentLevel?: "high" | "medium" | "low";
  statusLabel?: string;
  quoteId?: string;
  tripId?: string;
}

export interface UpcomingDeparturesData {
  total: number;
  urgent_count: number;
  items: DepartureItem[];
}

export interface QuotePendingItem {
  id: string;
  initial: string;
  name: string;
  location: string;
  status: string;
  percentage: number;
  lastMessage: string;
  color: string;
}

export interface PendingQuoteItem {
  id: number;
  raw_data: {
    ticket_class?: string;
    [key: string]: any;
  };
  supplier_name: string;
  item_type: string;
  external_reference: string;
  title: string;
  description: string;
  check_in: string;
  check_out: string;
  base_price: string;
  markup_amount: string;
  commission_amount: string;
  gst_amount: string;
  total_price: string;
  cancellation_policy: string;
  option_group: string;
  day: number;
  created_at: string;
  updated_at: string;
  quote: number;
  supplier: number;
}

export interface PendingQuote {
  id: number;
  items: PendingQuoteItem[];
  agency: number;
  trip: number;
  created_by: number;
  version_number: number;
  currency: string;
  is_active_version: boolean;
  is_client_visible: boolean;
  base_total: string;
  markup_total: string;
  commission_total: string;
  gst_total: string;
  grand_total: string;
  notes_internal: string;
  notes_client: string;
  created_at: string;
  updated_at: string;
}

export interface TodoItem {
  id: string;
  task: string;
  client: string;
  tag: string;
  tagColor: string;
  progress: number;
  progressColor: string;
  nextAction: string;
  time: string;
  urgent: boolean;
}

export interface BackendTodoItem {
  id: string;
  client_name: string;
  client_id: number;
  task_title: string;
  task_category: string;
  task_status: string;
  next_action: string;
  due_date: string;
  priority: string;
  progress_percentage: number;
  related_object_type: string;
  related_object_id: number;
  additional_info: string;
}

export interface TodoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendTodoItem[];
  summary: {
    total_tasks: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  participants?: number;
  color?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface HeatMapDataPoint {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  value: number;
  totalValue?: number;
  country?: string;
  formatted?: string;
  statuses?: Record<string, number>;
  trips?: Array<{
    id: number;
    title: string;
    status: string;
    start_date: string;
    client_name: string;
  }>;
}

export interface ActivityLog {
  id: number;
  agent_name: string;
  message: string;
  status_code: number;
  created_at: string;
}

export interface ActivityItem {
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}
export function mapActivityLogsToItems(
  logs: ActivityLog[] = []
): ActivityItem[] {
  return logs.map((log) => {
    const name = log.agent_name || "System";

    return {
      user: name,
      action: log.message,
      target: "",
      time: new Date(log.created_at).toLocaleString(),
      avatar: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    };
  });
}


export interface TopDestination {
  destination: string;
  booked_trips: number;
}

export interface TopDestinationsResponse {
  top_destinations: TopDestination[];
}

export interface AgentDashboardStats {
  total_quotes: { value: number; growth: string };
  clients_this_month: { value: number; growth: string };
  confirmed_bookings: { value: number; growth: string };
  conversion_rate: { value: string; growth: string };
  average_yield: { value: string; growth: string };
}

export interface TopPerformerItem {
  id: string;
  name: string;
  metric: string;
  value: string;
  progress: number;
  color: string;
}

export interface DashboardData {
  stats: StatItem[];
  tasks: TaskItem[];
  recommendations: RecommendationItem[];
  alerts: AlertItem[];
  conversations: ConversationItem[];
  departures?: UpcomingDeparturesData;
  quotes: QuotePendingItem[];
  pendingQuotes?: PendingQuote[];
  todos: TodoItem[];
  revenueData: ChartDataPoint[];
  destinationsData: ChartDataPoint[];
  heatMapData?: HeatMapDataPoint[];
  activities?: ActivityItem[];
  activityLogs?: ActivityLog[];
  topPerformers?: TopPerformerItem[];
  travelSuggestions?: MonthSuggestion[];
}

export interface UserDashboardStats {
  total_bookings: number;
  bookings_growth: number;
  total_clients: number;
  clients_growth: number;
  quote_conversion: number;
  conversion_growth: number;
  total_revenue: number;
  revenue_growth: number;
  currency: string;
  pending_quotes: number;
  sent_quotes: number;
  upcoming_trips: number;
  active_clients: number;
  bookings_this_month: number;
  clients_this_month: number;
  revenue_this_month: number;
}

export interface AgencyAnalyticsStats {
  total_revenue: number;
  total_clients: number;
  total_deals: number;
  average_revenue_per_client: number;
  average_revenue_per_deal: number;
}

export interface Destination {
  name: string;
  country: string;
  why_visit: string;
  temperature: string;
  best_for: string;
}

export interface MonthSuggestion {
  month_number: number;
  month_name: string;
  season: string;
  destinations: Destination[];
}

export interface SystemHealthData {
  status: "Healthy" | "Warning" | "Critical";
  timestamp: string;
  uptime: number;
  cpu: {
    usage_percent: number;
    cores: number;
    frequency_mhz: number;
  };
  memory: {
    total: number;
    available: number;
    used: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  database: {
    status: string;
    engine: string;
  };
  system: {
    os: string;
    os_release: string;
    python_version: string;
    processor: string;
  };
}
