"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  FileText,
  Trash2,
  Plus,
  Pencil,
  Plane,
  Hotel,
  Car,
  MapPin,
  ShieldCheck,
  Info,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Copy,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { Quote, QuoteItem, ItineraryActivity } from "@/lib/types/quotes";
import { cn } from "@/lib/utils";
import { FlightSearchModal } from "@/components/quote-assistant/flight-search-modal";
import { HotelSearchModal } from "@/components/quote-assistant/hotel-search-modal";
import { fetchFlights, fetchHotels } from "@/lib/api/quoteAssistant.api";
import { updateQuote, updateQuoteStatus, getDetailedQuote } from "@/lib/api/quotes.api";
import { tripsApi } from "@/lib/api/trips.api";
import {
  ApiFlight,
  ApiBooking,
  ApiTripDetails,
} from "@/lib/types/quoteAssistant";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface QuoteDetailProps {
  quote: Quote;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusUpdate?: () => void;
}

const statusStyles: Record<string, string> = {
  Approved: "bg-green-50 text-green-600 border-green-100",
  Accepted: "bg-green-50 text-green-600 border-green-100",
  Confirmed: "bg-green-50 text-green-600 border-green-100",
  Draft: "bg-gray-50 text-gray-600 border-gray-100",
  Pending: "bg-blue-50 text-blue-600 border-blue-100",
  Sent: "bg-blue-50 text-blue-600 border-blue-100",
  Viewed: "bg-purple-50 text-purple-600 border-purple-100",
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return "";
  // If it's just a date (YYYY-MM-DD), return  for time
  if (dateStr.length <= 10) return "";
  try {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "";
  }
};

const formatDuration = (dur: string | number) => {
  if (!dur) return "";
  
  // If it's a number or a numeric string, treat as seconds
  const seconds = typeof dur === "string" && !isNaN(Number(dur)) ? Number(dur) : (typeof dur === "number" ? dur : null);
  
  if (seconds !== null) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  if (typeof dur === "string") {
    const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = match[1] ? `${match[1]}h ` : "";
      const minutes = match[2] ? `${match[2]}m` : "";
      return (hours + minutes).trim() || dur;
    }
    return dur.replace("PT", "").toLowerCase();
  }
  
  return dur || "";
};

// Helper function to ensure decimal values don't exceed max_digits constraint
const ensureMaxDigits = (
  value: number | null | undefined,
  maxDigits: number,
  decimalPlaces: number = 2,
): number => {
  if (value === null || value === undefined || isNaN(value)) return 0;

  const maxIntegerDigits = maxDigits - decimalPlaces;
  const maxValue = Number(
    "9".repeat(maxIntegerDigits) + "." + "9".repeat(decimalPlaces),
  );

  const truncatedValue = Math.min(Math.abs(value), maxValue);

  return Number(truncatedValue.toFixed(decimalPlaces));
};

