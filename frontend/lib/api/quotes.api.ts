import apiClient from './apiInterceptor';
import { 
  Quote, 
  QuoteItem, 
  ApiQuoteDraftClient, 
  ApiDetailedQuoteResponse,
  ApprovedQuote,
  ApiApprovedQuote,
  ApiApprovedQuotesResponse,
  ApiRawQuote,
  ApiRawQuoteItem,
  ApiAgencyQuote,
  ApiAgencyQuoteDetail,
  ApiPendingQuote,
  ApiManagedBooking,
  ApiAgentQuoteDetail,
  QuoteStatus,
  UpdateQuoteStatusRequest,
  UpdateQuoteStatusResponse
} from '@/lib/types/quotes';
import { Quote as BookingQuote, QuoteStatus as BookingQuoteStatus } from '@/lib/types/bookings-quotes';
import { Client, ClientQuote } from '@/lib/types/clients';

/**
 * Adapts API Quote Draft Client to UI Client type
 */
export const adaptApiQuoteDraftClientToUI = (apiClient: ApiQuoteDraftClient): Client => {
  return {
    id: apiClient.id.toString(),
    name: apiClient.name,
    email: apiClient.email,
    phone: '',
    location: apiClient.destination || '',
    initials: apiClient.name.split(' ').map(n => n[0]).join('').toUpperCase(),
    color: 'bg-blue-500', // Default color
    tags: [],
    notes: '',
    trips: [],
    quotes: apiClient.quotes.map(q => ({
      id: q.id.toString(),
      quoteId: q.id.toString(),
      destination: apiClient.destination || 'Unknown Destination',
      date: new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: (q.status ? (q.status.charAt(0).toUpperCase() + q.status.slice(1)) : 'Draft') as any,
      price: 'Pending', // Price is not in the draft list
      version: `v${q.version}`,
      travelers: q.traveler_count || 1,
      validUntil: '',
      duration: ''
    })),
    joinedDate: new Date(apiClient.created_at).toLocaleDateString(),
    totalSpent: '0',
    status: 'Active',
    lastContact: '',
    clientType: 'Individual',
    isFavorite: false,
    budgetRange: '',
    travelStyle: '',
    interests: [],
    loyaltyPrograms: [],
    importantDates: [],
    recentActivity: [],
    upcomingTripsCount: 0,
    pastTripsCount: 0,
    groupMembers: []
  };
};

/**
 * Adapts API Detailed Quote to UI Quote type
 */
export const adaptApiDetailedQuoteToUI = (apiResponse: ApiDetailedQuoteResponse): Quote => {
  const { quote, client, flights, hotels, activities } = apiResponse;
  
  const items: QuoteItem[] = [
    ...flights.map(f => ({
      type: 'Flight' as const,
      title: f.title,
      description: f.description,
      price: parseFloat(f.total_price),
      id: f.id.toString(),
      metadata: {
        carrier_logo: f.carrier_logo
      }
    })),
    ...hotels.map(h => ({
      type: 'Hotel' as const,
      title: h.title,
      description: h.description,
      price: parseFloat(h.total_price),
      id: h.id.toString()
    })),
    ...activities.map(a => ({
      type: 'Tour' as const, // Mapping activity to Tour for UI
      title: a.title,
      description: a.description,
      price: parseFloat(a.total_price),
      day: a.day || 1,
      id: a.id.toString()
    }))
  ];

  return {
    id: quote.id.toString(),
    clientName: client?.name || quote.clientName|| 'Guest',
    destination: quote.destination || client?.destination || 'Trip Quote',
    price: `$${parseFloat(quote.grand_total || quote.base_total).toLocaleString()}`,
    status: (quote.status ? (quote.status.charAt(0).toUpperCase() + quote.status.slice(1)) : 'Draft') as Quote['status'],
    version: `v${quote.version_number}`,
    updatedAt: new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    startDate: quote.start_date || (apiResponse.itinerary_days.length > 0 ? apiResponse.itinerary_days[0].date || undefined : undefined),
    endDate: quote.end_date || (apiResponse.itinerary_days.length > 0 ? apiResponse.itinerary_days[apiResponse.itinerary_days.length - 1].date || undefined : undefined),
    travelerCount: quote.traveler_count || 1,
    fromAirport: quote.from_airport || undefined,
    toAirport: quote.to_airport || undefined,
    tripId: quote.trip_id.toString(),
    itineraryId: apiResponse.itinerary_id?.toString(),
    items,
    itineraryDays: apiResponse.itinerary_days.map(day => ({
      id: day.id?.toString(),
      day: day.day,
      date: day.date,
      title: day.title,
      activities: day.activities.map(act => {
        // Find the matching activity in the top-level activities array to get the price
        const matchingActivity = activities.find(a => a.title === act.title);
        return {
          id: act.id?.toString(),
          title: act.title,
          description: act.description,
          start_time: act.start_time,
          end_time: act.end_time,
          location: act.location,
          price: matchingActivity ? parseFloat(matchingActivity.total_price) : undefined
        };
      })
    }))
  };
};

