export interface ApiQuoteItem {
    id?: number;
    quote?: number;
    supplier?: number;
    supplier_name?: string;
    item_type: "FLIGHT" | "HOTEL" | "ACTIVITY" | "TRANSFER" | "VISA" | "INSURANCE" | "OTHER";
    title: string;
    description?: string;
    check_in?: string;
    check_out?: string;
    base_price: number;
    markup_amount?: number;
    commission_amount?: number;
    gst_amount?: number;
    total_price: number;
    cancellation_policy?: string;
    option_group?: string;
    raw_data?: Record<string, unknown>;
}

export interface ApiQuote {
    id: number;
    trip: number;
    agency: number;
    version_number: number;
    currency: string;
    is_active_version: boolean;
    is_client_visible: boolean;
    base_total: string;
    markup_total: string;
    commission_total: string;
    gst_total: string;
    grand_total: string;
    notes_internal?: string;
    notes_client?: string;
    created_at: string;
    updated_at: string;
    items: ApiQuoteItem[];
}

export interface ApiTrip {
    id: number;
    agency: number;
    client_group: number;
    primary_client: number;
    primary_client_name: string;
    created_by?: number;
    title: string;
    start_date?: string;
    end_date?: string;
    destination_summary?: string;
    status: "INQUIRY" | "PLANNING" | "QUOTED" | "BOOKED" | "COMPLETED" | "CANCELLED";
    notes_internal?: string;
    created_at: string;
    updated_at: string;
    quotes: ApiQuote[];
}

export interface ApiItineraryActivity {
    id: number;
    itinerary_day: number;
    quote_item?: number;
    title: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    ordering: number;
}

export interface ApiItineraryDay {
    id: number;
    itinerary: number;
    date: string;
    day_order: number;
    title: string;
    activities: ApiItineraryActivity[];
}

export interface ApiItinerary {
    id: number;
    agency: number;
    trip: number;
    title: string;
    currency: string;
    created_at: string;
    updated_at: string;
    days: ApiItineraryDay[];
}
