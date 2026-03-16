"use client"

import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QuoteItem } from "@/lib/types/quotes"
import { Client } from "@/lib/types/clients"
import { Badge } from "@/components/ui/badge"
import { X, Star, MapPin, Building2, Wifi, Coffee, Bus, Sparkles, Wine, AlertCircle, Plane } from "lucide-react"

interface HotelSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (hotel: QuoteItem) => void
  client: Client | null
  results?: QuoteItem[]
  tripDetails?: any
  isLoading?: boolean
  onSearch?: () => void
  selectedFlights?: QuoteItem[]
}

export function HotelSearchModal({ isOpen, onClose, onSelect, client, results, tripDetails, isLoading, onSearch, selectedFlights = [] }: HotelSearchModalProps) {
  const displayHotels = results || []
  
  // Calculate nights if dates are available
  const nights = tripDetails?.departure_date && tripDetails?.return_date 
    ? Math.ceil((new Date(tripDetails.return_date).getTime() - new Date(tripDetails.departure_date).getTime()) / (1000 * 60 * 60 * 24))
    : 6

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Search Hotels</DialogTitle>
        {/* Header */}
        <div className="bg-[var(--primary)] p-4 md:p-6 text-white relative">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Search Hotel</h2>
              <p className="text-blue-100 opacity-90 text-sm md:text-base">Prepared for {client?.name || "Client"}</p>
            </div>
            <div className="absolute top-4 right-4 flex flex-col items-end">
              <DialogClose className="text-white/80 hover:text-white transition-colors mb-4">
                <X className="h-6 w-6" />
              </DialogClose>
              {/* <p className="text-sm text-blue-100 text-right">Date:<br className="hidden sm:inline"/> {tripDetails?.departure_date || "08/12/2025"}</p> */}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Search Form */}
          <div className="mb-8 space-y-4">
            {/* Selected Flight Context */}
          {selectedFlights.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Plane className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">Selected Flight</span>
              </div>
              <div className="flex flex-wrap gap-6">
                {selectedFlights.map((flight, idx) => {
                  const metadata = (flight.metadata || {}) as any;
                  const outbound = metadata.outbound || {};
                  const returnFlight = metadata.return || {};
                  
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-blue-100 overflow-hidden shrink-0">
                        {metadata.carrier_logo ? (
                          <img src={metadata.carrier_logo as string} alt={flight.title} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Plane className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{flight.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{outbound.departure_airport} → {outbound.arrival_airport}</span>
                          <span>•</span>
                          <span>{outbound.departure ? new Date(outbound.departure).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}</span>
                          {returnFlight.departure && (
                            <>
                              <span>•</span>
                              <span>Return: {new Date(returnFlight.departure).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h3 className="font-bold text-gray-900">Find the best hotels for your trip</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-normal">Check-in Date</Label>
                <Input defaultValue={tripDetails?.departure_date || "08/12/2025"} className="bg-gray-50 border-gray-100 font-medium" disabled/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-normal">Check-out Date</Label>
                <Input defaultValue={tripDetails?.return_date || "14/12/2025"} className="bg-gray-50 border-gray-100 font-medium" disabled/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-normal">Nights</Label>
                <Input defaultValue={nights.toString()} className="bg-gray-50 border-gray-100 font-medium" disabled/>
              </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-normal">Rooms</Label>
                <Input defaultValue="1" className="bg-gray-50 border-gray-100 font-medium" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-normal">Adults</Label>
                <Input defaultValue="1" className="bg-gray-50 border-gray-100 font-medium" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-normal">Children</Label>
                <Input defaultValue="0" className="bg-gray-50 border-gray-100 font-medium" />
              </div>
            </div> */}

            <Button 
              className="w-full bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white h-11 text-base font-medium mt-2"
              onClick={onSearch}
            >
              Search Hotel
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-6 pb-12">
            {isLoading ? (
              // Skeleton Loader
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 md:p-5 bg-white animate-pulse">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between">
                        <div className="h-6 w-48 bg-gray-200 rounded"></div>
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-4 w-32 bg-gray-100 rounded"></div>
                      <div className="h-4 w-24 bg-gray-100 rounded"></div>
                      <div className="h-10 w-32 bg-gray-200 rounded mt-4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              displayHotels.map((hotel, index) => (
                <div key={index} className="border border-[var(--primary-skyblue)] rounded-xl p-4 md:p-5 bg-white shadow-sm relative overflow-hidden">
                  {/* Horizontal Ribbon Label */}
                  {Array.isArray(hotel.metadata?.labels) && hotel.metadata.labels.length > 0 && (
                    <div className="absolute top-0 right-0 z-20">
                      <div className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 shadow-sm rounded-bl-lg">
                        {hotel.metadata.labels[0]}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Placeholder */}
                    <div className="w-full md:w-48 h-32 bg-[var(--primary-skyblue)] rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {hotel.metadata?.main_photo_url ? (
                        <img src={hotel.metadata.main_photo_url as string} alt={hotel.title} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="h-10 w-10 text-white/50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{hotel.title}</h4>
                          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                            <MapPin className="h-4 w-4" />
                            {tripDetails?.destination || "Not specified"}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {typeof hotel.metadata?.rating === 'number' && (
                              <>
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-bold text-gray-900">{hotel.metadata.rating} Stars</span>
                              </>
                            )}
                            <span className="text-xs text-gray-500">({(hotel.metadata?.source as string) || "Source"})</span>
                          </div>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          {hotel.price ? (
                            <>
                              <p className="text-3xl font-bold text-[var(--primary-skyblue)]">${Number(hotel.price).toFixed(2)}</p>
                              <p className="text-xs text-gray-500">Total Price</p>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-gray-500">Price Unavailable</p>
                          )}
                        </div>
                      </div>

                      <Button 
                        className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white px-8 w-full sm:w-auto mt-4"
                        onClick={() => {
                          onSelect(hotel)
                          onClose()
                        }}
                      >
                        Select Hotel
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
