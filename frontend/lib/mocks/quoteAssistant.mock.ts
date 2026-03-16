import { Quote, QuoteItem } from "@/lib/types/quotes";
import { ApiResponse } from "@/lib/types/quoteAssistant";

export const mockQuote: Quote = {
  id: "",
  clientName: "Sarah Johnson",
  destination: "Rome, Italy",
  price: "6,200",
  status: "Draft",
  version: "2.0",
  updatedAt: "2024-12-15",
  items: [],
};

export const mockFlights: QuoteItem[] = [
  {
    type: "Flight",
    title: "British Airways",
    description: "Flight: BA117",
    price: 1154.37,
  },
  {
    type: "Flight",
    title: "Duffel Airways",
    description: "Flight: ZZ2126",
    price: 1174.64,
  },
  {
    type: "Flight",
    title: "Duffel Airways",
    description: "Flight: ZZ2126",
    price: 1174.64,
  },
];

export const mockHotels: QuoteItem[] = [
  {
    type: "Hotel",
    title: "Hotel Artemide",
    description: "4-Star Hotel • Via Nazionale, Rome City Center",
    price: 900,
  },
  {
    type: "Hotel",
    title: "Hotel Indigo Rome",
    description: "5-Star Hotel • St. George, Rome",
    price: 1200,
  },
];

export const itineraryItems: QuoteItem[] = [
  {
    type: "Itinerary",
    title: "Arrive in Rome",
    description:
      "Arrive Rome: Jan 10 (afternoon/evening)\nTransfer to hotel & check-in\nEvening stroll around Piazza Navona & welcome dinner",
    price: 0,
    day: 10,
  },
  {
    type: "Itinerary",
    title: "Explore the Vatican",
    description:
      "Visit St. Peter's Basilica & the Vatican Museums\nGuided tour of the Sistine Chapel\nEvening at leisure for dinner in Trastevere",
    price: 0,
    day: 11,
  },
  {
    type: "Itinerary",
    title: "Discover Ancient Rome",
    description:
      "Tour the Colosseum and Roman Forum\nLunch near the Pantheon\nAfternoon gelato tasting at a local gelateria",
    price: 0,
    day: 12,
  },
  {
    type: "Itinerary",
    title: "Day Trip to Florence",
    description:
      "Travel by train to Florence in the morning\nVisit the Uffizi Gallery & see Michelangelo's David\nReturn to Rome for a farewell dinner",
    price: 0,
    day: 13,
  },
];

export const mockApiResponse: ApiResponse = {
  role: "assistant",
  conversational_response:
    "I found some great options for your trip to London. There are direct flights with Virgin Atlantic and a few excellent hotel choices including the W London.",
  flights: [
    {
      type: "flight",
      carrier: "Virgin Atlantic",
      source: "Mock",
      price_per_seat: 1250,
      outbound: {
        departure: "2025-05-10T10:00:00",
        departure_airport: "LHR",
        departure_terminal: "3",
        arrival: "2025-05-10T18:00:00",
        arrival_airport: "JFK",
        arrival_terminal: "4",
        duration: "PT8H",
        stops: 0,
        flight_number: "VS003",
        aircraft: "A350",
        cabin: "Economy",
        baggage_included: true,
      },
    },
    {
      type: "flight",
      carrier: "British Airways",
      source: "Mock",
      price_per_seat: 1180,
      outbound: {
        departure: "2025-05-10T14:00:00",
        departure_airport: "LHR",
        departure_terminal: "5",
        arrival: "2025-05-10T22:00:00",
        arrival_airport: "JFK",
        arrival_terminal: "7",
        duration: "PT8H",
        stops: 0,
        flight_number: "BA117",
        aircraft: "B777",
        cabin: "Economy",
        baggage_included: true,
      },
    },
  ],
  bookings: [
    {
      name: "Hotel London Allocation",
      rating: "4",
      price_total: 1500,
      source: "Bedsonline",
    },
    {
      name: "W London",
      rating: "5",
      price_total: 2200,
      source: "Direct",
    },
  ],
  packages: [],
  itinerary: null,
};

import {
  QuickActionItem,
  AICapabilityItem,
  QuoteAssistantData,
} from "@/lib/types/quoteAssistant";

export const QUICK_ACTIONS_MOCK: QuickActionItem[] = [
  {
    id: "1",
    title: "Revenue Insights",
    subtitle: "Analyze revenue trends",
    iconName: "TrendingUp",
  },
  {
    id: "2",
    title: "Client Analysis",
    subtitle: "Review client patterns",
    iconName: "Users",
  },
  {
    id: "3",
    title: "Upcoming Bookings",
    subtitle: "Check upcoming trips",
    iconName: "Calendar",
  },
  {
    id: "4",
    title: "Commission Report",
    subtitle: "View commission summary",
    iconName: "FileBarChart",
  },
];

export const AI_CAPABILITIES_MOCK: AICapabilityItem[] = [
  {
    id: "1",
    title: "Smart Insights",
    subtitle: "Get AI-powered analytics",
    iconName: "Sparkles",
  },
  {
    id: "2",
    title: "Recommendations",
    subtitle: "Personalized suggestions",
    iconName: "Lightbulb",
  },
  {
    id: "3",
    title: "Natural Conversations",
    subtitle: "Ask questions in plain English",
    iconName: "MessageSquare",
  },
  {
    id: "4",
    title: "24/7 Availability",
    subtitle: "Instant answers anytime",
    iconName: "Clock",
  },
];

export const QUOTE_ASSISTANT_DATA_MOCK: QuoteAssistantData = {
  initialMessage:
    "Hello! I'm Tara, your AI travel planning assistant. I'll help you create the perfect itinerary. Start by telling me where you'd like to travel, and I'll update the itinerary on the right as we chat!.",
  suggestions: [
    "Create a new quote for Paris",
    "Compare hotel suppliers",
    "Client booking patterns",
    "Commission summary",
  ],
};