export function QuoteDetail({
  quote,
  onApprove,
  onDelete,
  onStatusUpdate,
}: QuoteDetailProps) {
  const router = useRouter();
  const [localQuote, setLocalQuote] = useState<Quote>(quote);

  // Modal State
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isSearchingFlights, setIsSearchingFlights] = useState(false);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);
  const [apiFlights, setApiFlights] = useState<QuoteItem[]>([]);
  const [apiHotels, setApiHotels] = useState<QuoteItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Activity State
  const [newActivity, setNewActivity] = useState<{
    [dayIdx: number]: { title: string; cost: string };
  }>({});

  // Group items by type
  const flights = localQuote.items.filter((item) => item.type === "Flight");
  const hotels = localQuote.items.filter((item) => item.type === "Hotel");
  const others = localQuote.items.filter(
    (item) => !["Flight", "Hotel", "Itinerary", "Tour"].includes(item.type),
  );

  const calculateTotal = () => {
    return localQuote.items
      .filter((item) => item.type !== "Itinerary" && item.type !== "Tour")
      .reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);
  };

  const tripDetails: ApiTripDetails = {
    destination:
      localQuote.destination && localQuote.destination !== "Trip Quote"
        ? localQuote.destination
        : localQuote.toAirport || "",
    origin:
      localQuote.fromAirport ||
      (flights[0]?.metadata
        ? (flights[0].metadata as any).outbound?.from_airport
        : ""),
    origin_airport:
      localQuote.fromAirport ||
      (flights[0]?.metadata
        ? (flights[0].metadata as any).outbound?.from_airport
        : ""),
    destination_airport:
      localQuote.toAirport ||
      (flights[0]?.metadata
        ? (flights[0].metadata as any).outbound?.to_airport
        : ""),
    departure_date: localQuote.startDate || "",
    return_date: localQuote.endDate || "",
    adults: localQuote.travelerCount || 2,
  };

  const handlePerformFlightSearch = async (params?: {
    from_airport: string;
    to_airport: string;
  }) => {
    setIsSearchingFlights(true);
    try {
      const requestBody = {
        dest_name: tripDetails.destination,
        from_airport:
          params?.from_airport ||
          tripDetails.origin_airport ||
          tripDetails.from_airport ||
          tripDetails.origin,
        to_airport:
          params?.to_airport ||
          tripDetails.destination_airport ||
          tripDetails.to_airport ||
          tripDetails.destination,
        depart_date: tripDetails.departure_date,
        return_date: tripDetails.return_date,
        adults: tripDetails.adults,
      };
      const data = await fetchFlights(requestBody);

      const allApiFlights = [
        ...(data.flights || []),
        ...(data.oneway_flights || []),
      ];

      if (allApiFlights.length > 0) {
        const mappedFlights: QuoteItem[] = allApiFlights.map((f: ApiFlight) => {
          const description = f.return
            ? `Round-trip: ${f.outbound.departure
                .split("T")[1]
                .substring(0, 5)} - ${f.outbound.arrival
                .split("T")[1]
                .substring(0, 5)} / ${f.return.departure
                .split("T")[1]
                .substring(0, 5)} - ${f.return.arrival
                .split("T")[1]
                .substring(0, 5)}`
            : `One-way: ${f.outbound.departure
                .split("T")[1]
                .substring(0, 5)} - ${f.outbound.arrival
                .split("T")[1]
                .substring(0, 5)}`;

          // Flatten metadata for easier access in UI and saving
          const flattenedMetadata = {
            ...f,
            departure_datetime: f.outbound.departure,
            departure_airport: f.outbound.departure_airport,
            arrival_datetime: f.outbound.arrival,
            arrival_airport: f.outbound.arrival_airport,
            duration: f.outbound.duration,
            stops: f.outbound.stops,
            flight_number: f.outbound.flight_number,
            carrier_logo: f.carrier_logo,
            baggage_include: f.outbound.baggage_included,
            travel_class: f.type,
            flight_currency: "USD", // Default
          };

          return {
            type: "Flight",
            title: f.carrier,
            description: description,
            price: Number(f.price_per_seat),
            quantity: tripDetails.adults,
            id: `flight-${Date.now()}-${Math.random()}`,
            metadata: flattenedMetadata as any,
          };
        });
        setApiFlights(mappedFlights);
      }
    } catch (error) {
      console.error("Failed to fetch flights:", error);
      toast.error("Failed to fetch flights");
    } finally {
      setIsSearchingFlights(false);
    }
  };

  const handlePerformHotelSearch = async () => {
    setIsSearchingHotels(true);
    try {
      const requestBody = {
        dest_name: tripDetails.destination,
        from_airport: tripDetails.origin,
        to_airport: tripDetails.destination_airport,
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
      toast.error("Failed to fetch hotels");
    } finally {
      setIsSearchingHotels(false);
    }
  };

  const handleSelectFlight = (flight: QuoteItem | QuoteItem[]) => {
    const flightItem = Array.isArray(flight) ? flight[0] : flight;
    const meta = flightItem.metadata as any;

    setLocalQuote((prev) => {
      // Remove ALL existing flight items
      const otherItems = prev.items.filter((item) => item.type !== "Flight");
      const newFlights: QuoteItem[] = [];

      // If it's a round trip, we split it into two items
      if (meta?.return) {
        const outboundItem: QuoteItem = {
          ...flightItem,
          id: `flight-out-${Date.now()}`,
          metadata: {
            ...meta,
            flight_type: "OUTBOUND",
            departure_datetime: meta.outbound.departure,
            departure_airport: meta.outbound.departure_airport,
            arrival_datetime: meta.outbound.arrival,
            arrival_airport: meta.outbound.arrival_airport,
            duration: meta.outbound.duration,
            stops: meta.outbound.stops,
            flight_number: meta.outbound.flight_number,
            baggage_include: meta.outbound.baggage_included,
          },
        };

        const returnItem: QuoteItem = {
          ...flightItem,
          id: `flight-ret-${Date.now()}`,
          title: flightItem.title,
          description: `Return: ${meta.return.departure.split("T")[1].substring(0, 5)} - ${meta.return.arrival.split("T")[1].substring(0, 5)}`,
          price: 0, // Price is already included in outbound for round-trip results
          metadata: {
            ...meta,
            flight_type: "RETURN",
            departure_datetime: meta.return.departure,
            departure_airport: meta.return.departure_airport,
            arrival_datetime: meta.return.arrival,
            arrival_airport: meta.return.arrival_airport,
            duration: meta.return.duration,
            stops: meta.return.stops,
            flight_number: meta.return.flight_number,
            baggage_include: meta.return.baggage_included,
          },
        };

        newFlights.push(outboundItem, returnItem);
      } else {
        // One-way flight
        const outboundItem: QuoteItem = {
          ...flightItem,
          id: `flight-out-${Date.now()}`,
          metadata: {
            ...meta,
            flight_type: "OUTBOUND",
          },
        };
        newFlights.push(outboundItem);
      }

      return {
        ...prev,
        items: [...newFlights, ...otherItems],
      };
    });

    setIsFlightModalOpen(false);
    setEditingItemId(null);
    toast.success("Flights updated");
  };

  const handleSelectHotel = (hotel: QuoteItem) => {
    setLocalQuote((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === editingItemId ? { ...hotel, id: item.id } : item,
      ),
    }));
    setIsHotelModalOpen(false);
    setEditingItemId(null);
    toast.success("Hotel updated");
  };

  const handleAddManualActivity = (dayIdx: number) => {
    const activity = newActivity[dayIdx];
    if (!activity || !activity.title) {
      toast.error("Please provide title.");
      return;
    }

    const newItem: QuoteItem = {
      type: "Itinerary",
      title: activity.title,
      description: "Manual Activity",
      price: Number(activity.cost),
      quantity: 1,
      id: `manual-${Date.now()}`,
      day: dayIdx + 1,
    };

    setLocalQuote((prev) => {
      const updatedItineraryDays = [...(prev.itineraryDays || [])];
      if (updatedItineraryDays[dayIdx]) {
        updatedItineraryDays[dayIdx] = {
          ...updatedItineraryDays[dayIdx],
          activities: [
            ...updatedItineraryDays[dayIdx].activities,
            {
              title: activity.title,
              description: "Manual Activity",
              start_time: null,
              price: Number(activity.cost),
            },
          ],
        };
      }

      return {
        ...prev,
        items: [...prev.items, newItem],
        itineraryDays: updatedItineraryDays,
      };
    });

    setNewActivity((prev) => ({
      ...prev,
      [dayIdx]: { title: "", cost: "" },
    }));
    toast.success("Activity added");
  };

  const handleRemoveActivity = (dayIdx: number, actIdx: number) => {
    setLocalQuote((prev) => {
      const updatedItineraryDays = [...(prev.itineraryDays || [])];
      if (!updatedItineraryDays[dayIdx]) return prev;

      const activityToRemove = updatedItineraryDays[dayIdx].activities[actIdx];
      const updatedActivities = updatedItineraryDays[dayIdx].activities.filter(
        (_, i) => i !== actIdx,
      );

      updatedItineraryDays[dayIdx] = {
        ...updatedItineraryDays[dayIdx],
        activities: updatedActivities,
      };

      // Also remove from items if it matches title and day
      const updatedItems = prev.items.filter(
        (item) =>
          !(
            (item.type === "Itinerary" || item.type === "Tour") &&
            item.title === activityToRemove.title &&
            item.day === dayIdx + 1
          ),
      );

      return {
        ...prev,
        items: updatedItems,
        itineraryDays: updatedItineraryDays,
      };
    });
    toast.success("Activity removed");
  };

  const handleSwapActivity = (
    dayIdx: number,
    actIdx: number,
    direction: "up" | "down",
  ) => {
    setLocalQuote((prev) => {
      const updatedItineraryDays = [...(prev.itineraryDays || [])];
      if (!updatedItineraryDays[dayIdx]) return prev;

      const activities = [...updatedItineraryDays[dayIdx].activities];
      const targetIdx = direction === "up" ? actIdx - 1 : actIdx + 1;

      if (targetIdx < 0 || targetIdx >= activities.length) return prev;

      // Swap in itineraryDays
      const item1 = activities[actIdx];
      const item2 = activities[targetIdx];
      activities[actIdx] = item2;
      activities[targetIdx] = item1;

      updatedItineraryDays[dayIdx] = {
        ...updatedItineraryDays[dayIdx],
        activities: activities,
      };

      // Also swap in items array to keep them in sync for saving
      const updatedItems = [...prev.items];
      const idx1 = updatedItems.findIndex(
        (item) =>
          (item.type === "Itinerary" || item.type === "Tour") &&
          item.title === item1.title &&
          item.day === dayIdx + 1,
      );
      const idx2 = updatedItems.findIndex(
        (item) =>
          (item.type === "Itinerary" || item.type === "Tour") &&
          item.title === item2.title &&
          item.day === dayIdx + 1,
      );

      if (idx1 !== -1 && idx2 !== -1) {
        const temp = updatedItems[idx1];
        updatedItems[idx1] = updatedItems[idx2];
        updatedItems[idx2] = temp;
      }

      return {
        ...prev,
        items: updatedItems,
        itineraryDays: updatedItineraryDays,
      };
    });
  };

  const handleRemoveFlight = (flightId: string) => {
    setLocalQuote((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== flightId),
    }));
    toast.success("Flight removed");
  };

  const handleSaveQuote = async () => {
    if (!localQuote.tripId) {
      toast.error("Trip ID missing. Cannot save changes.");
      return;
    }

    const toastId = toast.loading("Saving changes...");
    try {
      // 1. Map Flights
      const flights = localQuote.items
        .filter((item) => item.type === "Flight")
        .map((item) => {
          const meta = item.metadata as any;
          return {
            flight_type: (meta?.flight_type || "OUTBOUND").toUpperCase(),
            travel_class: (meta?.travel_class || "ECONOMY").toUpperCase(),
            price_per_seat: item.price,
            carrier: item.title,
            flight_currency: (meta?.flight_currency || "USD").toUpperCase(),
            source: meta?.source || "Duffel",
            departure_datetime: meta?.departure_datetime || null,
            departure_airport: meta?.departure_airport || "",
            arrival_datetime: meta?.arrival_datetime || null,
            arrival_airport: meta?.arrival_airport || "",
            duration: meta?.duration || "",
            stops: meta?.stops || 0,
            baggage_include: meta?.baggage_include || "",
            flight_number: meta?.flight_number || "",
            carrier_logo: meta?.carrier_logo || "",
          };
        });

      // 2. Map Hotels
      const hotels = localQuote.items
        .filter((item) => item.type === "Hotel")
        .map((item) => {
          const meta = item.metadata as any;
          return {
            name: item.title,
            price_total: ensureMaxDigits(item.price, 10, 2), // max_digits=10, decimal_places=2
            hotel_currency: (meta?.hotel_currency || "USD").toUpperCase(),
            rating: meta?.rating || 0,
            review_count: meta?.review_count || 0,
            star_rating: meta?.star_rating || 0,
            country_code: (meta?.country_code || "").toUpperCase(),
            latitude: ensureMaxDigits(meta?.latitude, 10, 6), // max_digits=10, decimal_places=6
            longitude: ensureMaxDigits(meta?.longitude, 11, 6), // max_digits=11, decimal_places=6
            main_photo_url: meta?.main_photo_url || "",
            checkin_time: meta?.checkin_time || null,
            checkout_time: meta?.checkout_time || null,
            room_type: meta?.room_type || [],
            labels: meta?.labels || [],
            source: meta?.source || "Booking.com",
          };
        });

      // 3. Map Itinerary
      const itinerary = {
        days: (localQuote.itineraryDays || []).map((day) => ({
          date: day.date || "",
          title: day.title,
          activities: day.activities.map((act) => ({
            title: act.title,
            description: act.description,
            itineraryactivity_cost: act.price || 0,
            start_time: act.start_time || null,
            end_time: act.end_time || null,
            date: day.date || "",
          })),
        })),
      };

      // 4. Calculate ai_base_total from flights and hotels
      const flightsTotal = flights.reduce(
        (sum, flight) => sum + Number(flight.price_per_seat || 0),
        0,
      );
      const hotelsTotal = hotels.reduce(
        (sum, hotel) => sum + Number(hotel.price_total || 0),
        0,
      );
      const ai_base_total = ensureMaxDigits(flightsTotal + hotelsTotal, 12, 2); // max_digits=12, decimal_places=2

      // 5. Construct Full Payload
      const payload = {
        trip_id: parseInt(localQuote.tripId),
        trip_title: localQuote.destination,
        start_date: localQuote.startDate,
        end_date: localQuote.endDate,
        destination_city: localQuote.destination.split(",")[0]?.trim() || "",
        destination_country: localQuote.destination.split(",")[1]?.trim() || "",
        to_airport: localQuote.toAirport || "",
        from_airport: localQuote.fromAirport || "",
        currency: (localQuote.price.startsWith("$")
          ? "USD"
          : "USD"
        ).toUpperCase(), // Default to USD for now
        ai_base_total,
        flights,
        hotels,
        itinerary,
      };

      await tripsApi.updateTripData(payload);
      
      // 6. Refresh Quote Details from backend
      try {
        const updatedQuote = await getDetailedQuote(localQuote.id);
        setLocalQuote(updatedQuote);
      } catch (refreshError) {
        console.error("Failed to refresh quote after save:", refreshError);
        // Fallback: keep local changes if refresh fails
      }

      toast.success("Changes saved successfully", { id: toastId });
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to save changes", { id: toastId });
    }
  };

  const handleDeleteTrip = async () => {
    if (!localQuote.tripId) {
      toast.error("Trip ID missing. Cannot delete trip.");
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting trip...");
    try {
      await tripsApi.deleteTripData(parseInt(localQuote.tripId));
      setIsDeleteModalOpen(false);
      toast.success("Trip deleted successfully", { id: toastId });
      onDelete?.(localQuote.id);
    } catch (error) {
      console.error("Failed to delete trip:", error);
      toast.error("Failed to delete trip", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkReady = async () => {
    try {
      const response = await updateQuoteStatus(
        parseInt(localQuote.id),
        "INITIAL_CONTACT",
      );

      // Update local state
      setLocalQuote((prev) => ({
        ...prev,
        status: "Initial Contact",
      }));

      toast.success("Quote status updated to Initial Contact");

      // Refresh the quote list to hide updated quotes
      onStatusUpdate?.();
    } catch (error) {
      console.error("Failed to update quote status:", error);
      toast.error("Failed to update quote status");
    }
  };

  const handleAIEdit = () => {
    // Navigate to quote-assistant with quote ID and session ID for AI-powered editing
    const queryParams = new URLSearchParams({
      quoteId: localQuote.id,
      ...(localQuote.sessionId && {
        sessionId: localQuote.sessionId.toString(),
      }),
    });
    router.push(`/quote-assistant?${queryParams.toString()}`);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100 bg-[#F8F9FA]/50">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#000E19] tracking-tight">
                {quote.destination}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] sm:text-[10px] px-2 py-0.5 h-5 sm:h-6 font-bold border uppercase tracking-wider",
                  statusStyles[quote.status] ||
                    "bg-gray-50 text-gray-500 border-gray-100",
                )}>
                {quote.status}
              </Badge>
            </div>
            {/* <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium flex-wrap">
              <span className="text-[#43ABFF]">{quote.clientName}</span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span>ID: {quote.id}</span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Updated {formatDateTime(quote.updatedAt)}</span>
            </div> */}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="h-8 sm:h-10 px-2 sm:px-4 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-[10px] sm:text-xs md:text-sm cursor-pointer">
              <Trash2 className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveQuote}
              className="h-8 sm:h-10 px-3 sm:px-6 border-[#43ABFF] text-[#43ABFF] hover:bg-blue-50 rounded-xl transition-all font-bold text-[10px] sm:text-xs md:text-sm cursor-pointer">
              <FileText className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
              Save Changes
            </Button>
            <Button
              size="sm"
              onClick={handleAIEdit}
              className="h-8 sm:h-10 px-3 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-purple-100 transition-all font-bold text-[10px] sm:text-xs md:text-sm cursor-pointer">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
              AI Edit
            </Button>
            {localQuote.status === "Draft" && (
              <Button
                size="sm"
                onClick={handleMarkReady}
                className="h-8 sm:h-10 px-3 sm:px-6 bg-[#43ABFF] hover:bg-[#43ABFF]/90 text-white rounded-xl shadow-lg shadow-blue-100 transition-all font-bold text-[10px] sm:text-xs md:text-sm flex-1 sm:flex-none cursor-pointer">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 sm:mr-2 cursor-pointer" />
                Ready for Initial Contact
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-[#000E19] bg-white px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border border-gray-100 shadow-sm flex-1 sm:flex-none">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#43ABFF]" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-0.5 sm:mb-1">
                Travel Dates
              </p>
              <p className="font-bold text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                {quote.startDate && quote.endDate
                  ? `${new Date(quote.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })} - ${new Date(quote.endDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}`
                  : "Dates Pending"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-[#000E19] bg-white px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border border-gray-100 shadow-sm flex-1 sm:flex-none">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-0.5 sm:mb-1">
                Travelers
              </p>
              <p className="font-bold text-[10px] sm:text-xs md:text-sm">
                {quote.travelerCount || 1}{" "}
                {quote.travelerCount === 1 ? "Person" : "People"}
                {quote.familyMembersCount && quote.familyMembersCount > 0 ? ` (${quote.familyMembersCount} Family)` : ""}
              </p>
            </div>
          </div>
          {/* <div className="flex items-center gap-2 sm:gap-3 text-sm text-[#000E19] bg-white px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border border-gray-100 shadow-sm sm:ml-auto flex-1 sm:flex-none">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </div>
            <div className="text-right sm:text-left">
              <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-0.5 sm:mb-1">Total Budget</p>
              <p className="font-bold text-xs sm:text-base md:text-lg text-[#000E19]">{quote.price}</p>
            </div>
          </div> */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 sm:space-y-10">
        {/* Quote Items */}
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#000E19] text-lg sm:text-xl">
              Trip Components
            </h3>
          </div>

          {/* Flights */}
          {flights.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-gray-400">
                  <Plane className="h-5 w-5" />
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em]">
                    Flights
                  </h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Flight Cost</p>
                    <p className="font-bold text-base text-[#000E19]">
                      ${flights.reduce((sum, f) => sum + (Number(f.price) * (f.quantity || 1)), 0).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItemId(flights[0].id || null);
                      setIsFlightModalOpen(true);
                      if (apiFlights.length === 0) handlePerformFlightSearch();
                    }}
                    className="h-8 border-[#43ABFF] text-[#43ABFF] hover:bg-blue-50 rounded-lg font-bold text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1.5" />
                    Edit Flights
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {flights.map((item, idx) => (
                  <QuoteItemCard
                    key={idx}
                    item={item}
                    icon={<Plane className="h-5 w-5 text-blue-500" />}
                    imageUrl={item.metadata?.carrier_logo as string}
                    tripDetails={tripDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hotels */}
          {hotels.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 text-gray-400">
                <Hotel className="h-5 w-5" />
                <h4 className="font-bold text-xs uppercase tracking-[0.2em]">
                  Accommodations
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {hotels.map((item, idx) => (
                  <QuoteItemCard
                    key={idx}
                    item={item}
                    icon={<Hotel className="h-5 w-5 text-purple-500" />}
                    imageUrl={item.metadata?.main_photo_url as string}
                    onEdit={() => {
                      setEditingItemId(item.id || null);
                      setIsHotelModalOpen(true);
                      if (apiHotels.length === 0) handlePerformHotelSearch();
                    }}
                    tripDetails={tripDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Others */}
          {others.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 text-gray-400">
                <Info className="h-5 w-5" />
                <h4 className="font-bold text-xs uppercase tracking-[0.2em]">
                  Other Services
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {others.map((item, idx) => (
                  <QuoteItemCard
                    key={idx}
                    item={item}
                    icon={<Car className="h-5 w-5 text-orange-500" />}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Itinerary */}
          {localQuote.itineraryDays && localQuote.itineraryDays.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 text-gray-400">
                <Calendar className="h-5 w-5" />
                <h4 className="font-bold text-xs uppercase tracking-[0.2em]">
                  Daily Itinerary
                </h4>
              </div>
              <div className="bg-[#F8F9FA] rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                {localQuote.itineraryDays.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="relative pl-6 sm:pl-10 border-l-2 border-blue-100 last:pb-0 pb-8 sm:pb-10">
                    <div className="absolute -left-[7px] sm:-left-[11px] top-0 h-3 w-3 sm:h-5 sm:w-5 rounded-full bg-white border-2 sm:border-4 border-[#43ABFF] shadow-sm" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-5 gap-2">
                      <div>
                        <h5 className="font-bold text-[#000E19] text-sm sm:text-base md:text-lg">
                          {day.day}
                        </h5>
                        {day.date && (
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 font-medium mt-0.5">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-white text-gray-500 border-gray-100 font-bold text-[9px] sm:text-[10px] md:text-xs w-fit">
                        {day.title}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {day.activities.map((activity, actIdx) => (
                        <div
                          key={`${dayIdx}-${actIdx}-${activity.title}`}
                          className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div className="flex gap-3 sm:gap-4 flex-1">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0">
                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-[#43ABFF]" />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                  <p className="font-bold text-[#000E19] text-xs sm:text-sm md:text-base">
                                    {activity.title}
                                  </p>
                                  <div className="flex items-center gap-2 sm:gap-4">
                                    {/* {activity.price !== undefined && (
                                      <p className="font-bold text-[#43ABFF] text-xs sm:text-sm md:text-base shrink-0">${activity.price.toLocaleString()}</p>
                                    )} */}
                                    <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 hover:text-[#43ABFF] hover:bg-blue-50"
                                        onClick={() =>
                                          handleSwapActivity(
                                            dayIdx,
                                            actIdx,
                                            "up",
                                          )
                                        }
                                        disabled={actIdx === 0}>
                                        <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 hover:text-[#43ABFF] hover:bg-blue-50"
                                        onClick={() =>
                                          handleSwapActivity(
                                            dayIdx,
                                            actIdx,
                                            "down",
                                          )
                                        }
                                        disabled={
                                          actIdx === day.activities.length - 1
                                        }>
                                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() =>
                                          handleRemoveActivity(dayIdx, actIdx)
                                        }>
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5 sm:mt-1 leading-relaxed">
                                  {activity.description}
                                </p>
                              </div>
                            </div>
                            {activity.start_time && (
                              <div className="px-2.5 py-1 bg-[#F8F9FA] rounded-lg text-[10px] sm:text-[11px] text-[#000E19] font-bold flex items-center gap-1.5 border border-gray-100 w-fit sm:shrink-0">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#43ABFF]" />
                                {activity.start_time}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add Manual Activity Form */}
                      <div className="bg-white/50 p-4 rounded-xl border border-dashed border-gray-200 mt-2">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            placeholder="Activity title..."
                            className="h-9 text-sm"
                            value={newActivity[dayIdx]?.title || ""}
                            onChange={(e) =>
                              setNewActivity((prev) => ({
                                ...prev,
                                [dayIdx]: {
                                  ...prev[dayIdx],
                                  title: e.target.value,
                                },
                              }))
                            }
                          />
                          <div className="flex gap-2">
                            {/* <div className="relative flex-1 sm:w-32">
                              <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Cost"
                                className="h-9 pl-8 text-sm"
                                type="number"
                                value={newActivity[dayIdx]?.cost || ""}
                                onChange={(e) =>
                                  setNewActivity((prev) => ({
                                    ...prev,
                                    [dayIdx]: {
                                      ...prev[dayIdx],
                                      cost: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div> */}
                            <Button
                              size="sm"
                              className="bg-[#43ABFF] hover:bg-[#43ABFF]/90 h-9 px-4"
                              onClick={() => handleAddManualActivity(dayIdx)}>
                              <Plus className="h-4 w-4 mr-1.5" /> Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-[#F8F9FA] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 text-black relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#43ABFF]/10 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32 blur-2xl sm:blur-3xl" />
          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 sm:pb-6">
              <h3 className="text-lg sm:text-xl font-bold">Price Summary</h3>
              <Badge className="bg-[#43ABFF] text-white border-none font-bold text-[10px] sm:text-xs">
                Guaranteed Price
              </Badge>
            </div>
            <div className="space-y-2 sm:space-y-4">
              {localQuote.priceSummary ? (
                <>
                  <div className="flex justify-between text-black font-medium text-[10px] sm:text-xs md:text-sm">
                    <span>Flights Total</span>
                    <span className="text-black">
                      $
                      {(
                        localQuote.priceSummary.flightsTotal || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-black font-medium text-[10px] sm:text-xs md:text-sm">
                    <span>Hotels Total</span>
                    <span className="text-black">
                      $
                      {(
                        localQuote.priceSummary.hotelsTotal || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-black font-medium text-[10px] sm:text-xs md:text-sm">
                    <span>
                      Agent Commission (
                      {localQuote.priceSummary.agentCommissionPercent || 0}%)
                    </span>
                    <span className="text-black">
                      $
                      {(
                        localQuote.priceSummary.agentCommission || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-black font-medium text-[10px] sm:text-xs md:text-sm">
                    <span>
                      Agency Commission (
                      {localQuote.priceSummary.agencyCommissionPercent || 0}%)
                    </span>
                    <span className="text-black">
                      $
                      {(
                        localQuote.priceSummary.agencyCommission || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 sm:pt-8 border-t border-gray-200 mt-3 sm:mt-6 gap-3 sm:gap-4">
                    <div>
                      <span className="block font-bold text-lg sm:text-xl md:text-2xl">
                        Total Amount
                      </span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 sm:mt-1 block font-medium">
                        All-inclusive, no hidden charges
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="block font-bold text-3xl sm:text-4xl md:text-5xl text-[#43ABFF] tracking-tighter">
                        $
                        {(
                          localQuote.priceSummary.totalAmount || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-black font-medium text-[10px] sm:text-xs md:text-sm">
                    <span>Subtotal (Components)</span>
                    <span className="text-black">
                      ${calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-black font-medium text-[10px] sm:text-xs md:text-sm">
                    <span>Taxes & Regulatory Fees</span>
                    <span className="text-black">Included</span>
                  </div>
                  <div className="flex justify-between text-black font-medium text-[10px] sm:text-xs md:text-sm">
                    <span>Agency Service Fee</span>
                    <span className="text-black">$0.00</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 sm:pt-8 border-t border-gray-200 mt-3 sm:mt-6 gap-3 sm:gap-4">
                    <div>
                      <span className="block font-bold text-lg sm:text-xl md:text-2xl">
                        Total Amount
                      </span>
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 sm:mt-1 block font-medium">
                        All-inclusive, no hidden charges
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="block font-bold text-3xl sm:text-4xl md:text-5xl text-[#43ABFF] tracking-tighter">
                        ${calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <FlightSearchModal
        isOpen={isFlightModalOpen}
        onClose={() => setIsFlightModalOpen(false)}
        onSelect={handleSelectFlight}
        client={{ name: localQuote.clientName } as any}
        results={apiFlights}
        tripDetails={tripDetails}
        isLoading={isSearchingFlights}
        onSearch={handlePerformFlightSearch}
      />
      <HotelSearchModal
        isOpen={isHotelModalOpen}
        onClose={() => setIsHotelModalOpen(false)}
        onSelect={handleSelectHotel}
        client={{ name: localQuote.clientName } as any}
        results={apiHotels}
        tripDetails={tripDetails}
        isLoading={isSearchingHotels}
        onSearch={handlePerformHotelSearch}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTrip}
        title="Delete Trip"
        description="Are you sure you want to delete this trip and all related data? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}

function QuoteItemCard({
  item,
  icon,
  imageUrl,
  onEdit,
  onDelete,
  tripDetails,
}: {
  item: QuoteItem;
  icon: React.ReactNode;
  imageUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  tripDetails?: ApiTripDetails;
}) {
  const metadata = (item.metadata || {}) as any;

  if (item.type === "Flight") {
    const flightType = metadata.flight_type || (item as any).flight_type || "OUTBOUND";
    const duration = metadata.duration || (item as any).duration;
    const departure = metadata.departure_datetime || (item as any).departure_datetime;
    const arrival = metadata.arrival_datetime || (item as any).arrival_datetime;
    const stops = metadata.stops ?? (item as any).stops ?? 0;
    const carrierLogo = metadata.carrier_logo || (item as any).carrier_logo || imageUrl;

    return (
      <div className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-100 group hover:border-[#43ABFF]/30 transition-all hover:shadow-lg hover:shadow-blue-50/50 overflow-hidden">
        <div className="p-4 flex items-center gap-4 border-b border-gray-50">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
            {carrierLogo ? (
              <img src={carrierLogo} alt="Airline" className="w-full h-full object-contain p-1" />
            ) : (
              <Plane className={`h-5 w-5 ${flightType === 'RETURN' ? 'text-purple-600' : 'text-blue-600'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-[#000E19] text-sm sm:text-base truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={cn(
                    "text-[10px] h-5",
                    flightType === 'RETURN' ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-blue-50 text-blue-700 border-blue-100"
                  )}>
                    {flightType}
                  </Badge>
                  {metadata.travel_class && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-gray-50 text-gray-600 border-gray-200">
                      {metadata.travel_class}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {/* <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-gray-400 hover:text-[#43ABFF] hover:bg-blue-50">
                  <Pencil className="h-3.5 w-3.5" />
                </Button> */}
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-3 gap-4 bg-gray-50/30">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Departure</p>
            <div className="font-bold text-sm text-[#000E19]">{formatTime(departure)}</div>
            <div className="text-[10px] text-gray-500">{formatDate(departure || tripDetails?.departure_date)}</div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Duration</p>
            <div className="font-bold text-sm text-[#43ABFF]">
              {(() => {
                const formatted = formatDuration(duration);
                if (formatted && formatted !== "") return formatted;
                
                // Try to calculate from datetimes
                if (departure && arrival) {
                  try {
                    const diff = (new Date(arrival).getTime() - new Date(departure).getTime()) / 1000;
                    if (diff > 0) return formatDuration(diff);
                  } catch (e) {}
                }
                
                return "";
              })()}
            </div>
            <div className="text-[10px] text-gray-500">{stops === 0 ? "Non-stop" : `${stops} stop(s)`}</div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Arrival</p>
            <div className="font-bold text-sm text-[#000E19]">{formatTime(arrival)}</div>
            <div className="text-[10px] text-gray-500">{formatDate(arrival || tripDetails?.return_date)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === "Hotel") {
    const rating = metadata.rating !== null && metadata.rating !== undefined ? metadata.rating : "0.0";
    const reviewCount = metadata.review_count || 0;
    const starRating = metadata.star_rating || 0;
    const mainPhoto = metadata.main_photo_url || imageUrl;
    const roomType = metadata.room_type?.[0] || "Standard Room";
    
    // Calculate nights
    let nights = 1;
    if (tripDetails?.departure_date && tripDetails?.return_date) {
      const start = new Date(tripDetails.departure_date);
      const end = new Date(tripDetails.return_date);
      nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return (
      <div className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-100 group hover:border-[#43ABFF]/30 transition-all hover:shadow-lg hover:shadow-blue-50/50 overflow-hidden">
        <div className="p-4 flex gap-4 border-b border-gray-50">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
            {mainPhoto ? (
              <img src={mainPhoto} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-200">
                <Hotel className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h4 className="font-bold text-[#000E19] text-sm sm:text-base truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex text-orange-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-xs">{i < starRating ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">({rating} / {reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-gray-500 text-[10px]">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{metadata.country_code || "GB"}, {tripDetails?.destination || "City Center"}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-gray-400 hover:text-[#43ABFF] hover:bg-blue-50">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-3 gap-4 bg-gray-50/30 border-b border-gray-50">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Room Type</p>
            <div className="font-bold text-xs text-[#000E19] truncate">{roomType}</div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Duration</p>
            <div className="font-bold text-xs text-[#000E19]">{nights} nights</div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Check-in</p>
            <div className="font-bold text-xs text-[#000E19]">{tripDetails?.departure_date || ""}</div>
            {metadata.checkin_time && (
              <div className="text-[10px] text-gray-500 font-medium">
                {metadata.checkin_time.substring(0, 5)}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 flex justify-between items-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Price</span>
          <span className="font-bold text-lg text-[#000E19]">
            ${(Number(item.price) * (item.quantity || 1)).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-gray-100 group hover:border-[#43ABFF]/30 transition-all hover:shadow-lg hover:shadow-blue-50/50">
      <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[#000E19] text-sm sm:text-base md:text-lg truncate">
            {item.title}
          </h4>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate mt-0.5 sm:mt-1 font-medium">
            {item.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 shrink-0 border-t sm:border-none pt-3 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5 sm:mb-1">
            Price
          </p>
          <p className="font-bold text-base sm:text-lg md:text-xl text-[#000E19]">
            ${(Number(item.price) * (item.quantity || 1)).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 sm:opacity-0 group-hover:opacity-100 transition-all transform sm:translate-x-2 group-hover:translate-x-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 hover:text-[#43ABFF] hover:bg-blue-50 rounded-lg sm:rounded-xl">
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl">
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

