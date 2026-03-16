import apiClient, { simulateApiCall } from "./apiInterceptor";
import {
  QuickActionItem,
  AICapabilityItem,
  QuoteAssistantData,
  ApiResponse,
  ApiTripDetails,
  ApiFlight,
  ApiBooking,
} from "@/lib/types/quoteAssistant";

export const getQuickActions = () => Promise.resolve([] as QuickActionItem[]);
export const getAICapabilities = () => Promise.resolve([] as AICapabilityItem[]);
export const getQuoteAssistantData = () => Promise.resolve({} as QuoteAssistantData);

export async function fetchPlan(
  message: string,
  sessionId?: number | null,
): Promise<ApiResponse> {
  const requestBody: Record<string, unknown> = { message };
  if (sessionId) {
    requestBody.session_id = sessionId;
  }

  const response = await apiClient.post<ApiResponse>("/plan/", requestBody);
  return response.data;
}

export async function fetchFlights(
  requestBody: Record<string, unknown>,
): Promise<{ flights: ApiFlight[]; oneway_flights?: ApiFlight[] }> {
  const response = await apiClient.post<{
    flights: ApiFlight[];
    oneway_flights?: ApiFlight[];
  }>("/flights/", requestBody);
  return response.data;
}

export async function fetchHotels(
  requestBody: Record<string, unknown>,
): Promise<{ bookings: ApiBooking[] }> {
  const response = await apiClient.post<{ bookings: ApiBooking[] }>(
    "/hotels/",
    requestBody,
  );
  return response.data;
}

export async function fetchItinerary(
  requestBody: Record<string, unknown>,
): Promise<{ itinerary: any }> {
  // Assuming /itinerary/ endpoint based on pattern, as it was missing in collection
  const response = await apiClient.post<{ itinerary: any }>(
    "/itinerary/",
    requestBody,
  );
  return response.data;
}

export async function fetchTravelInsights(requestBody: {
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
}): Promise<any> {
  const response = await apiClient.post("/travel-insights/", requestBody, {
    _suppressToast: true,
  });
  return response.data;
}

// NEW: Fetch chat history for a session
export async function fetchChatHistory(sessionId: number): Promise<any> {
  const response = await apiClient.get(
    `/chat-history/?session_id=${sessionId}`,
  );
  return response.data;
}
