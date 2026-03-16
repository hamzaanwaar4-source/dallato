import { 
  User, 
  Calendar,
  Eye,  
  TrendingUp,
  Plane,
  Hotel,
  Clock,
  MapPin,
} from "lucide-react"
import { Quote } from "@/lib/types/bookings-quotes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ActivityTimeline } from "./activity-timeline"

interface QuoteDetailsViewProps {
  quote: Quote;
}

export function QuoteDetailsView({ quote }: QuoteDetailsViewProps) {
  // Formatting helpers
  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
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

  const formatDate = (dateStr: string | null | undefined) => {
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

  const formatDuration = (dur: string | number | null | undefined) => {
    if (!dur) return "N/A";
    if (typeof dur === "number") {
      const hours = Math.floor(dur / 3600);
      const minutes = Math.floor((dur % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    const match = dur.match(/P1DT(?:(\d+)H)?(?:(\d+)M)?/) || dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = match[1] ? `${match[1]}h ` : "";
      const minutes = match[2] ? `${match[2]}m` : "";
      return (hours + minutes).trim() || dur;
    }
    return dur.replace("P1DT", "").toLowerCase();
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-[#F8F9FA] text-gray-500",
    INITIAL_CONTACT: "bg-[#FFF0F0] text-[#EE5D50]",
    QUOTE_SENT: "bg-[#E6F4FF] text-[#43ABFF]",
    IN_NEGOTIATION: "bg-[#FFF9E6] text-[#FFB800]",
    ACCEPTED: "bg-[#E6F9F1] text-[#00B69B]",
    DECLINED: "bg-[#FFF0F0] text-[#EE5D50]",
    VIEWED: "bg-[#E6F9F1] text-[#00B69B]",
    EXPIRED: "bg-[#FFF0F0] text-[#EE5D50]",
    // Legacy mappings
    Sent: "bg-[#E6F4FF] text-[#43ABFF]",
    Draft: "bg-[#F8F9FA] text-gray-500",
    Viewed: "bg-[#E6F9F1] text-[#00B69B]",
    Accepted: "bg-[#E6F9F1] text-[#00B69B]",
    Declined: "bg-[#FFF0F0] text-[#EE5D50]",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-8 space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#000E19]">
            {quote.quoteNumber}
          </h2>
        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#43ABFF]" />
            <span className="font-medium">Agent:</span> {quote.agentName}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#43ABFF]" />
            {quote.travelDates}
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#43ABFF]" />
            <span className="font-medium">Client:</span> {quote.clientName}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#E6F4FF] p-6 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Destination
              </span>
              <MapPin className="h-4 w-4 text-[#00B69B]" />
            </div>
            <div className="text-2xl font-bold text-[#000E19]">
              {quote.destination.split(",")[0]}
            </div>
          </div>

          <div className="bg-[#E6F4FF] p-6 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                Quote Value
              </span>
              <TrendingUp className="h-4 w-4 text-[#00B69B]" />
            </div>
            <div className="text-2xl font-bold text-[#000E19]">
              {quote.value}
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-2xl space-y-2 relative overflow-hidden",
            statusColors[quote.status] || "bg-gray-100 text-gray-500"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-70">Status</span>
              <TrendingUp className="h-4 w-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold truncate">
              {formatStatus(quote.status)}
            </div>
          </div>
        </div>

        {/* Flights Section */}
        {quote.flights && quote.flights.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-gray-400">
                <Plane className="h-5 w-5" />
                <h3 className="font-bold text-xs uppercase tracking-[0.2em]">
                  Flights
                </h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Flight Cost</p>
                <p className="font-bold text-base text-[#000E19]">
                  {quote.currency || "USD"} {quote.flights.reduce((sum: number, f: any) => sum + parseFloat(f.price_per_seat || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {quote.flights.map((flight: any) => (
                <div
                  key={flight.id}
                  className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-100 group hover:border-[#43ABFF]/30 transition-all hover:shadow-lg hover:shadow-blue-50/50 overflow-hidden"
                >
                  <div className="p-4 flex items-center gap-4 border-b border-gray-50">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {flight.carrier_logo ? (
                        <img
                          src={flight.carrier_logo}
                          alt={flight.carrier}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Plane className={`h-5 w-5 ${flight.flight_type === 'RETURN' ? 'text-purple-600' : 'text-blue-600'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-[#000E19] text-sm sm:text-base truncate">
                            {flight.carrier} {flight.flight_number && `#${flight.flight_number}`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                flight.flight_type === "RETURN"
                                  ? "bg-purple-50 text-purple-700 border-purple-100"
                                  : "bg-blue-50 text-blue-700 border-blue-100"
                              }`}
                            >
                              {flight.flight_type}
                            </span>
                            {flight.travel_class && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-full font-medium">
                                {flight.travel_class}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* <div className="text-right">
                          <div className="text-lg font-bold text-[#000E19]">
                            {flight.flight_currency}{" "}
                            {parseFloat(flight.price_per_seat).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold">
                            per seat
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-3 gap-4 bg-gray-50/30">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Departure</p>
                      <div className="font-bold text-sm text-[#000E19]">
                        {formatTime(flight.departure_datetime)}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {formatDate(flight.departure_datetime)}
                      </div>
                      <div className="text-xs font-medium text-gray-900 mt-1">
                        {flight.departure_airport}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Duration</p>
                      <div className="font-bold text-sm text-[#43ABFF]">
                        {(() => {
                          const formatted = formatDuration(flight.duration);
                          if (formatted && formatted !== "N/A") return formatted;
                          
                          if (flight.departure_datetime && flight.arrival_datetime) {
                            try {
                              const diff = (new Date(flight.arrival_datetime).getTime() - new Date(flight.departure_datetime).getTime()) / 1000;
                              if (diff > 0) return formatDuration(diff);
                            } catch (e) {}
                          }
                          
                          return "";
                        })()}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {flight.stops === 0
                          ? "Non-stop"
                          : `${flight.stops} stop(s)`}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Arrival</p>
                      <div className="font-bold text-sm text-[#000E19]">
                        {formatTime(flight.arrival_datetime)}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {formatDate(flight.arrival_datetime)}
                      </div>
                      <div className="text-xs font-medium text-gray-900 mt-1">
                        {flight.arrival_airport}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hotels Section */}
        {quote.hotels && quote.hotels.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#000E19] flex items-center gap-2">
              <Hotel className="h-5 w-5 text-[#43ABFF]" />
              Accommodation
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {quote.hotels.map((hotel: any) => (
                <div
                  key={hotel.id}
                  className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col md:flex-row"
                >
                  <div className="w-full md:w-48 h-32 md:h-auto bg-gray-100 shrink-0 relative">
                    {hotel.main_photo_url ? (
                      <img
                        src={hotel.main_photo_url}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Hotel className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="font-bold text-lg text-[#000E19]">
                          {hotel.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {/* <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {hotel.country_code?.toUpperCase() || "N/A"}
                          </div> */}
                          {hotel.star_rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs ${
                                    i < hotel.star_rating
                                      ? "text-yellow-400"
                                      : "text-gray-200"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {hotel.rating && (
                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-sm font-bold border border-green-100">
                          {parseFloat(hotel.rating).toFixed(1)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-auto">
                      <div className="flex flex-wrap gap-2">
                        {hotel.room_type?.map((room: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium"
                          >
                            {room.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#000E19]">
                          {hotel.hotel_currency}{" "}
                          {parseFloat(hotel.price_total).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">
                          total price
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Section */}
        <div className="bg-[#F8F9FA] p-4 md:p-8 rounded-2xl">
          <ActivityTimeline activities={quote.activityTimeline} />
        </div>
      </div>
    </div>
  );
}
