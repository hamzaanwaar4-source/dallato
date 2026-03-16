"use client"

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Users, 
  Plane, 
  Hotel, 
  MapPin, 
  Clock, 
  DollarSign,
  Info,
  Car,
  FileDown,
  Pencil,
  Trash2
} from "lucide-react"
import { Quote, QuoteItem } from "@/lib/types/quotes"
import { ApiTripDetails } from "@/lib/types/quoteAssistant"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { QuoteItemCard } from "@/components/quotes/quote-item-card"

interface QuotePreviewModalProps {
  quote: Quote | null
  isOpen: boolean
  onClose: () => void
  onExportPDF?: (id: string) => void
}

const statusStyles: Record<string, string> = {
  Booked: "bg-green-50 text-green-600 border-green-100",
  Ready: "bg-green-50 text-green-600 border-green-100"
  // Confirmed: "bg-green-50 text-green-600 border-green-100",
  // Draft: "bg-gray-50 text-gray-600 border-gray-100",
  // Pending: "bg-blue-50 text-blue-600 border-blue-100",
  // Sent: "bg-blue-50 text-blue-600 border-blue-100",
  // Viewed: "bg-purple-50 text-purple-600 border-purple-100",
}

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

export function QuotePreviewModal({ quote, isOpen, onClose, onExportPDF }: QuotePreviewModalProps) {
  if (!quote) return null

  const flights = quote.items.filter(item => item.type === 'Flight')
  const hotels = quote.items.filter(item => item.type === 'Hotel')
  const others = quote.items.filter(item => !['Flight', 'Hotel', 'Itinerary'].includes(item.type) && !item.day)
  
  const tripDetails: ApiTripDetails = {
    destination: quote.destination || "",
    origin: (flights[0]?.metadata as any)?.outbound?.from_airport || "",
    origin_airport: (flights[0]?.metadata as any)?.outbound?.from_airport || "",
    destination_airport: (flights[0]?.metadata as any)?.outbound?.to_airport || "",
    departure_date: quote.startDate || "",
    return_date: quote.endDate || "",
    adults: quote.travelerCount || 1,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[95vh] sm:h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-2xl rounded-2xl bg-white">
        <DialogHeader className="p-4 sm:p-6 border-b bg-white shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pr-8">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-[#000E19]">{quote.destination}</DialogTitle>
                {/* <Badge variant="outline" className={cn("text-[10px] px-2.5 py-0.5 h-6 font-bold border uppercase tracking-wider", statusStyles[quote.status] || "bg-gray-50 text-gray-500 border-gray-100")}>
                  {quote.status === 'Approved' ? 'Ready': quote.status}
                </Badge> */}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 font-medium">
                <span className="text-[#43ABFF]">{quote.clientName}</span>
                <span className="hidden sm:inline">•</span>
                <span>Q-{quote.id}</span>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-2">
              <div className="flex items-center gap-2">
                {onExportPDF && (
                  <button 
                    onClick={() => onExportPDF(quote.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#43ABFF] hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Export PDF
                  </button>
                )}
              </div>
              {/* <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5 sm:mb-1">Total Amount</p>
                <p className="text-xl sm:text-2xl font-bold text-[#43ABFF]">{quote.price}</p>
              </div> */}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 w-full">
          <div className="p-4 sm:p-6 space-y-8 sm:space-y-10">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#43ABFF]" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Travel Dates</p>
                  <p className="font-bold text-sm">
                    {quote.startDate && quote.endDate 
                      ? `${formatDate(quote.startDate)} - ${formatDate(quote.endDate)}`
                      : 'Dates Pending'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Travelers</p>
                  <p className="font-bold text-sm">{quote.travelerCount || 1} Person</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Currency</p>
                  <p className="font-bold text-sm">USD</p>
                </div>
              </div>
            </div>

            {/* Components */}
            <div className="space-y-8">
              {/* Flights */}
              {flights.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Plane className="h-5 w-5" />
                    <h4 className="font-bold text-xs uppercase tracking-widest">Flights</h4>
                  </div>
                  <div className="grid gap-4">
                    {flights.map((item, idx) => (
                      <QuoteItemCard 
                        key={idx} 
                        item={item} 
                        icon={<Plane className="h-5 w-5 text-blue-500" />} 
                        tripDetails={tripDetails}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Hotels */}
              {hotels.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Hotel className="h-5 w-5" />
                    <h4 className="font-bold text-xs uppercase tracking-widest">Accommodations</h4>
                  </div>
                  <div className="grid gap-4">
                    {hotels.map((item, idx) => (
                      <QuoteItemCard 
                        key={idx} 
                        item={item} 
                        icon={<Hotel className="h-5 w-5 text-purple-500" />} 
                        tripDetails={tripDetails}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary */}
              {quote.itineraryDays && quote.itineraryDays.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="h-5 w-5" />
                    <h4 className="font-bold text-xs uppercase tracking-widest">Daily Itinerary</h4>
                  </div>
                  <div className="space-y-8">
                    {quote.itineraryDays.map((day, idx) => (
                      <div key={idx} className="relative pl-8 border-l-2 border-blue-100 pb-2 last:pb-0">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-4 border-[#43ABFF] shadow-sm" />
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h5 className="font-bold text-[#000E19] text-lg">
                              {day.day.toString().toLowerCase().includes('day') ? day.day : `Day ${day.day}`}: {day.title}
                            </h5>
                            {day.date && <p className="text-xs text-gray-400 font-medium">{formatDate(day.date)}</p>}
                          </div>
                        </div>
                        <div className="grid gap-4">
                          {day.activities.map((activity, actIdx) => (
                            <div key={actIdx} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#43ABFF]/30 transition-all shadow-sm">
                              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-gray-100">
                                <MapPin className="h-5 w-5 text-orange-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#000E19] text-sm sm:text-base truncate">{activity.title}</h4>
                                    <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 mt-0.5 font-medium">{activity.description}</p>
                                    {activity.location && (
                                      <div className="flex items-center gap-1 mt-2">
                                        <MapPin className="h-3 w-3 text-gray-400" />
                                        <span className="text-gray-400 text-[10px] font-medium">{activity.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto shrink-0 gap-4 sm:gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                                    {/* {activity.price !== undefined && (
                                      <p className="font-bold text-[#43ABFF] text-base sm:text-lg">${activity.price.toLocaleString()}</p>
                                    )} */}
                                    {(activity.start_time || activity.end_time) && (
                                      <div className="text-right">
                                        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold">Time</p>
                                        <p className="font-bold text-[11px] sm:text-xs text-[#000E19]">
                                          {activity.start_time || ''} {activity.end_time ? `- ${activity.end_time}` : ''}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Others */}
              {others.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Info className="h-5 w-5" />
                    <h4 className="font-bold text-xs uppercase tracking-widest">Other Services</h4>
                  </div>
                  <div className="grid gap-4">
                    {others.map((item, idx) => (
                      <QuoteItemCard key={idx} item={item} icon={<Car className="h-5 w-5 text-orange-500" />} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Price Summary */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="font-bold text-[#000E19] text-lg uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Price Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Flights Total</span>
                  <span className="font-bold text-[#000E19]">
                    ${(quote.priceSummary?.flightsTotal || flights.reduce((sum, f) => sum + Number(f.price), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Accommodations Total</span>
                  <span className="font-bold text-[#000E19]">
                    ${(quote.priceSummary?.hotelsTotal || hotels.reduce((sum, h) => sum + Number(h.price), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {quote.priceSummary && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Agent Commission ({quote.priceSummary.agentCommissionPercent}%)</span>
                      <span className="font-bold text-[#000E19]">
                        ${quote.priceSummary.agentCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Agency Commission ({quote.priceSummary.agencyCommissionPercent}%)</span>
                      <span className="font-bold text-[#000E19]">
                        ${quote.priceSummary.agencyCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-[#000E19] text-lg">Total Amount</span>
                  <span className="font-bold text-2xl text-[#43ABFF]">
                    ${(quote.priceSummary?.totalAmount || (quote.price ? parseFloat(quote.price.replace(/[^0-9.]/g, '')) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}


