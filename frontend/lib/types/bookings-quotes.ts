export type QuoteStatus = 'DRAFT' | 'INITIAL_CONTACT' | 'QUOTE_SENT' | 'IN_NEGOTIATION' | 'ACCEPTED' | 'DECLINED' | 'VIEWED' | 'EXPIRED' | 'Sent' | 'Draft' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired';

export interface ActivityLog {
  id: string;
  action: string;
  time: string;
  user: string;
  status: number; // 1 for completed, 2 for current, etc.
  description?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  destination: string;
  value: string;
  status: QuoteStatus;
  expiry: string;
  agentName: string;
  travelDates: string;
  activityTimeline: ActivityLog[];
  flights?: any[];
  hotels?: any[];
  tripTitle?: string;
  clientEmail?: string;
  agentEmail?: string;
  versionNumber?: number;
  currency?: string;
}

export interface BookingQuoteStats {
  totalQuotes: number;
  activeBookings: number;
  conversionRate: number;
  revenue: string;
}
