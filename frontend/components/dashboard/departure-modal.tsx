"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, MapPin, ChevronLeft, ChevronLeftIcon, Calendar, Clock, Hotel, Info, Car } from "lucide-react"
import { DepartureItem } from "@/lib/types/dashboard"
import { Quote, QuoteItem } from "@/lib/types/quotes"
import { getDetailedQuote } from "@/lib/api/quotes.api"
import { QuoteItemCard } from "@/components/quotes/quote-item-card"
import { QuoteItemSkeleton } from "@/components/quotes/quote-item-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface DepartureModalProps {
  isOpen: boolean;
  onClose: () => void;
  departures: DepartureItem[];
}

export function DepartureModal({ isOpen, onClose, departures }: DepartureModalProps) {
  const [selectedDeparture, setSelectedDeparture] = useState<DepartureItem | null>(null);
  const [quoteDetails, setQuoteDetails] = useState<Record<string, Quote>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'high': return '!border-[var(--primary-skyblue)]';
      case 'medium': return '!border-[var(--primary-skyblue)]/20';
      case 'low': return '!border-[var(--primary-skyblue)]/30';
      default: return '!border-[var(--primary-skyblue)]/50';
    }
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]';
      case 'medium': return 'bg-[var(--primary-skyblue)]/20 hover:bg-[var(--primary-skyblue)]/20';
      case 'low': return 'bg-[var(--primary-skyblue)]/30 hover:bg-[var(--primary-skyblue)]/30';
      default: return 'bg-[var(--primary-skyblue)]/50 hover:bg-[var(--primary-skyblue)]/50';
    }
  };

  const getAvatarColor = (name: string) => {
    // const firstChar = name.charAt(0).toLowerCase();
    return 'bg-[var(--primary-skyblue)] text-white';
  };

  const handleOpenDetails = async (departure: DepartureItem) => {
    setSelectedDeparture(departure);

    // If we already have details, don't fetch again
    if (departure.quoteId && quoteDetails[departure.quoteId]) {
      return;
    }

    if (!departure.quoteId) {
       // If no quoteId, we can't fetch details easily yet
       return;
    }

    setLoadingDetails(prev => ({ ...prev, [departure.quoteId!]: true }));

    try {
      const details = await getDetailedQuote(departure.quoteId);
      setQuoteDetails(prev => ({ ...prev, [departure.quoteId!]: details }));
    } catch (error) {
      console.error("Failed to fetch quote details:", error);
      toast.error("Failed to load details");
    } finally {
      setLoadingDetails(prev => ({ ...prev, [departure.quoteId!]: false }));
    }
  };

  const handleCloseDetails = () => {
    setSelectedDeparture(null);
  };
  
  // Helper to render details content
  const renderDetailsPanel = () => {
    if (!selectedDeparture) return null;
    
    const isLoading = selectedDeparture.quoteId ? loadingDetails[selectedDeparture.quoteId] : false;
    const quote = selectedDeparture.quoteId ? quoteDetails[selectedDeparture.quoteId] : undefined;

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-[var(--primary-skyblue)]/20 p-10 border-b border-[var(--primary-skyblue)] sticky top-0 z-[60] flex items-center gap-4 shrink-0 h-[100px] box-border">
          {/* Mobile Back Button - visible only on small screens when this panel is active */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-8 w-8 -ml-2 text-gray-500 hover:text-gray-900 shrink-0" 
            onClick={handleCloseDetails}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex h-8 w-8 text-gray-400 hover:text-gray-900 -mr-2" 
            onClick={handleCloseDetails}
            title="Close details"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
             <div className="hidden md:flex h-10 w-10 rounded-xl bg-[var(--primary-skyblue)] items-center justify-center shrink-0">
               <div className="text-white font-bold text-lg">{selectedDeparture.name.charAt(0)}</div>
             </div>
             <div className="min-w-0">
                 <h3 className="text-lg font-bold text-gray-900 truncate">
                    {selectedDeparture.name}
                 </h3>
                 <p className="flex items-center gap-2 text-sm text-gray-500 truncate mt-0.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {selectedDeparture.location}
                 </p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1">Departure</p>
                <p className="text-sm font-bold text-gray-900">{selectedDeparture.departureDate}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedDeparture.time}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1">Return</p>
                <p className="text-sm font-bold text-gray-900">{selectedDeparture.returnDate}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Skeleton className="h-6 w-32 bg-gray-200 rounded-md" />
                <div className="grid gap-4">
                    <QuoteItemSkeleton />
                    <QuoteItemSkeleton />
                    <QuoteItemSkeleton />
                </div>
              </div>
            ) : quote ? (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                
                {(() => {
                    const flights = quote.items.filter(i => i.type === 'Flight');
                    const hotels = quote.items.filter(i => i.type === 'Hotel');
                    const others = quote.items.filter(i => !['Flight', 'Hotel', 'Itinerary', 'Tour'].includes(i.type));
                    
                    // Group flights
                    const processedFlights: { outbound: QuoteItem, return?: QuoteItem }[] = [];
                    const usedIndices = new Set<number>();
                    
                    flights.forEach((item, index) => {
                    if (usedIndices.has(index)) return;
                    
                    const meta = item.metadata as any;
                    if (meta?.flight_type === 'OUTBOUND') {
                        const returnIndex = flights.findIndex((f, i) => 
                        !usedIndices.has(i) && 
                        (f.metadata as any)?.flight_type === 'RETURN' &&
                        f.title === item.title
                        );
                        
                        if (returnIndex !== -1) {
                        processedFlights.push({
                            outbound: item,
                            return: flights[returnIndex]
                        });
                        usedIndices.add(index);
                        usedIndices.add(returnIndex);
                        } else {
                        processedFlights.push({ outbound: item });
                        usedIndices.add(index);
                        }
                    } else if (!usedIndices.has(index)) {
                        processedFlights.push({ outbound: item });
                        usedIndices.add(index);
                    }
                    });

                    return (
                    <>
                        {/* Flights */}
                        {processedFlights.length > 0 && (
                            <div className="space-y-5">
                                <div className="flex items-center gap-2.5 text-gray-400">
                                    <Plane className="h-5 w-5" />
                                    <h4 className="font-bold text-xs uppercase tracking-[0.2em]">
                                        Flights
                                    </h4>
                                </div>
                                <div className="grid gap-4">
                                    {processedFlights.map((group, idx) => (
                                        <QuoteItemCard 
                                            key={`flight-group-${idx}`} 
                                            item={group.outbound}
                                            returnItem={group.return} 
                                            tripDetails={{
                                                destination: quote.destination,
                                                origin: quote.fromAirport || '',
                                                origin_airport: quote.fromAirport || '',
                                                destination_airport: quote.toAirport || '',
                                                departure_date: quote.startDate || '',
                                                return_date: quote.endDate || '',
                                                adults: quote.travelerCount || 1
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels */}
                        {hotels.length > 0 && (
                            <div className="space-y-5">
                                <div className="flex items-center gap-2.5 text-gray-400">
                                    <Hotel className="h-5 w-5 text-purple-500" />
                                    <h4 className="font-bold text-xs uppercase tracking-[0.2em]">
                                        Accommodations
                                    </h4>
                                </div>
                                <div className="grid gap-4">
                                    {hotels.map((item, idx) => (
                                        <QuoteItemCard 
                                            key={`hotel-${idx}`} 
                                            item={item} 
                                            tripDetails={{
                                                destination: quote.destination,
                                                origin: quote.fromAirport || '',
                                                origin_airport: quote.fromAirport || '',
                                                destination_airport: quote.toAirport || '',
                                                departure_date: quote.startDate || '',
                                                return_date: quote.endDate || '',
                                                adults: quote.travelerCount || 1
                                            }}
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
                                <div className="grid gap-4">
                                    {others.map((item, idx) => (
                                        <QuoteItemCard 
                                            key={`other-${idx}`} 
                                            item={item} 
                                            tripDetails={{
                                                destination: quote.destination,
                                                origin: quote.fromAirport || '',
                                                origin_airport: quote.fromAirport || '',
                                                destination_airport: quote.toAirport || '',
                                                departure_date: quote.startDate || '',
                                                return_date: quote.endDate || '',
                                                adults: quote.travelerCount || 1
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Day-wise Itinerary */}
                        {quote.itineraryDays && quote.itineraryDays.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2.5 text-gray-400">
                                    <Calendar className="h-5 w-5" />
                                    <h4 className="font-bold text-xs uppercase tracking-[0.2em]">
                                        Daily Itinerary
                                    </h4>
                                </div>
                                <div className="bg-[#F8F9FA] rounded-2xl border border-gray-100 p-6 space-y-8">
                                    {quote.itineraryDays.map((day, dayIdx) => (
                                        <div
                                            key={dayIdx}
                                            className="relative pl-8 border-l-2 border-blue-100 last:pb-0 pb-10"
                                        >
                                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-4 border-[var(--primary-skyblue)] shadow-sm" />
                                            <div className="flex flex-col mb-4 gap-1">
                                                <h5 className="font-bold text-gray-900 text-base">
                                                    {day.day}
                                                </h5>
                                                {day.date && (
                                                    <p className="text-xs text-gray-400 font-medium">
                                                        {new Date(day.date).toLocaleDateString("en-US", {
                                                            weekday: "long",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                )}
                                                
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                {day.activities.length > 0 ? (
                                                    day.activities.map((activity, actIdx) => (
                                                        <div
                                                            key={`${dayIdx}-${actIdx}-${activity.title}`}
                                                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                                                        >
                                                            <div className="flex justify-between items-start gap-3">
                                                                <div className="flex gap-4 flex-1">
                                                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                                                        <MapPin className="h-5 w-5 text-gray-400 group-hover:text-[var(--primary-skyblue)] transition-colors" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="font-bold text-gray-900 text-sm">
                                                                            {activity.title}
                                                                        </h4>
                                                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                                            {activity.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {activity.start_time && (
                                                                    <div className="px-2 py-1 bg-[#F8F9FA] rounded-md text-[10px] text-gray-900 font-bold flex items-center gap-1 border border-gray-100 shrink-0">
                                                                        <Clock className="h-3 w-3 text-[var(--primary-skyblue)]" />
                                                                        {activity.start_time}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-gray-400 italic">No activities planned for this day.</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Fallback if nothing exists */}
                        {quote.items.length === 0 && (!quote.itineraryDays || quote.itineraryDays.length === 0) && (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500 italic">No detailed items found for this trip.</p>
                            </div>
                        )}
                    </>
                    );
                })()}

                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                  <h5 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4">Price Breakdown</h5>
                  <div className="space-y-3">
                    {quote.priceSummary ? (
                      <>
                        {quote.priceSummary.flightsTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Flights</span>
                            <span className="font-medium text-gray-900">
                              ${quote.priceSummary.flightsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        {quote.priceSummary.hotelsTotal > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Hotels</span>
                            <span className="font-medium text-gray-900">
                              ${quote.priceSummary.hotelsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm pt-2 border-t border-dashed border-gray-200">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-900">
                            ${quote.priceSummary.baseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {quote.priceSummary.agentCommission > 0 && (
                           <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Agent Commission ({quote.priceSummary.agentCommissionPercent}%)</span>
                            <span className="font-medium text-gray-900">
                              ${quote.priceSummary.agentCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        {quote.priceSummary.agencyCommission > 0 && (
                           <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Agency Commission ({quote.priceSummary.agencyCommissionPercent}%)</span>
                            <span className="font-medium text-gray-900">
                              ${quote.priceSummary.agencyCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
                            <div>
                                <span className="block font-bold text-lg text-gray-900">Total Price</span>
                                <span className="text-xs text-gray-500 font-medium">All-inclusive</span>
                            </div>
                            <span className="font-bold text-2xl text-[var(--primary-skyblue)]">
                              ${quote.priceSummary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Fare</span>
                            <span className="font-medium text-gray-900">
                            ${quote.items.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Taxes & Fees</span>
                            <span className="font-medium text-gray-900">Included</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
                            <div>
                                <span className="block font-bold text-lg text-gray-900">Total Amount</span>
                            </div>
                            <span className="font-bold text-2xl text-[var(--primary-skyblue)]">
                            ${quote.items.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p>
                  {selectedDeparture.quoteId ? "Could not load details." : "No detailed quote information linked to this departure."}
                </p>
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
            className={`
                w-[95vw] z-[10000] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl
                transition-all duration-300 ease-in-out [&>button]:z-[100]
                ${selectedDeparture ? 'sm:max-w-[1200px]' : 'sm:max-w-[800px]'}
            `}
        >
          <div className="flex h-full overflow-hidden">
             
             {/* Left Panel: List (Hidden on mobile if details selected) */}
             <div className={`
                flex flex-col h-full bg-white transition-all duration-300
                ${selectedDeparture ? 'hidden md:flex w-full md:w-[60%] lg:w-[50%] border-r border-gray-100' : 'w-full'}
             `}>
                {/* Header */}
                <div className="bg-[var(--primary-skyblue)]/20 p-6 border-b border-[var(--primary-skyblue)] flex items-start justify-between shrink-0">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[var(--primary-skyblue)] flex items-center justify-center shrink-0">
                      <Plane className="h-5 w-5 text-white -rotate-45" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-gray-900">
                        Upcoming Departures
                      </DialogTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Next 7 days • {departures.length} departures
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-4 overflow-y-auto bg-white flex-1">
                  {departures.map((departure, index) => {
                     const isSelected = selectedDeparture?.id === departure.id;
                     return (
                      <div 
                        key={index} 
                        className={`
                            rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer group
                            ${isSelected 
                                ? 'border-[var(--primary-skyblue)] bg-[var(--primary-skyblue)]/5 ring-1 ring-[var(--primary-skyblue)]' 
                                : `${getBorderColor(departure.urgentLevel || 'low')} bg-white hover:shadow-md hover:border-[var(--primary-skyblue)]/50`
                            }
                        `}
                        onClick={() => handleOpenDetails(departure)}
                      >
                        <div className="p-5">
                          <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                            <div className="flex items-start gap-4 w-full sm:w-auto">
                              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium shrink-0 ${getAvatarColor(departure.name)}`}>
                                {departure.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                  <h4 className="font-bold text-gray-900 text-base truncate group-hover:text-[var(--primary-skyblue)] transition-colors">{departure.name}</h4>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 truncate">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  {departure.location}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 self-start sm:self-center">
                               <Badge className={`${getBadgeColor(departure.urgentLevel || 'low')} px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wide border-none`}>
                                {departure.statusLabel}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={`rounded-xl p-4 border transition-colors ${isSelected ? 'bg-white border-[var(--primary-skyblue)]/20' : 'bg-gray-50/50 border-gray-100 group-hover:bg-blue-50/30'}`}>
                              <p className="text-xs text-gray-400 font-medium mb-1">Departure</p>
                              <p className="text-sm font-bold text-gray-900">{departure.departureDate}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{departure.time}</p>
                            </div>
                            <div className={`rounded-xl p-4 border transition-colors ${isSelected ? 'bg-white border-[var(--primary-skyblue)]/20' : 'bg-gray-50/50 border-gray-100 group-hover:bg-blue-50/30'}`}>
                              <p className="text-xs text-gray-400 font-medium mb-1">Return</p>
                              <p className="text-sm font-bold text-gray-900">{departure.returnDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                     );
                  })}
                </div>

                {!selectedDeparture && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                    <p className="text-sm text-gray-500">
                      {departures.filter(d => d.urgentLevel === 'high').length} urgent departures require immediate attention
                    </p>
                    <Button onClick={onClose} className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-white px-6">
                      Close
                    </Button>
                  </div>
                )}
             </div>

            {/* Right Panel: Details (Visible when selected) */}
            {selectedDeparture && (
                <div className="flex-1 w-full md:w-[40%] lg:w-[50%] h-full animate-in slide-in-from-right-10 duration-500 bg-white">
                    {renderDetailsPanel()}
                </div>
            )}
            
          </div>
        </DialogContent>
    </Dialog>
  )
}
