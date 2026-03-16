


import { LucideIcon } from "lucide-react";

export interface QuoteStatItem {
  id: number;
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  iconName:
    | "CalendarCheck"
    | "UserRoundPlus"
    | "CircleDollarSign"
    | "DollarSign"; // Storing icon name as string for serializability if needed, or we can map it in the component
}

export interface QuotesData {
  stats: QuoteStatItem[];
}

export interface QuoteItem {
  type: "Hotel" | "Flight" | "Transfer" | "Tour" | "Insurance" | "Itinerary";
  title: string;
  description: string;
  price: number;
  icon?: string | LucideIcon;
  day?: number;
  metadata?: Record<string, unknown>; // Store raw API data for detailed rendering
  id?: string;
  quantity?: number;
  check_in?: string;
  check_out?: string;
}

export interface ItineraryActivity {
  title: string;
  description: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  price?: number;
  id?: string;
}

export interface ItineraryDay {
  day: string;
  date: string | null;
  title: string;
  activities: ItineraryActivity[];
  id?: string;
}

export type QuoteStatus = 
  | "Draft" 
  | "Initial Contact" 
  | "Quote Sent" 
  | "In Negotiation" 
  | "Confirmed" 
  | "Removed"
  | "Approved" 
  | "Booked";

export interface Quote {
  id: string;
  clientName: string;
  destination: string;
  price: string;
  status: QuoteStatus;
  version: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  travelerCount?: number;
  familyMembersCount?: number;
  fromAirport?: string;
  toAirport?: string;
  items: QuoteItem[];
  itineraryDays?: ItineraryDay[];
  tripId?: string;
  itineraryId?: string;
  sessionId?: number | null;
    priceSummary?: {
      flightsTotal: number;
      hotelsTotal: number;
      baseTotal: number;
      agentCommission: number;
      agentCommissionPercent: number;
      agencyCommission: number;
      agencyCommissionPercent: number;
      totalAmount: number;
    };
}

export interface Supplier {
  name: string;
  roomType: string;
  price: string;
  cancellation: string;
  status: "Available" | "Limited" | "Sold Out";
  isRecommended?: boolean;
  tags?: string[];
}

export interface Recommendation {
  icon: string;
  color: string;
  textColor: string;
  text: string;
}

// API Response Types
export interface ApiQuote {
  id: number;
  version: number;
  status?: string;
  created_at: string;
  traveler_count?: number;
  from_airport?: string | null;
  to_airport?: string | null;
}

export interface ApiQuoteDraftClient {
  id: number;
  name: string;
  email: string;
  destination: string | null;
  quote_count: number;
  quotes: ApiQuote[];
  created_at: string;
}

export interface ApiDetailedQuoteResponse {
  quote: {
    id: number;
    clientName: string;
    version_number: number;
    destination: string | null;
    currency: string;
    status: string;
    base_total: string;
    markup_total: string;
    commission_total?: string;
    gst_total?: string;
    grand_total?: string;
    start_date?: string | null;
    end_date?: string | null;
    trip_id: number;
    traveler_count?: number;
    from_airport?: string | null;
    to_airport?: string | null;
    created_at: string;
  };
  itinerary_id?: number | null;
  client?: {
    name: string;
    email: string;
    destination: string | null;
  };
  flights: Array<{
    id: number;
    title: string;
    description: string;
    check_in: string | null;
    check_out: string | null;
    total_price: string;
    carrier_logo?: string;
  }>;
  hotels: Array<{
    id: number;
    title: string;
    description: string;
    check_in: string | null;
    check_out: string | null;
    total_price: string;
  }>;
  activities: Array<{
    id: number;
    title: string;
    description: string;
    day: number | null;
    check_in: string | null;
    check_out: string | null;
    total_price: string;
  }>;
  itinerary_days: Array<{
    day: string;
    date: string | null;
    title: string;
    activities: Array<{
      title: string;
      description: string;
      start_time: string | null;
      end_time: string | null;
      location: string | null;
      id?: number;
    }>;
    id?: number;
  }>;
}

export interface ApprovedQuote {
  id: string;
  quoteId: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  destination: string;
  price: string;
  status: QuoteStatus;
  date: string;
  version: string;
}

export interface ApiApprovedQuote {
  quote: {
    id: number;
    version_number: number;
    destination: string;
    currency: string;
    base_total: string;
    markup_total: string;
    commission_total: string;
    gst_total: string;
    grand_total: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
  };
  client: {
    id: number;
    name: string;
    email: string;
    destination: string;
  };
}

export interface ApiApprovedQuotesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiApprovedQuote[];
}

