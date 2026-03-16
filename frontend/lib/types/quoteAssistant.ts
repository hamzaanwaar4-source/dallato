import { Client } from "@/lib/types/clients"
import { Quote } from "@/lib/types/quotes"

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: React.ReactNode
  timestamp: string
  isStreaming?: boolean
  fullText?: string
}

export interface QuoteAssistantProps {
  initialMessage: string
  suggestions: string[]
  clients: Client[]
  initialQuote?: Quote | null
}

export interface FlightSegment {
  departure: string
  departure_airport: string
  departure_terminal: string | null
  arrival: string
  arrival_airport: string
  arrival_terminal: string | null
  duration: string | number
  stops: number
  flight_number: string | number | null
  aircraft: string | null
  cabin: string | null
  baggage_included: boolean | string | null
  [key: string]: unknown
}

export interface ApiFlight {
  type: string
  carrier: string
  carrier_logo?: string | null
  price_per_seat: number | string
  source: string
  outbound: FlightSegment
  return?: FlightSegment
}

export interface ApiBooking {
  name: string
  rating: string | null
  price_total: number
  source: string
  image_url?: string
  [key: string]: unknown
}

export interface ApiPackage {
  option: string
  flight_price: number
  hotel_price: number
  meals: number
  transport: number
  total: number
}

export interface ApiTripDetails {
  destination: string
  destination_country?: string
  origin: string
  destination_airport?: string
  origin_airport?: string
  from_airport?: string
  to_airport?: string
  departure_date: string
  return_date: string
  adults?: number
}

export interface Airport {
  code: string
  name: string
  city: string
  country: string
}

export interface ApiResponse {
  role: string
  conversational_response: string
  flights: ApiFlight[]
  oneway_flights?: ApiFlight[]
  bookings: ApiBooking[]
  packages: ApiPackage[]
  itinerary: unknown[] | null 
  trip_details?: ApiTripDetails
  api_tags?: string[]
  session_id?: number
}

export interface QuickActionItem {
  id: string
  title: string
  subtitle: string
  iconName: string
}

export interface AICapabilityItem {
  id: string
  title: string
  subtitle: string
  iconName: string
}

export interface QuoteAssistantData {
  initialMessage: string
  suggestions: string[]
}

export type QuoteAssistantMessage = Message;
