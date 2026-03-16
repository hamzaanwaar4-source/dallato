import apiClient from './apiInterceptor';
import { ApiTrip, ApiQuote, ApiItinerary, ApiQuoteItem } from './trips';
import { Quote, QuoteItem } from '../types/quotes';
import { DayItem } from '../types/itinerary';
import { ClientTrip, ClientQuote } from '../types/clients';

// --- Adapters ---

export const adaptApiQuoteToUI = (apiQuote: ApiQuote): Quote => {
    return {
        id: apiQuote.id.toString(),
        clientName: 'Client', // Should be fetched or passed
        destination: 'Destination', // Should be fetched or passed
        price: apiQuote.grand_total,
        status: apiQuote.is_active_version ? 'Approved' : 'Booked',
        version: `v${apiQuote.version_number}`,
        updatedAt: apiQuote.updated_at,
        items: apiQuote.items.map(adaptApiQuoteItemToUI)
    };
};

export const adaptApiQuoteItemToUI = (apiItem: ApiQuoteItem): QuoteItem => {
    const typeMap: Record<string, QuoteItem['type']> = {
        'FLIGHT': 'Flight',
        'HOTEL': 'Hotel',
        'ACTIVITY': 'Itinerary',
        'TRANSFER': 'Transfer',
        'INSURANCE': 'Insurance',
        'OTHER': 'Tour'
    };

    return {
        id: apiItem.id?.toString(),
        type: typeMap[apiItem.item_type] || 'Tour',
        title: apiItem.title,
        description: apiItem.description || '',
        price: Number(apiItem.total_price),
        quantity: 1,
        metadata: apiItem.raw_data
    };
};

export const adaptApiItineraryToUI = (apiItinerary: ApiItinerary): DayItem[] => {
    return apiItinerary.days.map(day => ({
        day: day.day_order,
        date: day.date,
        activitiesCount: day.activities.length,
        activities: day.activities.map(activity => ({
            time: activity.start_time || '',
            title: activity.title,
            location: activity.location || '',
            description: activity.description || '',
            price: '0', // Not directly in activity model
            color: 'bg-blue-500'
        }))
    }));
};

export const adaptApiTripToClientTrip = (apiTrip: ApiTrip): ClientTrip => {
    return {
        id: apiTrip.id.toString(),
        destination: apiTrip.destination_summary || apiTrip.title,
        date: apiTrip.start_date || '',
        status: apiTrip.status === 'COMPLETED' ? 'Completed' : 
                apiTrip.status === 'CANCELLED' ? 'Cancelled' : 'Upcoming',
        price: '', // Would need to sum quotes
        type: 'flight' // Default or derive from items
    };
};

export const adaptApiQuoteToClientQuote = (apiQuote: ApiQuote): ClientQuote => {
    return {
        id: apiQuote.id.toString(),
        destination: 'Trip Quote', // Should be from trip
        date: apiQuote.created_at,
        status: apiQuote.is_active_version ? 'Accepted' : 'Pending',
        price: `$${apiQuote.grand_total}`,
        quoteId: `Q-${apiQuote.id}`,
        version: `v${apiQuote.version_number}`,
        travelers: 2, // Mock or from trip
        validUntil: '',
        duration: ''
    };
};

// --- API Methods ---