export interface ApiRawQuoteItem {
  id: number;
  item_type:
    | "FLIGHT"
    | "HOTEL"
    | "ACTIVITY"
    | "TRANSFER"
    | "VISA"
    | "INSURANCE"
    | "OTHER";
  title: string;
  description: string;
  check_in: string | null;
  check_out: string | null;
  total_price: string;
  day: number | null;
  raw_data: any;
}

export interface ApiRawQuote {
  id: number;
  items: ApiRawQuoteItem[];
  agency: number;
  trip: number;
  created_by: number;
  version_number: number;
  currency: string;
  grand_total: string;
  created_at: string;
  updated_at: string;
}
export interface ApiAgencyQuote {
  id: number;
  quote_number: string;
  client_name: string;
  destination: string;
  quote_value: string;
  status: string;
  days_left: number;
  created_at: string;
}

export interface ApiAgencyTimeline {
  step_number: number;
  title: string;
  description: string;
  timestamp: string;
}

export interface ApiAgencyFlight {
  id: number;
  flight_type: "OUTBOUND" | "RETURN";
  travel_class: string;
  price_per_seat: string;
  carrier: string;
  flight_currency: string;
  departure_datetime: string;
  departure_airport: string;
  arrival_datetime: string;
  arrival_airport: string;
  duration: string;
  stops: number;
  baggage_include: string | null;
  flight_number: string;
  carrier_logo?: string;
}

export interface ApiAgencyHotel {
  id: number;
  name: string;
  price_total: string;
  hotel_currency: string;
  rating: string;
  review_count: number;
  star_rating: number;
  country_code: string;
  latitude: string;
  longitude: string;
  main_photo_url: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
  room_type: any[];
  labels: any[];
}

export interface ApiAgencyQuoteDetail extends ApiAgencyQuote {
  agent_name: string;
  agent_email: string;
  client_email: string;
  travel_dates: string;
  version_number: number;
  currency: string;
  expiry: string;
  quote_activity_timeline: ApiAgencyTimeline[];
  flights: ApiAgencyFlight[];
  hotels: ApiAgencyHotel[];
  itinerary: any | null;
  trip_title: string;
  updated_at: string;
}

export interface ApiPendingQuote {
  quote_id: number;
  quote_number: string;
  client_id: number;
  client_name: string;
  destination: string;
  status: string;
  version_number: number;
  created_at: string;
  trip_title: string;
}

export interface ApiManagedBooking {
  client_id: number;
  client_name: string;
  client_email: string;
  quote_id: number;
  quote_number: string;
  destination: string;
  price: string;
  status: string;
  created_at: string;
}

export interface ApiAgentQuoteDetail {
  quote_id: number;
  quote_number: string;
  version_number: number;
  status: string;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  session_id?: number | null;
  trip: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    destination_city: string;
    destination_country: string;
    destination_formatted: string;
    from_airport: string;
    to_airport: string;
    is_booked: boolean;
  };
  traveler: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    client_type: string;
    travelers_count?: number;
    family_members_count?: number;
  };
  flights: Array<{
    id: number;
    flight_type: string;
    travel_class: string;
    price_per_seat: number;
    carrier: string;
    flight_currency: string;
    source: string;
    departure_datetime: string | null;
    departure_airport: string;
    arrival_datetime: string | null;
    arrival_airport: string;
    duration: string;
    stops: number;
    baggage_include: string;
    flight_number: string;
    carrier_logo?: string;
  }>;
  hotels: Array<{
    id: number;
    name: string;
    price_total: number;
    hotel_currency: string;
    rating: number;
    review_count: number | null;
    star_rating: number;
    country_code: string;
    latitude: number | null;
    longitude: number | null;
    main_photo_url: string;
    checkin_time: string | null;
    checkout_time: string | null;
    room_type: any[];
    labels: any[];
    source: string;
  }>;
  itinerary: {
    id: number;
    days: Array<{
      id: number;
      date: string;
      title: string;
      activities: Array<{
        id: number;
        title: string;
        description: string;
        cost: number;
        start_time: string | null;
        end_time: string | null;
        date: string;
      }>;
    }>;
  };
  price_summary: {
    flights_total: number;
    hotels_total: number;
    ai_base_total: number;
    agent_commission_percent: number;
    agent_commission_amount: number;
    agency_commission_percent: number;
    agency_commission_amount: number;
    total_price: number;
    total_amount:number;
  };
}

export interface UpdateQuoteStatusRequest {
  quote_id: number;
  status: 'DRAFT' | 'INITIAL_CONTACT' | 'QUOTE_SENT' | 'IN_NEGOTIATION' | 'CONFIRMED' | 'REMOVED';
}

export interface UpdateQuoteStatusResponse {
  message: string;
  quote_id: number;
  old_status: string;
  new_status: string;
}