/**
 * Adapts API Approved Quote to UI ApprovedQuote type
 */
export const adaptApiApprovedQuoteToUI = (apiItem: ApiApprovedQuote): ApprovedQuote => {
  const { quote, client } = apiItem;
  return {
    id: quote.id.toString(),
    quoteId: `Q-${quote.id}`,
    clientId: client.id.toString(),
    clientName: client.name,
    destination: quote.destination || 'Unknown',
    price: `${quote.currency} ${parseFloat(quote.grand_total).toLocaleString()}`,
    status: (quote.status || 'Approved') as ApprovedQuote['status'],
    date: new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    version: `v${quote.version_number}`
  };
};

/**
 * Adapts API Raw Quote to UI Quote type
 */
export const adaptApiRawQuoteToUI = (apiQuote: ApiRawQuote): Quote => {
  const items: QuoteItem[] = apiQuote.items.map(item => {
    let type: QuoteItem['type'] = 'Other' as any;
    if (item.item_type === 'FLIGHT') type = 'Flight';
    else if (item.item_type === 'HOTEL') type = 'Hotel';
    else if (item.item_type === 'ACTIVITY') type = 'Tour';
    else if (item.item_type === 'TRANSFER') type = 'Transfer';
    else if (item.item_type === 'INSURANCE') type = 'Insurance';

    return {
      id: item.id.toString(),
      type,
      title: item.title,
      description: item.description,
      price: parseFloat(item.total_price),
      day: item.day || undefined,
      metadata: item.raw_data,
      check_in: item.check_in || undefined,
      check_out: item.check_out || undefined
    };
  });

  // Extract start and end dates from items
  const allDates: Date[] = [];
  apiQuote.items.forEach(item => {
    if (item.check_in) allDates.push(new Date(item.check_in));
    if (item.check_out) allDates.push(new Date(item.check_out));
    
    // Also check raw_data for flights
    if (item.item_type === 'FLIGHT' && item.raw_data) {
      if (item.raw_data.departure) allDates.push(new Date(item.raw_data.departure));
      if (item.raw_data.arrival) allDates.push(new Date(item.raw_data.arrival));
    }
  });

  const startDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))).toISOString() : undefined;
  const endDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString() : undefined;

  return {
    id: apiQuote.id.toString(),
    clientName: 'Client', // Not in raw quote response
    destination: 'Trip Quote', // Not in raw quote response
    price: `$${parseFloat(apiQuote.grand_total).toLocaleString()}`,
    status: 'Approved', // Default
    version: `v${apiQuote.version_number}`,
    updatedAt: new Date(apiQuote.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    startDate,
    endDate,
    items
  };
};

/**
 * Adapts ApiAgencyQuote to UI BookingQuote type
 */
export const adaptApiAgencyQuoteToUI = (apiQuote: ApiAgencyQuote): BookingQuote => {
  // Map API status to BookingQuoteStatus
  let status: BookingQuoteStatus = apiQuote.status as any;
  if (apiQuote.status === 'QUOTE_SENT') status = 'QUOTE_SENT';
  else if (apiQuote.status === 'CONFIRMED' || apiQuote.status === 'ACCEPTED') status = 'ACCEPTED';
  else if (apiQuote.status === 'DECLINED') status = 'DECLINED';
  else if (apiQuote.status === 'VIEWED') status = 'VIEWED';
  else if (apiQuote.status === 'INITIAL_CONTACT') status = 'INITIAL_CONTACT';
  else if (apiQuote.status === 'IN_NEGOTIATION') status = 'IN_NEGOTIATION';
  else if (apiQuote.status === 'DRAFT') status = 'DRAFT';

  return {
    id: apiQuote.id.toString(),
    quoteNumber: apiQuote.quote_number,
    clientName: apiQuote.client_name,
    destination: apiQuote.destination,
    value: `$${parseFloat(apiQuote.quote_value).toLocaleString()}`,
    status,
    expiry: `${apiQuote.days_left} days left`,
    agentName: 'Agent', // Not in this API response
    travelDates: '', // Not in this API response
    activityTimeline: [] // Not in this API response
  };
};