export const tripsApi = {
    // Trips
    getTrips: async (params?: { agency_id?: number; client_id?: number }) => {
        const response = await apiClient.get<{ results: ApiTrip[] }>('/trips/', { params });
        return response.data.results;
    },
    createTrip: async (payload: Record<string, unknown>) => {
        const response = await apiClient.post<ApiTrip>('/trips/', payload);
        return response.data;
    },
    getTrip: async (id: number) => {
        const response = await apiClient.get<ApiTrip>(`/trips/${id}/`);
        return response.data;
    },

    // Quotes
    getQuotes: async (tripId?: number) => {
        const response = await apiClient.get<{ results: ApiQuote[] }>('/trips/quotes/', { params: { trip_id: tripId } });
        return response.data.results;
    },
    createQuote: async (payload: Record<string, unknown>) => {
        const response = await apiClient.post<ApiQuote>('/trips/quotes/', payload);
        return response.data;
    },
    updateQuote: async (id: number, payload: Record<string, unknown>) => {
        const response = await apiClient.patch<ApiQuote>(`/trips/quotes/${id}/`, payload);
        return response.data;
    },
    approveQuote: async (id: number) => {
        const response = await apiClient.post<ApiQuote>(`/trips/quotes/${id}/approve/`);
        return response.data;
    },
    deleteQuote: async (id: number) => {
        await apiClient.delete(`/trips/quotes/${id}/`);
    },

    // Itineraries
    getItineraries: async () => {
        const response = await apiClient.get<ApiItinerary[]>('/trips/itineraries/');
        return response.data;
    },
    createItinerary: async (payload: Record<string, unknown>) => {
        const response = await apiClient.post<ApiItinerary>('/trips/itineraries/', payload);
        return response.data;
    },
    getItinerary: async (id: number) => {
        const response = await apiClient.get<ApiItinerary>(`/trips/itineraries/${id}/`);
        return response.data;
    },
    generateItineraryFromQuote: async (quoteId: number) => {
        const response = await apiClient.post<ApiItinerary>(`/trips/itineraries/generate-from-quote/${quoteId}/`);
        return response.data;
    },
    saveFullQuote: async (payload: { trip_id?: number | null; trip_data: Record<string, unknown>; quote_data: Record<string, unknown> }) => {
        const response = await apiClient.post<ApiQuote>('/trips/', payload);
        return response.data;
    },
    
    // New endpoint for saving complete trip with flights, hotels, and itinerary
    saveTripQuote: async (payload: {
        client_id: number;
        trip_title: string;
        start_date?: string;
        end_date?: string;
        destination_city?: string;
        destination_country?: string;
        destination_formatted?: string;
        to_airport?: string;
        from_airport?: string;
        currency?: string;
        ai_base_total?: number;
        flights?: Array<{
            flight_type: 'OUTBOUND' | 'RETURN';
            travel_class?: string;
            price_per_seat: number;
            carrier?: string;
            flight_currency?: string;
            departure_airport?: string;
            arrival_airport?: string;
            flight_number?: string;
            stops?: number;
            departure_datetime?: string;
            arrival_datetime?: string;
            duration?: string;
            baggage_include?: string;
        }>;
        hotels?: Array<{
            name: string;
            price_total: number;
            hotel_currency?: string;
            star_rating?: number;
            rating?: number | string;
            country_code?: string;
            review_count?: number;
            latitude?: string;
            longitude?: string;
            main_photo_url?: string;
            checkin_time?: string;
            checkout_time?: string;
            room_type?: any[];
            labels?: any[];
        }>;
        itinerary?: {
            days: Array<{
                date: string;
                title: string;
                activities: Array<{
                    title: string;
                    description: string;
                    date: string;
                    itineraryactivity_cost?: number;
                    start_time?: string;
                    end_time?: string;
                    location?: string;
                }>;
            }>;
        };
    }) => {
        const response = await apiClient.post<{ message: string; trip_id: number; quote_id: number }>('/agent/trips/save/', payload);
        return response.data;
    },

    updateTripData: async (payload: {
        trip_id: number;
        trip_title?: string;
        start_date?: string;
        end_date?: string;
        destination_city?: string;
        destination_country?: string;
        destination_formatted?: string;
        destination_latitude?: number;
        destination_longitude?: number;
        to_airport?: string;
        from_airport?: string;
        currency?: string;
        ai_base_total?: number;
        flights?: Array<{
            flight_type: string;
            travel_class: string;
            price_per_seat: number;
            carrier?: string;
            flight_currency?: string;
            source?: string;
            departure_datetime?: string | null;
            departure_airport?: string;
            arrival_datetime?: string | null;
            arrival_airport?: string;
            duration?: string;
            stops?: number;
            baggage_include?: string;
            flight_number?: string;
        }>;
        hotels?: Array<{
            name: string;
            price_total: number;
            hotel_currency?: string;
            rating?: number;
            review_count?: number | null;
            star_rating?: number;
            country_code?: string;
            latitude?: number | null;
            longitude?: number | null;
            main_photo_url?: string;
            checkin_time?: string | null;
            checkout_time?: string | null;
            room_type?: any[];
            labels?: any[];
            source?: string;
        }>;
        itinerary?: {
            days: Array<{
                date: string;
                title: string;
                activities: Array<{
                    title: string;
                    description?: string;
                    itineraryactivity_cost?: number;
                    start_time?: string | null;
                    end_time?: string | null;
                    date: string;
                }>;
            }>;
        };
    }) => {
        const response = await apiClient.patch<{ message: string }>('/agent/trips/update/', payload);
        return response.data;
    },

    deleteTripData: async (tripId: number) => {
        const response = await apiClient.delete<{ message: string }>(`/agent/trips/delete/?trip_id=${tripId}`);
        return response.data;
    }
};
