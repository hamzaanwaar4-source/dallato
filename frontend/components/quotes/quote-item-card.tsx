"use client"

import { Plane, Hotel, MapPin, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QuoteItem } from "@/lib/types/quotes"
import { ApiTripDetails } from "@/lib/types/quoteAssistant"
import { cn } from "@/lib/utils"

interface QuoteItemCardProps {
  item: QuoteItem;
  icon?: React.ReactNode;
  imageUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  tripDetails?: ApiTripDetails;
  returnItem?: QuoteItem;
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return "";
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
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
};

const formatDuration = (dur: string | number) => {
  if (!dur) return "";
  
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

export function QuoteItemCard(props: QuoteItemCardProps) {
  const {
    item,
    icon,
    imageUrl,
    onEdit,
    onDelete,
    tripDetails,
  } = props;
  const metadata = (item.metadata || {}) as any;

  if (item.type === "Flight") {
    const flightType = metadata.flight_type || (item as any).flight_type || "OUTBOUND";
    const duration = metadata.duration || (item as any).duration;
    const departure = metadata.departure_datetime || (item as any).departure_datetime;
    const arrival = metadata.arrival_datetime || (item as any).arrival_datetime;
    const stops = metadata.stops ?? (item as any).stops ?? 0;
    const carrierLogo = metadata.carrier_logo || (item as any).carrier_logo || imageUrl;

    const renderFlightLeg = (legMetadata: any, isReturn: boolean = false) => {
        const departure = legMetadata.departure_datetime || legMetadata.departure;
        const arrival = legMetadata.arrival_datetime || legMetadata.arrival;
        const duration = legMetadata.duration;
        const stops = legMetadata.stops ?? 0;

        return (
            <div className={`grid grid-cols-3 gap-4 ${isReturn ? 'pt-4 border-t border-dashed border-gray-100' : ''}`}>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{isReturn ? 'Return' : 'Departure'}</p>
                <div className="font-bold text-sm text-[#000E19]">{formatTime(departure)}</div>
                <div className="text-[10px] text-gray-500">{formatDate(departure || tripDetails?.departure_date)}</div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Duration</p>
                <div className="font-bold text-sm text-[#43ABFF]">
                  {(() => {
                    const formatted = formatDuration(duration);
                    if (formatted && formatted !== "") return formatted;
                    
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
        );
    };

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
                    {props.returnItem ? 'Round Trip' : flightType}
                  </Badge>
                  {metadata.travel_class && (
                    <Badge variant="outline" className="text-[10px] h-5 bg-gray-50 text-gray-600 border-gray-200">
                      {metadata.travel_class}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-gray-400 hover:text-[#43ABFF] hover:bg-blue-50">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50/30 flex flex-col gap-4">
           {renderFlightLeg(metadata, false)}
           {props.returnItem && renderFlightLeg(props.returnItem.metadata || {}, true)}
        </div>

        <div className="px-4 py-3 flex justify-between items-center border-t border-gray-50">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Price</span>
          <span className="font-bold text-lg text-[#000E19]">
            ${(Number(item.price) * (item.quantity || 1)).toLocaleString()}
          </span>
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
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-gray-400 hover:text-[#43ABFF] hover:bg-blue-50">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
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
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#43ABFF]/30 transition-all shadow-sm">
      {imageUrl ? (
        <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border border-gray-100">
          <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-16 w-16 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#000E19] text-sm sm:text-base truncate">{item.title}</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 mt-0.5 font-medium">{item.description}</p>
          </div>
          <div className="text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
            {/* <p className="font-bold text-base sm:text-lg text-[#000E19]">${(Number(item.price) * (item.quantity || 1)).toLocaleString()}</p> */}
          </div>
        </div>
      </div>
    </div>
  )
}