/**
 * Adapts ApiAgencyQuoteDetail to UI BookingQuote type
 */
export const adaptApiAgencyQuoteDetailToUI = (apiQuote: ApiAgencyQuoteDetail): BookingQuote => {
  // Map API status to BookingQuoteStatus
  let status: BookingQuoteStatus = apiQuote.status as any;
  if (apiQuote.status === 'QUOTE_SENT') status = 'QUOTE_SENT';
  else if (apiQuote.status === 'CONFIRMED' || apiQuote.status === 'ACCEPTED') status = 'ACCEPTED';
  else if (apiQuote.status === 'DECLINED') status = 'DECLINED';
  else if (apiQuote.status === 'VIEWED') status = 'VIEWED';
  else if (apiQuote.status === 'INITIAL_CONTACT') status = 'INITIAL_CONTACT';
  else if (apiQuote.status === 'IN_NEGOTIATION') status = 'IN_NEGOTIATION';
  else if (apiQuote.status === 'DRAFT') status = 'DRAFT';

  return {
    id: apiQuote.id.toString(),
    quoteNumber: apiQuote.quote_number,
    clientName: apiQuote.client_name,
    destination: apiQuote.destination,
    value: `${apiQuote.currency} ${parseFloat(apiQuote.quote_value).toLocaleString()}`,
    status,
    expiry: apiQuote.expiry,
    agentName: apiQuote.agent_name,
    travelDates: apiQuote.travel_dates,
    activityTimeline: apiQuote.quote_activity_timeline.map(item => ({
      id: item.step_number.toString(),
      action: item.title,
      time: new Date(item.timestamp).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      user: '', // User info is usually in description
      status: 1, // All in timeline are completed
      description: item.description
    })),
    flights: apiQuote.flights,
    hotels: apiQuote.hotels,
    tripTitle: apiQuote.trip_title,
    clientEmail: apiQuote.client_email,
    agentEmail: apiQuote.agent_email,
    versionNumber: apiQuote.version_number,
    currency: apiQuote.currency
  };
};

/**
 * Adapts API Pending Quotes to UI Client type
 * Groups quotes by client_id and creates a Client object for each unique client
 */
export const adaptApiPendingQuotesToUI = (apiQuotes: ApiPendingQuote[]): Client[] => {
  // Group quotes by client_id
  const clientsMap = new Map<number, ApiPendingQuote[]>();
  
  apiQuotes.forEach(quote => {
    if (!clientsMap.has(quote.client_id)) {
      clientsMap.set(quote.client_id, []);
    }
    clientsMap.get(quote.client_id)!.push(quote);
  });

  // Convert to Client array
  return Array.from(clientsMap.entries()).map(([clientId, quotes]) => {
    const firstQuote = quotes[0];
    
    return {
      id: clientId.toString(),
      name: firstQuote.client_name,
      email: '', // Not provided in pending quotes response
      phone: '',
      location: firstQuote.destination || '',
      initials: firstQuote.client_name.split(' ').map(n => n[0]).join('').toUpperCase(),
      color: 'bg-blue-500',
      tags: [],
      notes: '',
      trips: [],
      quotes: quotes.map(q => ({
        id: q.quote_id.toString(),
        quoteId: q.quote_number,
        destination: q.destination || 'Unknown Destination',
        date: new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: (q.status ? (q.status.charAt(0).toUpperCase() + q.status.slice(1)) : 'Pending') as any,
        price: 'Pending',
        version: `v${q.version_number}`,
        travelers: 1,
        validUntil: '',
        duration: ''
      })),
      joinedDate: new Date(firstQuote.created_at).toLocaleDateString(),
      totalSpent: '0',
      status: 'Active',
      lastContact: '',
      clientType: 'Individual',
      isFavorite: false,
      budgetRange: '',
      travelStyle: '',
      interests: [],
      loyaltyPrograms: [],
      importantDates: [],
      recentActivity: [],
      upcomingTripsCount: 0,
      pastTripsCount: 0,
      groupMembers: []
    };
  });
};

