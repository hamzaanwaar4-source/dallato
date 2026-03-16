"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { clientsApi, adaptClientToUI } from "@/lib/api/clients.api";
import {
  Send,
  Sparkles,
  Paperclip,
  Plus,
  ChevronDown,
  Search,
  FileText,
  User,
  LayoutTemplate,
  X,
  Info,
  Plane,
  Hotel,
  Save,
  Mic,
  MicOff,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import {
  QuoteAssistantProps,
  Message,
  ApiTripDetails,
  ApiFlight,
  ApiBooking,
} from "@/lib/types/quoteAssistant";
import { Quote, QuoteItem } from "@/lib/types/quotes";
import { Client } from "@/lib/types/clients";
// // import { mockQuote } from "@/lib/mocks/quoteAssistant.mock";
import {
  fetchPlan,
  fetchFlights,
  fetchHotels,
  fetchItinerary,
  fetchChatHistory,
} from "@/lib/api/quoteAssistant.api";
import { tripsApi } from "@/lib/api/trips.api";
import { authStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { PreviewPanel } from "./preview-panel";
import { EnhanceTripPanel } from "./enhance-trip-panel";
import { FlightSearchModal } from "./flight-search-modal";
import { HotelSearchModal } from "./hotel-search-modal";
import { useVoiceTranscription } from "@/hooks/use-voice-transcription";
import { AddClientModal } from "../clients/add-client-modal";
import QuoteAssitant from "@/app/assets/quotes/ShallowSeek.png";

// Smooth streaming typewriter component
const StreamingText = ({
  text,
  onComplete,
  onUpdate,
}: {
  text: string;
  onComplete?: () => void;
  onUpdate?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
        onUpdate?.();
      }, 5); // Adjust speed here (lower = faster)

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete, onUpdate]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};


export const emptyQuote: Quote = {
  id: "",
  clientName: "",
  destination: "",
  price: "0",
  status: "Draft",
  version: "1.0",
  updatedAt: new Date().toISOString(),
  items: [],
};