/**
 * Adapts API Managed Booking to UI ApprovedQuote type
 */
export const adaptApiManagedBookingToUI = (apiBooking: ApiManagedBooking): ApprovedQuote => {
  return {
    id: apiBooking.quote_id.toString(),
    quoteId: apiBooking.quote_number,
    clientId: apiBooking.client_id.toString(),
    clientName: apiBooking.client_name,
    destination: apiBooking.destination,
    price: `$${parseFloat(apiBooking.price).toLocaleString()}`,
    status: (apiBooking.status.charAt(0).toUpperCase() + apiBooking.status.slice(1)) as ApprovedQuote['status'],
    date: new Date(apiBooking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    version: 'v1' // Not provided in the response, using default
  };
};

/**
 * Adapts API Agent Quote Detail to UI Quote type
 */
export const adaptApiAgentQuoteDetailToQuote = (apiResponse: ApiAgentQuoteDetail): Quote => {
  // Map flights to QuoteItems
  const flightItems: QuoteItem[] = apiResponse.flights.map(flight => {
    const description = `${flight.flight_type} - ${flight.departure_airport} → ${flight.arrival_airport}`;
    
    return {
      id: flight.id.toString(),
      type: 'Flight' as const,
      title: flight.carrier,
      description: description,
      price: flight.price_per_seat,
      quantity: 1,
      metadata: {
        flight_type: flight.flight_type,
        travel_class: flight.travel_class,
        carrier: flight.carrier,
        flight_number: flight.flight_number,
        departure_datetime: flight.departure_datetime,
        departure_airport: flight.departure_airport,
        arrival_datetime: flight.arrival_datetime,
        arrival_airport: flight.arrival_airport,
        duration: flight.duration,
        stops: flight.stops,
        baggage_include: flight.baggage_include,
        source: flight.source,
        carrier_logo: flight.carrier_logo,
        outbound: flight.flight_type === 'OUTBOUND' ? {
          from_airport: flight.departure_airport,
          to_airport: flight.arrival_airport,
          departure: flight.departure_datetime,
          arrival: flight.arrival_datetime,
          duration: flight.duration,
          stops: flight.stops
        } : undefined,
        return: flight.flight_type === 'RETURN' ? {
          from_airport: flight.departure_airport,
          to_airport: flight.arrival_airport,
          departure: flight.departure_datetime,
          arrival: flight.arrival_datetime,
          duration: flight.duration,
          stops: flight.stops
        } : undefined
      }
    };
  });

  // Map hotels to QuoteItems
  const hotelItems: QuoteItem[] = apiResponse.hotels.map(hotel => ({
    id: hotel.id.toString(),
    type: 'Hotel' as const,
    title: hotel.name,
    description: hotel.source,
    price: hotel.price_total,
    quantity: 1,
    metadata: {
      name: hotel.name,
      rating: hotel.rating,
      review_count: hotel.review_count,
      star_rating: hotel.star_rating,
      country_code: hotel.country_code,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      main_photo_url: hotel.main_photo_url,
      checkin_time: hotel.checkin_time,
      checkout_time: hotel.checkout_time,
      room_type: hotel.room_type,
      labels: hotel.labels,
      source: hotel.source
    }
  }));

  // Map itinerary days
  const itineraryDays = apiResponse.itinerary?.days.map((day, index) => ({
    id: day.id.toString(),
    day: `Day ${index + 1}`,
    date: day.date,
    title: day.title,
    activities: day.activities.map(activity => ({
      id: activity.id.toString(),
      title: activity.title,
      description: activity.description,
      start_time: activity.start_time,
      end_time: activity.end_time,
      location: null,
      price: activity.cost
    }))
  })) || [];

  // Map itinerary activities to QuoteItems for the items array
  const itineraryItems: QuoteItem[] = [];
  apiResponse.itinerary?.days.forEach((day, dayIndex) => {
    day.activities.forEach(activity => {
      itineraryItems.push({
        id: activity.id.toString(),
        type: 'Itinerary' as const,
        title: activity.title,
        description: activity.description,
        price: activity.cost,
        quantity: 1,
        day: dayIndex + 1,
        metadata: {
          start_time: activity.start_time,
          end_time: activity.end_time,
          date: day.date
        }
      });
    });
  });

  // Combine all items (flights, hotels, and itinerary)
  const items: QuoteItem[] = [...flightItems, ...hotelItems, ...itineraryItems];

  // Map status using the helper function
  const status = mapStatusToFrontend(apiResponse.status);

  return {
    id: apiResponse.quote_id.toString(),
    clientName: apiResponse.traveler.full_name,
    destination: `${apiResponse.trip.destination_city}, ${apiResponse.trip.destination_country}`,
    price: `${apiResponse.currency} ${(apiResponse.price_summary.total_price || apiResponse.price_summary.total_amount || 0).toLocaleString()}`,
    status,
    version: `v${apiResponse.version_number}`,
    updatedAt: new Date(apiResponse.updated_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    startDate: apiResponse.trip.start_date,
    endDate: apiResponse.trip.end_date,
    travelerCount: apiResponse.traveler.travelers_count || 1,
    familyMembersCount: apiResponse.traveler.family_members_count || 0,
    fromAirport: apiResponse.trip.from_airport,
    toAirport: apiResponse.trip.to_airport,
    tripId: apiResponse.trip.id.toString(),
    itineraryId: apiResponse.itinerary?.id.toString(),
    sessionId: apiResponse.session_id,
    items,
    itineraryDays,
    priceSummary: {
      flightsTotal: apiResponse.price_summary.flights_total,
      hotelsTotal: apiResponse.price_summary.hotels_total,
      baseTotal: apiResponse.price_summary.ai_base_total,
      agentCommission: apiResponse.price_summary.agent_commission_amount,
      agentCommissionPercent: apiResponse.price_summary.agent_commission_percent,
      agencyCommission: apiResponse.price_summary.agency_commission_amount,
      agencyCommissionPercent: apiResponse.price_summary.agency_commission_percent,
      totalAmount: apiResponse.price_summary.total_price
    }
  };
};

/**
 * Fetches all clients with their quote drafts
 */
export const getQuotesDrafts = async (): Promise<Client[]> => {
  const response = await apiClient.get<ApiQuoteDraftClient[]>('/clients/quotes-drafts/');
  return response.data.map(adaptApiQuoteDraftClientToUI);
};

/**
 * Fetches detailed information for a specific quote
 */
export const getDetailedQuote = async (quoteId: string): Promise<Quote> => {
  const response = await apiClient.get<ApiAgentQuoteDetail>(`/agent/quotes/detail/?quote_id=${quoteId}`);
  return adaptApiAgentQuoteDetailToQuote(response.data);
};

/**
 * Approves a specific quote
 */
export const approveQuote = async (quoteId: string): Promise<any> => {
  const response = await apiClient.post(`/trips/quotes/${quoteId}/approve/`);
  return response.data;
};

/**
 * Fetches a specific quote by ID (uses agent quote detail endpoint)
 */
export const getQuoteById = async (quoteId: string): Promise<Quote> => {
  const response = await apiClient.get<ApiAgentQuoteDetail>(`/agent/quotes/detail/?quote_id=${quoteId}`);
  return adaptApiAgentQuoteDetailToQuote(response.data);
};

export const getApprovedQuotes = async (): Promise<ApprovedQuote[]> => {
  const response = await apiClient.get<ApiApprovedQuotesResponse>('/clients/quotes-approved/');
  return response.data.results.map(adaptApiApprovedQuoteToUI);
};

/**
 * Creates a deal for a specific client and quote
 */
export const createDeal = async (clientId: string, quoteId: string): Promise<any> => {
  const response = await apiClient.post('/clients/deals/', {
    client: clientId,
    quote: quoteId,
    status: 'WON' // Marking as WON when booked
  });
  return response.data;
};

export const deleteQuote = async (quoteId: string): Promise<void> => {
  await apiClient.delete(`/trips/quotes/${quoteId}/`);
};

/**
 * Updates a specific quote
 */
export const updateQuote = async (quoteId: string, data: any): Promise<Quote> => {
  const response = await apiClient.patch<ApiRawQuote>(`/trips/quotes/${quoteId}/`, data);
  return adaptApiRawQuoteToUI(response.data);
};

/**
 * Updates a specific trip (including nested quote and itinerary)
 */
export const updateTrip = async (tripId: string, data: any): Promise<any> => {
  const response = await apiClient.patch(`/trips/${tripId}/update/`, data);
  return response.data;
};

/**
 * Fetches quotes for the current agency
 */
export const getAgencyQuotes = async (): Promise<BookingQuote[]> => {
  const response = await apiClient.get<ApiAgencyQuote[]>('/agency/quotes/list/');
  return response.data.map(adaptApiAgencyQuoteToUI);
};

/**
 * Fetches detailed information for an agency quote
 */
export const getAgencyQuoteDetail = async (quoteId: string): Promise<BookingQuote> => {
  const response = await apiClient.get<ApiAgencyQuoteDetail>(`/agency/quotes/detail/?quote_id=${quoteId}`);
  return adaptApiAgencyQuoteDetailToUI(response.data);
};

/**
 * Fetches pending quotes for the current agent
 */
export const getPendingQuotes = async (): Promise<Client[]> => {
  const response = await apiClient.get<ApiPendingQuote[]>('/agent/quotes/pending/');
  return adaptApiPendingQuotesToUI(response.data);
};

/**
 * Fetches managed bookings for the current agent
 */
export const getManagedBookings = async (): Promise<ApprovedQuote[]> => {
  const response = await apiClient.get<ApiManagedBooking[]>('/agent/bookings/managed/');
  return response.data.map(adaptApiManagedBookingToUI);
};

/**
 * Converts frontend QuoteStatus to backend status format
 */
export const mapStatusToBackend = (status: QuoteStatus): UpdateQuoteStatusRequest['status'] => {
  const statusMap: Record<QuoteStatus, UpdateQuoteStatusRequest['status']> = {
    'Draft': 'DRAFT',
    'Initial Contact': 'INITIAL_CONTACT',
    'Quote Sent': 'QUOTE_SENT',
    'In Negotiation': 'IN_NEGOTIATION',
    'Confirmed': 'CONFIRMED',
    'Removed': 'REMOVED',
    'Approved': 'CONFIRMED',
    'Booked': 'CONFIRMED'
  };
  return statusMap[status];
};

/**
 * Converts backend status format to frontend QuoteStatus
 */
export const mapStatusToFrontend = (status: string): QuoteStatus => {
  const statusMap: Record<string, QuoteStatus> = {
    'DRAFT': 'Draft',
    'INITIAL_CONTACT': 'Initial Contact',
    'QUOTE_SENT': 'Quote Sent',
    'IN_NEGOTIATION': 'In Negotiation',
    'CONFIRMED': 'Confirmed',
    'REMOVED': 'Removed',
    'APPROVED': 'Approved',
    'BOOKED': 'Booked',

  };
  return statusMap[status] || 'Draft';
};

/**
 * Updates the status of a quote
 */
export const updateQuoteStatus = async (
  quoteId: number, 
  status: UpdateQuoteStatusRequest['status']
): Promise<UpdateQuoteStatusResponse> => {
  const response = await apiClient.patch<UpdateQuoteStatusResponse>(
    '/agent/quotes/update-status/',
    {
      quote_id: quoteId,
      status
    }
  );
  return response.data;
};

/**
 * Quotes API object for consistent access
 */
export const quotesApi = {
  getQuotesDrafts,
  getDetailedQuote,
  approveQuote,
  getQuoteById,
  getApprovedQuotes,
  createDeal,
  deleteQuote,
  updateQuote,
  updateTrip,
  getAgencyQuotes,
  getAgencyQuoteDetail,
  getPendingQuotes,
  getManagedBookings,
  updateQuoteStatus,
  mapStatusToBackend,
  mapStatusToFrontend
};

// Legacy support if needed, but we should move to the new ones
export const getQuotes = async (): Promise<Quote[]> => {
    return []; // No longer used in the new flow
};

export { getQuotesData, getSuppliers, getRecommendations } from './quotes.api.mock';