export function QuoteAssistant({
  initialMessage,
  suggestions,
  clients,
  initialQuote,
}: QuoteAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: (
        <div className="space-y-4">
          <p className="whitespace-pre-line">{initialMessage}</p>
        </div>
      ),
      timestamp: "Just now",
      isStreaming: false,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientList, setClientList] = useState<Client[]>(clients);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const filteredClientList = useMemo(() => {
    if (!clientSearchTerm.trim()) return clientList;
    const term = clientSearchTerm.toLowerCase().trim();
    return clientList.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term),
    );
  }, [clientList, clientSearchTerm]);

  useEffect(() => {
    const fetchClients = async () => {
      // Always fetch if list is empty, otherwise rely on manual refresh or component mount
      if (clientList.length === 0) {
        setIsLoadingClients(true);
        try {
          const apiClients = await clientsApi.getClients();
          const uiClients = apiClients.map(adaptClientToUI);
          setClientList(uiClients);
        } catch (error) {
          console.error("Failed to fetch clients", error);
        } finally {
          setIsLoadingClients(false);
        }
      }
    };
    fetchClients();
  }, [clientList.length]);

  const handleClientAdded = async () => {
    setIsLoadingClients(true);
    try {
      const apiClients = await clientsApi.getClients();
      const uiClients = apiClients.map(adaptClientToUI);
      setClientList(uiClients);
      
      // Auto-select the newest client (assuming the API returns it or we can find it)
      // Since we don't know the exact ID of the new client from here easily without API change,
      // we'll try to find the client that wasn't in the previous list, or just the last one if sorting allows.
      // For now, let's assume the API returns clients sorted by newest first or we can't easily know.
      // A better approach would be if AddClientModal returned the new client, but it currently just calls a callback.
      // We will try to find a client that is in the new list but not the old list.
      
      const newClient = uiClients.find(c => !clientList.some(old => old.id === c.id));
      if (newClient) {
        setSelectedClient(newClient);
        setCurrentTripId(null);
        setClientSearchTerm("");
        // toast.success(`Client ${newClient.name} selected`);
      } else {
        toast.success("Client list updated");
      }
    } catch (error) {
      console.error("Failed to refresh clients", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // ADD THIS STATE
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [shouldLoadHistory, setShouldLoadHistory] = useState(false);

  // Preview Panel State
  const [previewQuote, setPreviewQuote] = useState<Quote>(emptyQuote);

  // Modal State
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);

  // Mobile View State
  const [mobileView, setMobileView] = useState<"chat" | "preview" | "enhance">(
    "chat",
  );

  // API Results State
  const [apiFlights, setApiFlights] = useState<QuoteItem[]>([]);
  const [apiHotels, setApiHotels] = useState<QuoteItem[]>([]);
  const [apiItinerary, setApiItinerary] = useState<QuoteItem[]>([]);
  const [tripDetails, setTripDetails] = useState<ApiTripDetails | null>(null);
  const [apiTags, setApiTags] = useState<string[]>([]);
  const [isSearchingFlights, setIsSearchingFlights] = useState(false);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState("overview");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [showMicPopup, setShowMicPopup] = useState(false);
  const [micTranscript, setMicTranscript] = useState("");

  // Voice Transcription Hook
  const { isRecording, isReady, startRecording, stopRecording } = useVoiceTranscription(
    (transcript, isFinal) => {
      if (isFinal) {
        setMicTranscript((prev) => {
          const newText = prev.trim() ? `${prev} ${transcript}` : transcript;
          return newText;
        });
        setPartialTranscript("");
      } else {
        setPartialTranscript(transcript);
      }
    },
  );

  // Refs to avoid stale closures in message handlers
  const apiItineraryRef = useRef<QuoteItem[]>([]);
  const tripDetailsRef = useRef<ApiTripDetails | null>(null);

  // Keep refs in sync with state for use in handlers
  useEffect(() => {
    apiItineraryRef.current = apiItinerary;
  }, [apiItinerary]);

  useEffect(() => {
    tripDetailsRef.current = tripDetails;
  }, [tripDetails]);

  // Auto-scroll ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // NEW: Load initial quote data if provided
  useEffect(() => {
    if (initialQuote) {
      // 1. Set preview quote with existing items
      setPreviewQuote(initialQuote);

      // 2. Reconstruct trip details from quote
      const flights = initialQuote.items.filter(
        (item) => item.type === "Flight",
      );
      const flightMeta = flights[0]?.metadata as any;

      const reconstructedTripDetails: ApiTripDetails = {
        destination:
          initialQuote.destination && initialQuote.destination !== "Trip Quote"
            ? initialQuote.destination
            : initialQuote.toAirport || "",
        origin:
          initialQuote.fromAirport || flightMeta?.outbound?.from_airport || "",
        origin_airport:
          initialQuote.fromAirport ||
          flightMeta?.outbound?.departure_airport ||
          "",
        destination_airport:
          initialQuote.toAirport || flightMeta?.outbound?.arrival_airport || "",
        departure_date: initialQuote.startDate || "",
        return_date: initialQuote.endDate || "",
        adults: initialQuote.travelerCount || 2,
        from_airport: initialQuote.fromAirport || "",
        to_airport: initialQuote.toAirport || "",
      };

      setTripDetails(reconstructedTripDetails);
      tripDetailsRef.current = reconstructedTripDetails;

      // 3. Set current trip ID if available
      if (initialQuote.tripId) {
        setCurrentTripId(parseInt(initialQuote.tripId));
      }

      // 4. Set session ID if available
      if (initialQuote.sessionId) {
        setSessionId(initialQuote.sessionId);
        setShouldLoadHistory(true);
      } else {
        setSessionId(null);
        setShouldLoadHistory(false);
      }

      // 5. Switch to preview tab for immediate visibility
      setMobileView("preview");
      setPreviewTab("overview");

      toast.success(
        "Quote loaded successfully! You can continue editing with AI.",
      );
    }
  }, [initialQuote]);

  // Auto-select client if initialQuote has a clientId
  useEffect(() => {
    if (initialQuote && initialQuote.clientName && !selectedClient) {
      // Try to find client by name (since we only have clientName from the quote)
      const matchingClient = clientList.find(
        (client) =>
          client.name.toLowerCase() === initialQuote.clientName.toLowerCase(),
      );
      if (matchingClient) {
        setSelectedClient(matchingClient);
      }
    }
  }, [initialQuote, clientList, selectedClient]);

  const handleAddToQuote = (items?: QuoteItem[]) => {
    const itemsToAdd = items || apiItineraryRef.current;

    setPreviewQuote((prev) => ({
      ...prev,
      items: [
        ...prev.items.filter((i) => i.type !== "Itinerary"),
        ...itemsToAdd,
      ],
    }));

    // Switch to itinerary tab for immediate feedback
    setPreviewTab("itinerary");
    toast.success(`${itemsToAdd.length} itinerary items added to quote`);
  };

  const handleSaveQuote = async (quoteToSave: Quote) => {
    if (!selectedClient) {
      toast.error("Please select a client first");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving trip and quote...");

    const cleanPrice = (price: string | number): number => {
      if (!price) return 0;
      const numericValue =
        typeof price === "number"
          ? price
          : parseFloat(price.toString().replace(/[^0-9.]/g, ""));
      if (isNaN(numericValue)) return 0;
      // Limit to 2 decimal places and max 10 digits total (8 before decimal, 2 after)
      return Math.min(parseFloat(numericValue.toFixed(2)), 99999999.99);
    };

    const cleanCoordinate = (
      coord: string | number,
      maxDigits: number,
    ): string => {
      if (!coord) return "";
      const numericValue =
        typeof coord === "number" ? coord : parseFloat(coord.toString());
      if (isNaN(numericValue)) return "";
      // Limit decimal places based on max digits (e.g., 10 digits = 7 before + 3 after decimal)
      const decimalPlaces = maxDigits === 10 ? 6 : 7;
      return parseFloat(numericValue.toFixed(decimalPlaces)).toString();
    };

    const formatTime = (time: string | null | undefined): string | null => {
      if (!time || time === "") return null;
      // If already in HH:MM:SS format, return as is
      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
      // If in HH:MM format, add :00
      if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
      // Otherwise return null
      return null;
    };

    try {


      // 1. Transform Flights
      const flights: any[] = [];
      quoteToSave.items
        .filter((item) => item.type === "Flight")
        .forEach((item) => {
          const metadata = item.metadata as any;

          // Outbound flight
          if (metadata?.outbound) {
            flights.push({
              flight_type: "OUTBOUND",
              travel_class:
                metadata.travel_class ||
                metadata.outbound.travel_class ||
                "ECONOMY",
              price_per_seat: cleanPrice(item.price),
              carrier: metadata.carrier || "",
              flight_currency: metadata.currency || "USD",
              departure_airport:
                metadata.outbound.departure_airport ||
                metadata.from_airport ||
                "",
              arrival_airport:
                metadata.outbound.arrival_airport || metadata.to_airport || "",
              flight_number:
                metadata.outbound.flight_number || metadata.flight_number || "",
              stops: metadata.outbound.stops ?? 0,
              departure_datetime: metadata.outbound.departure || "",
              arrival_datetime: metadata.outbound.arrival || "",
              duration: metadata.outbound.duration || "",
              baggage_include:
                metadata.outbound.baggage_include ||
                metadata.baggage_include ||
                "",
              carrier_logo:
                metadata.carrier_logo || metadata.outbound.carrier_logo || "",
              source: metadata.source || "Duffel",
            });
          }

          // Return flight
          if (metadata?.return) {
            flights.push({
              flight_type: "RETURN",
              travel_class:
                metadata.travel_class ||
                metadata.return.travel_class ||
                "ECONOMY",
              price_per_seat: metadata?.return_price !== undefined ? cleanPrice(metadata.return_price) : (metadata?.outbound ? 0 : cleanPrice(item.price)),
              carrier: metadata.carrier || "",
              flight_currency: metadata.currency || "USD",
              departure_airport:
                metadata.return.departure_airport || metadata.to_airport || "",
              arrival_airport:
                metadata.return.arrival_airport || metadata.from_airport || "",
              flight_number:
                metadata.return.flight_number || metadata.flight_number || "",
              stops: metadata.return.stops ?? 0,
              departure_datetime: metadata.return.departure || "",
              arrival_datetime: metadata.return.arrival || "",
              duration: metadata.return.duration || "",
              baggage_include:
                metadata.return.baggage_include ||
                metadata.baggage_include ||
                "",
              carrier_logo:
                metadata.carrier_logo || metadata.return.carrier_logo || "",
              source: metadata.source || "Duffel",
            });
          }
        });

      // 2. Transform Hotels
      const hotels: any[] = quoteToSave.items
        .filter((item) => item.type === "Hotel")
        .map((item) => {
          const metadata = item.metadata as any;

          // Helper function to format time to HH:MM:SS
          const formatHotelTime = (
            time: string | null | undefined,
          ): string | null => {
            if (!time || time === "") return null;
            // If already in HH:MM:SS format, return as is
            if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
            // If in HH:MM format, add :00
            if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
            // Otherwise return null
            return null;
          };

          // Ensure room_type is always an array
          const roomType = metadata?.room_type
            ? Array.isArray(metadata.room_type)
              ? metadata.room_type
              : [metadata.room_type]
            : [];

          return {
            name: item.title,
            price_total: cleanPrice(item.price),
            hotel_currency:
              metadata?.hotel_currency || metadata?.currency || "USD",
            star_rating: metadata?.star_rating || 0,
            rating:
              typeof metadata?.rating === "number"
                ? parseFloat(metadata.rating.toFixed(1))
                : parseFloat((metadata?.rating || 0).toString()),
            country_code: metadata?.country_code || "",
            review_count: metadata?.review_count || 0,
            latitude: cleanCoordinate(metadata?.latitude, 10),
            longitude: cleanCoordinate(metadata?.longitude, 11),
            main_photo_url: metadata?.main_photo_url || "",
            checkin_time: formatHotelTime(metadata?.checkin_time),
            checkout_time: formatHotelTime(metadata?.checkout_time),
            room_type: roomType,
            labels: metadata?.labels || [],
            source: metadata?.source || "Booking.com",
          };
        });

      // 3. Transform Itinerary - Group by days
      const itineraryItems = quoteToSave.items.filter(
        (item) => item.type === "Itinerary",
      );
      const dayGroups: Record<number, typeof itineraryItems> = {};

      itineraryItems.forEach((item) => {
        const day = item.day || 1;
        if (!dayGroups[day]) dayGroups[day] = [];
        dayGroups[day].push(item);
      });

      const itineraryDays = Object.entries(dayGroups)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([dayNum, activities]) => {
          // Calculate date for this day (start_date + day offset)
          let dayDate =
            tripDetails?.departure_date ||
            new Date().toISOString().split("T")[0];
          if (tripDetails?.departure_date) {
            const startDate = new Date(tripDetails.departure_date);
            startDate.setDate(startDate.getDate() + (parseInt(dayNum) - 1));
            dayDate = startDate.toISOString().split("T")[0];
          }

          return {
            date: dayDate,
            title: `Day ${dayNum}`, // Could use dayTitles if passed from preview panel
            activities: activities.map((activity) => {
              const activityData: any = {
                title: activity.title,
                description: activity.description || "",
                date: dayDate,
                itineraryactivity_cost: cleanPrice(activity.price),
              };

              // Only include time fields if they're valid
              const startTime = formatTime(
                (activity.metadata as any)?.start_time,
              );
              const endTime = formatTime((activity.metadata as any)?.end_time);
              const location = (activity.metadata as any)?.location;

              if (startTime) activityData.start_time = startTime;
              if (endTime) activityData.end_time = endTime;
              if (location) activityData.location = location;

              return activityData;
            }),
          };
        });

      const sum = quoteToSave.items
        .filter((item) => item.type !== "Itinerary")
        .reduce((sum, item) => sum + cleanPrice(item.price), 0);

      const ai_base_total = Math.min(
        Number(sum.toFixed(2)), // Ensure only 2 decimal places
        9999999999.99,
      );

      // 5. Build payload
      const commonPayload: any = {
        trip_title: `Trip to ${quoteToSave.destination || tripDetails?.destination || "Destination"}`,
        start_date: tripDetails?.departure_date,
        end_date: tripDetails?.return_date,
        destination_city: tripDetails?.destination || quoteToSave.destination,
        destination_formatted:
          tripDetails?.destination || quoteToSave.destination,
        currency: "USD",
        ai_base_total,
        flights: flights.length > 0 ? flights : undefined,
        hotels: hotels.length > 0 ? hotels : undefined,
        itinerary:
          itineraryDays.length > 0 ? { days: itineraryDays } : undefined,
      };

      // Add optional fields only if they have values to avoid "field may not be blank" errors
      const toAirport =
        tripDetails?.destination_airport || tripDetails?.to_airport;
      if (toAirport) commonPayload.to_airport = toAirport;

      const fromAirport =
        tripDetails?.origin_airport || tripDetails?.from_airport;
      if (fromAirport) commonPayload.from_airport = fromAirport;

      // Only add destination_country if we actually have it
      if (tripDetails?.destination_country) {
        commonPayload.destination_country = tripDetails.destination_country;
      }

      let response;

      if (currentTripId) {
        // UPDATE existing trip
        const updatePayload = {
          trip_id: currentTripId,
          session_id: sessionId,
          ...commonPayload,
        };

        response = await tripsApi.updateTripData(updatePayload);
        toast.success("Quote updated successfully!", { id: toastId });
      } else {
        // CREATE new trip
        const createPayload = {
          client_id: parseInt(selectedClient.id),
          session_id: sessionId,
          ...commonPayload,
        };

        response = await tripsApi.saveTripQuote(createPayload);
        toast.success("Quote saved successfully!", { id: toastId });

        // Update currentTripId with the returned trip_id
        if (response.trip_id) {
          setCurrentTripId(response.trip_id);
        }
      }

      // Update preview quote with real IDs from backend AND preserve all items including manually added ones
      setPreviewQuote((prev) => ({
        ...prev,
        ...quoteToSave, // Preserve all the items and changes from the saved quote
        // For update, response might not have quote_id/trip_id if it's just a message,
        // but we keep existing ones. For create, we set them.
        id: (response as any).quote_id?.toString() || prev.id,
        tripId: (response as any).trip_id?.toString() || prev.tripId,
        status: "Draft",
      }));
    } catch (error: any) {
      console.error("Failed to save quote:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Failed to save quote. Please try again.";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewChat = () => {
    // Reset messages to initial state
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: (
          <div className="space-y-4">
            <p className="whitespace-pre-line">{initialMessage}</p>
          </div>
        ),
        timestamp: "Just now",
        isStreaming: false,
      },
    ]);

    // Clear all API results and cached data
    setApiFlights([]);
    setApiHotels([]);
    setApiItinerary([]);
    setTripDetails(null);
    setApiTags([]);
    setCurrentTripId(null);
    setSessionId(null);

    // Reset preview quote to initial state (keep only the structure)
    setPreviewQuote(emptyQuote);

    // Clear input
    setInputValue("");
    setShouldLoadHistory(false);
  };

  // Open flight modal
  const handleOpenFlightModal = () => {
    setIsFlightModalOpen(true);
    if (apiFlights.length === 0) {
      handlePerformFlightSearch();
    }
  };

  // Perform actual flight search API call (called from modal's search button)
  const handlePerformFlightSearch = async (params?: {
    from_airport: string;
    to_airport: string;
  }) => {
    if (!tripDetails) return;
    setIsSearchingFlights(true);

    try {
      const requestBody = {
        dest_name: tripDetails.destination,
        from_airport:
          params?.from_airport ||
          tripDetails.from_airport ||
          tripDetails.origin_airport ||
          tripDetails.origin,
        to_airport:
          params?.to_airport ||
          tripDetails.to_airport ||
          tripDetails.destination_airport ||
          tripDetails.destination,
        depart_date: tripDetails.departure_date,
        return_date: tripDetails.return_date,
        adults: tripDetails.adults || 2,
      };
      const data = await fetchFlights(requestBody);

      const allApiFlights = [
        ...(data.flights || []),
        ...(data.oneway_flights || []),
      ];

      if (allApiFlights.length > 0) {
        const mappedFlights: QuoteItem[] = allApiFlights.map((f: ApiFlight) => {
          const formatDuration = (dur: string | number) => {
            if (typeof dur === "number") {
              const hours = Math.floor(dur / 3600);
              const minutes = Math.floor((dur % 3600) / 60);
              return `${hours}h ${minutes}m`;
            }
            return dur.replace("PT", "").toLowerCase();
          };

          const description = f.return
            ? `Round-trip: ${f.outbound.departure.split("T")[1].substring(0, 5)} - ${f.outbound.arrival.split("T")[1].substring(0, 5)}`
            : `One-way: ${f.outbound.departure.split("T")[1].substring(0, 5)} - ${f.outbound.arrival.split("T")[1].substring(0, 5)}`;

          return {
            type: "Flight",
            title: f.carrier,
            description: description,
            price: Number(f.price_per_seat),
            quantity: 1,
            id: `flight-${Date.now()}-${Math.random()}`,
            metadata: {
              ...f,
              trip_type: f.return ? "round-trip" : "one-way",
              carrier_logo: f.carrier_logo,
              outbound: {
                ...f.outbound,
                duration:
                  typeof f.outbound.duration === "number"
                    ? `PT${Math.floor(f.outbound.duration / 3600)}H${Math.floor((f.outbound.duration % 3600) / 60)}M`
                    : f.outbound.duration,
              },
              return: f.return
                ? {
                    ...f.return,
                    duration:
                      typeof f.return.duration === "number"
                        ? `PT${Math.floor(f.return.duration / 3600)}H${Math.floor((f.return.duration % 3600) / 60)}M`
                        : f.return.duration,
                  }
                : null,
            },
          };
        });
        setApiFlights(mappedFlights);
      }
    } catch (error) {
      console.error("Failed to fetch flights:", error);
    } finally {
      setIsSearchingFlights(false);
    }
  };

  // Open hotel modal - triggers search automatically if no cache exists
  const handleOpenHotelModal = () => {
    setIsHotelModalOpen(true);
    if (apiHotels.length === 0) {
      handlePerformHotelSearch();
    }
  };

  // Perform actual hotel search API call
  const handlePerformHotelSearch = async () => {
    if (!tripDetails) return;
    setIsSearchingHotels(true);

    try {
      const requestBody = {
        dest_name: tripDetails.destination,
        from_airport:
          tripDetails.origin_airport ||
          tripDetails.from_airport ||
          tripDetails.origin,
        to_airport:
          tripDetails.destination_airport ||
          tripDetails.to_airport ||
          tripDetails.destination,
        checkin: tripDetails.departure_date,
        checkout: tripDetails.return_date,
      };
      const data = await fetchHotels(requestBody);

      if (data.bookings && data.bookings.length > 0) {
        const mappedHotels: QuoteItem[] = data.bookings.map(
          (h: ApiBooking) => ({
            type: "Hotel",
            title: h.name,
            description: h.source,
            price: Number(h.price_total),
            quantity: 1,
            id: `hotel-${Date.now()}-${Math.random()}`,
            metadata: h,
          }),
        );
        setApiHotels(mappedHotels);
      }
    } catch (error) {
      console.error("Failed to fetch hotels:", error);
    } finally {
      setIsSearchingHotels(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!tripDetails) return;

    const loadingMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Generating your itinerary...",
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const requestBody = {
        dest_name: tripDetails.destination,
        from_airport:
          tripDetails.origin_airport ||
          tripDetails.from_airport ||
          tripDetails.origin,
        to_airport:
          tripDetails.destination_airport ||
          tripDetails.to_airport ||
          tripDetails.destination,
        depart_date: tripDetails.departure_date,
        return_date: tripDetails.return_date,
        checkin: tripDetails.departure_date,
        checkout: tripDetails.return_date,
        adults: tripDetails.adults || 2,
      };

      const data = await fetchItinerary(requestBody);

      if (data.itinerary) {
        const itineraryItems: QuoteItem[] = [];

        if (
          data.itinerary.activities &&
          Array.isArray(data.itinerary.activities)
        ) {
          data.itinerary.activities.forEach((activity: any, index: number) => {
            itineraryItems.push({
              type: "Itinerary",
              title: activity.name,
              description:
                activity.description || activity.category || "Activity",
              price: Number(activity.price) || 0,
              quantity: 1,
              id: `itin-${Date.now()}-${Math.random()}`,
              day: Math.floor(index / 3) + 1,
              metadata: activity,
            });
          });
        } else {
          Object.entries(data.itinerary).forEach(
            ([day, activities]: [string, any]) => {
              if (Array.isArray(activities)) {
                activities.forEach((activity: any) => {
                  itineraryItems.push({
                    type: "Itinerary",
                    title: activity.time_of_day
                      ? `${day} - ${activity.time_of_day}`
                      : activity.name || day,
                    description: activity.activity || activity.description,
                    price: Number(activity.price) || 0,
                    quantity: 1,
                    id: `itin-${Date.now()}-${Math.random()}`,
                    day: Number(day.replace("Day ", "")),
                    metadata: activity,
                  });
                });
              }
            },
          );
        }

        setApiItinerary(itineraryItems);
        apiItineraryRef.current = itineraryItems; // Update ref immediately

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === loadingMessage.id) {
              return {
                ...msg,
                isStreaming: false,
                content: (
                  <div className="space-y-3">
                    <p>
                      I've generated a suggested itinerary for you. You can view
                      it below or add it to your quote.
                    </p>

                    <div className="mt-4 border-t pt-4 space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <LayoutTemplate className="h-4 w-4 text-[var(--primary-skyblue)]" />
                        Suggested Itinerary
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {itineraryItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between">
                              <div className="font-medium text-gray-900 mb-1">
                                {item.title}
                              </div>
                              {/* {item.price > 0 && <div className="text-xs font-semibold text-green-600">${item.price}</div>} */}
                            </div>
                            <div className="text-gray-600 whitespace-pre-line pl-2 border-l-2 border-[var(--primary-skyblue)] text-xs">
                              {item.day && (
                                <span className="font-bold text-gray-500 mr-2">
                                  Day {item.day}:
                                </span>
                              )}
                              {item.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-10 px-4 text-sm rounded-lg gap-2 shadow-sm transition-all hover:shadow-md"
                        onClick={() => handleAddToQuote(itineraryItems)}>
                        Add Itinerary to Quote <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ),
              };
            }
            return msg;
          }),
        );
      }
    } catch (error) {
      console.error("Failed to fetch itinerary:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMicStart = () => {
    if (!selectedClient || isTyping) return;
    setMicTranscript("");
    setPartialTranscript("");
    setShowMicPopup(true);
    startRecording();
  };

  const handleMicStopAndSend = () => {
    stopRecording();
    setShowMicPopup(false);
    
    // Combine existing input with new mic transcript
    const finalTranscript = micTranscript.trim();
    if (finalTranscript) {
      const newValue = inputValue.trim() ? `${inputValue} ${finalTranscript}` : finalTranscript;
      // We need to use a temporary variable because setInputValue is async
      setInputValue(newValue);
      // Trigger send with the combined value
      handleSend(newValue);
    }
    setMicTranscript("");
  };

  const handleMicCancel = () => {
    stopRecording();
    setShowMicPopup(false);
    setMicTranscript("");
    setPartialTranscript("");
  };

  const handleSend = async (overrideValue?: string) => {
    const valueToSend = overrideValue !== undefined ? overrideValue : inputValue;
    if (!valueToSend.trim() || isTyping || !selectedClient) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: valueToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // console.log("Sending message with session ID:", sessionId);
      const data = await fetchPlan(valueToSend, sessionId);

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      if (data.trip_details) {
        setTripDetails(data.trip_details);
        tripDetailsRef.current = data.trip_details; // Update ref immediately

        // Update preview quote destination to match AI detected destination
        const destination = data.trip_details.destination;
        if (destination) {
          setPreviewQuote((prev) => ({
            ...prev,
            destination: destination,
          }));
        }
      }

      if (data.api_tags) {
        setApiTags(data.api_tags);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        fullText: data.conversational_response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false); // Clear thinking dots as soon as we have the response to stream
    } catch (error) {
      console.error("Failed to fetch plan:", error);
      setIsTyping(false);
    }
  };

  const handleStreamComplete = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isStreaming: false,
            content: (
              <div className="space-y-4">
                <p className="whitespace-pre-line">{msg.fullText}</p>
                <div className="flex flex-wrap gap-2">
                  {(apiTags.includes("FLIGHT_SEARCH") ||
                    apiTags.includes("search_flights") ||
                    apiTags.includes("flights")) && (
                    <Button
                      className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white h-9 px-4 text-sm rounded-lg gap-2 shadow-sm transition-all hover:shadow-md"
                      onClick={handleOpenFlightModal}>
                      Search Flights{" "}
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                  )}
                  {(apiTags.includes("HOTEL_SEARCH") ||
                    apiTags.includes("search_hotels") ||
                    apiTags.includes("hotels")) && (
                    <Button
                      className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white h-9 px-4 text-sm rounded-lg gap-2 shadow-sm transition-all hover:shadow-md"
                      onClick={handleOpenHotelModal}>
                      Search Hotels{" "}
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                  )}
                </div>
              </div>
            ),
          };
        }
        return msg;
      }),
    );
    setIsTyping(false);
  };

  // Load chat history when sessionId is available
  useEffect(() => {
    const loadChatHistory = async () => {
      if (sessionId && sessionId > 0 && shouldLoadHistory) {
        setIsLoadingHistory(true);
        try {
          const historyData = await fetchChatHistory(sessionId);

          if (historyData.messages && Array.isArray(historyData.messages)) {
            // Convert API messages to Message format
            const formattedMessages: Message[] = historyData.messages.map(
              (msg: any) => {
                const isUser = msg.sender === "USER";
                const assistantMetadata = !isUser ? msg.metadata : null;

                return {
                  id: msg.id.toString(),
                  role: isUser ? "user" : "assistant",
                  content: msg.text,
                  fullText: !isUser ? msg.text : undefined,
                  timestamp: new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  isStreaming: false,
                  metadata: assistantMetadata,
                };
              },
            );

            // Replace initial message with history
            setMessages(formattedMessages);

            // Update trip details from the latest message metadata
            if (historyData.trip_details) {
              setTripDetails(historyData.trip_details);
              tripDetailsRef.current = historyData.trip_details;

              setPreviewQuote((prev) => ({
                ...prev,
                destination: historyData.trip_details.destination,
                startDate: historyData.trip_details.departure_date,
                endDate: historyData.trip_details.return_date,
                fromAirport: historyData.trip_details.from_airport,
                toAirport: historyData.trip_details.to_airport,
                travelerCount: historyData.trip_details.adults || 1,
              }));
            }
          }
          // Reset shouldLoadHistory after successful load
          setShouldLoadHistory(false);
        } catch (error) {
          console.error("Failed to load chat history:", error);
          // Keep existing messages if history fetch fails
        } finally {
          setIsLoadingHistory(false);
        }
      }
    };

    loadChatHistory();
  }, [sessionId, shouldLoadHistory]);

  return (
    <div className="h-[92vh] xl:h-full flex flex-col gap-4 lg:gap-6">
      <div className="lg:hidden flex p-1 bg-gray-100 rounded-lg shrink-0">
        <button
          onClick={() => setMobileView("chat")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mobileView === "chat"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}>
          Chat
        </button>
        <button
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mobileView === "preview"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}>
          Preview
        </button>
        <button
          onClick={() => setMobileView("enhance")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mobileView === "enhance"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}>
          Enhance
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          className={`h-full flex flex-col min-h-0 ${mobileView === "chat" ? "block" : "hidden"} lg:block`}>
          <Card className="flex flex-col shadow-sm bg-white rounded-xl overflow-hidden border-none ring-1 ring-gray-200 h-full">
            <CardHeader className="border-b px-4 py-3 md:px-6 md:py-4 bg-white sticky top-0 z-10 flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <Image
                  src={QuoteAssitant}
                  alt="AI"
                  className="h-8 w-8 md:h-10 md:w-10 shrink-0"
                />
                <div className="min-w-0">
                  <CardTitle className="text-base md:text-lg font-bold text-gray-900 truncate">
                    AI Quote Assistant
                  </CardTitle>
                  <p className="text-[10px] md:text-xs text-gray-500 truncate hidden sm:block">
                    Powered by intelligent automation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 md:h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm gap-2 px-2 md:px-3 min-w-[100px] md:min-w-[140px] justify-between font-normal text-xs md:text-sm">
                      <span className="truncate max-w-[80px] md:max-w-[100px]">
                        {selectedClient ? selectedClient.name : "Select Client"}
                      </span>
                      <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="bottom"
                    className="w-[90vw] sm:w-72 p-2">
                    <div className="relative mb-2 px-1 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search clients..."
                          className="pl-9 h-9 bg-gray-50 border-gray-200"
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        {isLoadingClients && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-8 text-xs font-medium text-[var(--primary-skyblue)] border-[var(--primary-skyblue)]/20 hover:bg-[var(--primary-skyblue)]/5 hover:text-[var(--primary-skyblue)]"
                        onClick={() => {
                          setIsAddClientModalOpen(true);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Create New Client
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                      {isLoadingClients ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[var(--primary-skyblue)]" />
                        </div>
                      ) : filteredClientList.length > 0 ? (
                        filteredClientList.map((client) => (
                          <DropdownMenuItem
                            key={client.id}
                            className="flex items-center gap-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 focus:bg-gray-50"
                            onClick={() => {
                              setSelectedClient(client);
                              setCurrentTripId(null);
                              setClientSearchTerm(""); // Clear search on select
                            }}>
                            <div
                              className={`h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0`}>
                              {client.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {client.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {client.email}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No clients found
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="h-8 md:h-9 bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white gap-2 px-3 md:px-4 shadow-sm hover:shadow-md transition-all text-xs md:text-sm"
                  onClick={handleNewChat}>
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">New Chat</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col min-h-0 overflow-hidden bg-white">
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                      <p className="text-sm text-gray-500">
                        Loading chat history...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        {message.role === "assistant" && (
                          <div className="h-8 w-8 rounded-full bg-[var(--primary-skyblue)] flex items-center justify-center text-white shadow-sm shrink-0 mt-1">
                            <Image
                              src={QuoteAssitant}
                              alt="AI"
                              className="h-5 w-5 "
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] ${message.role === "user" ? "ml-auto" : ""}`}>
                          <div
                            className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${message.role === "user" ? "bg-[var(--primary-skyblue)] text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.05)]"}`}>
                            {message.isStreaming && message.fullText ? (
                              <StreamingText
                                text={message.fullText}
                                onComplete={() =>
                                  handleStreamComplete(message.id)
                                }
                                onUpdate={scrollToBottom}
                              />
                            ) : typeof message.content === "string" ? (
                              <p className="whitespace-pre-line">
                                {message.content}
                              </p>
                            ) : (
                              message.content
                            )}
                          </div>
                          {message.timestamp &&
                            message.role === "assistant" && (
                              <p className="text-xs text-gray-400 mt-1 px-2">
                                {message.timestamp}
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-4 flex-row">
                        <Image
                          src={QuoteAssitant}
                          alt="AI"
                          className="h-8 w-8 brightness-0 invert"
                        />
                        <div className="max-w-[80%]">
                          <div className="p-4 rounded-2xl text-sm leading-relaxed shadow-sm bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>


              <div className="p-4 bg-white border-t border-gray-100 relative">
                {/* Mic Popup Overlay - Positioned above input */}
                {showMicPopup && (
                  <div className="absolute bottom-full left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-10 duration-300 rounded-t-2xl overflow-hidden">
                    <div className="w-full flex flex-col items-center p-6">
                      <div className="relative mb-6">
                        <div className={`absolute inset-0 rounded-full bg-[var(--primary-skyblue)]/20 animate-ping ${!isReady && "opacity-0"}`}></div>
                        <div className={`relative h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 ${isReady ? "bg-[var(--primary-skyblue)] text-white shadow-lg shadow-[var(--primary-skyblue)]/40" : "bg-gray-100 text-gray-400"}`}>
                          {isReady ? <Mic className="h-8 w-8" /> : <div className="h-6 w-6 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>}
                        </div>
                      </div>

                      <div className="w-full text-center mb-6 min-h-[80px] flex flex-col justify-center">
                        {!isReady ? (
                          <p className="text-lg font-medium text-gray-600 animate-pulse">Connecting...</p>
                        ) : (
                          <>
                            <p className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
                              {micTranscript || partialTranscript || "Listening..."}
                            </p>
                            {partialTranscript && (
                              <p className="text-sm text-gray-400 italic animate-pulse">
                                {partialTranscript}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-4 w-full justify-center">
                        <Button
                          variant="outline"
                          onClick={handleMicCancel}
                          className="h-12 px-6 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all gap-2 text-sm font-medium"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleMicStopAndSend}
                          disabled={!isReady || (!micTranscript && !partialTranscript)}
                          className="h-12 px-6 rounded-full bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/80 text-white shadow-lg shadow-[var(--primary-skyblue)]/20 transition-all gap-2 text-sm font-medium"
                        >
                          <MicOff className="h-4 w-4" />
                          Stop & Send
                        </Button>
                      </div>
                      
                      <p className="mt-4 text-xs text-gray-400">
                        {isReady ? "Tap 'Stop & Send' when finished" : "Setting up microphone..."}
                      </p>
                    </div>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute -top-12 left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <div className={`backdrop-blur-sm border px-4 py-2 rounded-full shadow-lg animate-in slide-in-from-bottom-2 duration-300 max-w-[90%] ${isReady ? "bg-green-50/90 border-green-200" : "bg-white/90 border-[var(--primary-skyblue)]/30"}`}>
                      <p className={`text-sm italic truncate ${isReady ? "text-green-700 font-medium" : "text-gray-700"}`}>
                        {isReady ? (partialTranscript || "Ready! Speak now...") : "Connecting to voice server..."}
                      </p>
                    </div>
                  </div>
                )}
                {!selectedClient && (
                  <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center cursor-not-allowed group">
                    <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                      <Info className="h-4 w-4 text-[var(--primary-skyblue)]" />
                      <span className="text-sm font-medium text-gray-600">
                        Select a client first to start chatting
                      </span>
                    </div>
                  </div>
                )}
                <div
                  className={`relative flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 p-2 transition-all ${!selectedClient ? "opacity-50" : "focus-within:ring-2 focus-within:ring-[var(--primary-skyblue)]/20 focus-within:border-[var(--primary-skyblue)]"}`}>
                  <Input
                    placeholder={isRecording ? (isReady ? "Listening..." : "Connecting...") : "Ask me anything about your business..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isTyping || !selectedClient}
                    className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-gray-700 placeholder:text-gray-400 h-9"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleMicStart}
                      disabled={isTyping || !selectedClient}
                      className="h-9 w-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleSend()}
                      disabled={isTyping || !inputValue.trim() || !selectedClient}
                      className={`h-9 w-9 rounded-lg transition-all ${inputValue.trim() && selectedClient ? "bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className={`h-full min-h-0 ${mobileView === "preview" ? "block" : "hidden"} lg:block`}>
          <PreviewPanel
            quote={previewQuote}
            onClose={() => setMobileView("chat")}
            onSave={handleSaveQuote}
            isSaving={isSaving}
            client={selectedClient}
            tripDetails={tripDetails}
            sessionId={sessionId}
            onGenerateItinerary={handleGenerateItinerary}
            onOpenFlightSearch={handleOpenFlightModal}
            onOpenHotelSearch={handleOpenHotelModal}
            activeTab={previewTab}
            onTabChange={setPreviewTab}
          />
        </div>

        <FlightSearchModal
          isOpen={isFlightModalOpen}
          onClose={() => setIsFlightModalOpen(false)}
          onSelect={(item) => {
            const itemsToAdd = Array.isArray(item) ? item : [item];
            setPreviewQuote((prev) => ({
              ...prev,
              items: [
                ...prev.items.filter((i) => i.type !== "Flight"),
                ...itemsToAdd,
              ],
            }));
            setPreviewTab("flights");
            setIsFlightModalOpen(false);
          }}
          client={selectedClient}
          results={apiFlights.length > 0 ? apiFlights : undefined}
          tripDetails={tripDetails}
          isLoading={isSearchingFlights}
          onSearch={handlePerformFlightSearch}
        />

        <HotelSearchModal
          isOpen={isHotelModalOpen}
          onClose={() => setIsHotelModalOpen(false)}
          onSelect={(item) => {
            setPreviewQuote((prev) => ({
              ...prev,
              items: [...prev.items.filter((i) => i.type !== "Hotel"), item],
            }));
            setPreviewTab("hotels");
            setIsHotelModalOpen(false);
          }}
          client={selectedClient}
          results={apiHotels.length > 0 ? apiHotels : undefined}
          tripDetails={tripDetails}
          isLoading={isSearchingHotels}
          onSearch={handlePerformHotelSearch}
          selectedFlights={previewQuote.items.filter(
            (item) => item.type === "Flight",
          )}
        />
        <div
          className={`h-full min-h-0 ${mobileView === "enhance" ? "block" : "hidden"} xl:block`}>
          <EnhanceTripPanel tripDetails={tripDetails} quote={previewQuote} />
        </div>
      </div>

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}
