"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plane, Search, Calendar, Users, X, ArrowRight, Briefcase, MapPin } from "lucide-react"
import { QuoteItem } from "@/lib/types/quotes"
import { Client } from "@/lib/types/clients"
import { Airport } from "@/lib/types/quoteAssistant"
import { useEffect, useRef } from "react"
interface FlightSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (flight: QuoteItem | QuoteItem[]) => void
  client: Client | null
  results?: QuoteItem[]
  tripDetails?: any
  isLoading?: boolean
  onSearch?: (params: { from_airport: string, to_airport: string }) => void
}

const COMMON_AIRPORTS: Airport[] = [
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA" },
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "UK" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan" },
  { code: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", country: "Italy" },
  { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey" },
]

const formatDuration = (dur: string | number) => {
  if (!dur) return "--"
  if (typeof dur === 'number') {
    const hours = Math.floor(dur / 3600)
    const minutes = Math.floor((dur % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
  // Handle P1DT3H9M format
  let formatted = dur.replace('PT', '').toLowerCase()
  if (formatted.includes('p1dt')) {
    formatted = formatted.replace('p1dt', '1d ')
  }
  return formatted
}

interface FlightSegmentProps {
  segment: any
  title: string
  isReturn?: boolean
  tripDetails?: any
}

const FlightSegment = ({ segment, title, isReturn = false, tripDetails }: FlightSegmentProps) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-center gap-2 mb-4">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isReturn ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
        {isReturn ? 'R' : 'O'}
      </div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
    </div>
    
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
      {/* Departure */}
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase font-medium mb-1">Departure</span>
        <p className="font-bold text-gray-900 text-base sm:text-lg leading-none mb-1">
          {segment?.departure ? new Date(segment.departure as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
        </p>
        <p className="text-[10px] text-gray-500 mb-1">
          {segment?.departure ? new Date(segment.departure as string).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
        </p>
        <p className="text-xs font-semibold text-gray-600">
          {segment?.departure_airport || (isReturn ? tripDetails?.destination_airport : tripDetails?.origin_airport)}
        </p>
      </div>
      
      {/* Duration & Line */}
      <div className="flex flex-col items-center min-w-[80px] sm:min-w-[120px]">
        <span className="text-[10px] text-gray-400 mb-1">{formatDuration(segment?.duration)}</span>
        <div className="w-full h-px bg-gray-200 relative flex items-center justify-center">
          <div className="absolute right-0 -mr-1 h-1.5 w-1.5 border-t border-r border-gray-300 rotate-45 transform" />
          {segment?.stops > 0 && (
            <div className="absolute bg-white px-1.5 py-0.5 text-[8px] text-orange-500 font-bold border border-orange-100 rounded-full -top-2">
              {segment.stops} Stop{segment.stops > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Arrival */}
      <div className="flex flex-col text-right">
        <span className="text-[10px] text-gray-400 uppercase font-medium mb-1">Arrival</span>
        <p className="font-bold text-gray-900 text-base sm:text-lg leading-none mb-1">
          {segment?.arrival ? new Date(segment.arrival as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
        </p>
        <p className="text-[10px] text-gray-500 mb-1">
          {segment?.arrival ? new Date(segment.arrival as string).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ""}
        </p>
        <div className="flex flex-col items-end">
          <p className="text-xs font-semibold text-gray-600">
            {segment?.arrival_airport || (isReturn ? tripDetails?.origin_airport : tripDetails?.destination_airport)}
          </p>
          <p className="text-[10px] text-blue-500 font-medium leading-tight mt-0.5">
            {isReturn ? tripDetails?.origin : tripDetails?.destination}
          </p>
        </div>
      </div>
    </div>
  </div>
)

export function FlightSearchModal({ isOpen, onClose, onSelect, client, results, tripDetails, isLoading, onSearch }: FlightSearchModalProps) {
  const [tripType, setTripType] = useState<"one-way" | "round-trip">(tripDetails?.return_date ? "round-trip" : "one-way")
  const [step, setStep] = useState<"outbound" | "return">("outbound")
  const [selectedOutbound, setSelectedOutbound] = useState<QuoteItem | null>(null)
  const [cabinClass, setCabinClass] = useState<string>("economy")
  
  const [originSearch, setOriginSearch] = useState(tripDetails?.origin || "")
  const [destSearch, setDestSearch] = useState(tripDetails?.destination || "")
  const [originCode, setOriginCode] = useState(tripDetails?.origin_airport || tripDetails?.from_airport || "")
  const [destCode, setDestCode] = useState(tripDetails?.destination_airport || tripDetails?.to_airport || "")
  
  const [showOriginResults, setShowOriginResults] = useState(false)
  const [showDestResults, setShowDestResults] = useState(false)
  
  const [airportResults, setAirportResults] = useState<Airport[]>([])
  const [isSearchingAirports, setIsSearchingAirports] = useState(false)

  const originRef = useRef<HTMLDivElement>(null)
  const destRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && tripDetails) {
      setOriginSearch(tripDetails.origin || "")
      const destination = (tripDetails.destination && tripDetails.destination !== "Trip Quote") 
        ? tripDetails.destination 
        : (tripDetails.destination_airport || "");
      setDestSearch(destination)
      setOriginCode(tripDetails.origin_airport || tripDetails.from_airport || "")
      setDestCode(tripDetails.destination_airport || tripDetails.to_airport || "")
      
      if (tripDetails.return_date) {
        setTripType("round-trip")
      } else {
        setTripType("one-way")
      }
    }
  }, [isOpen, tripDetails])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginResults(false)
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchAirports = async (query: string) => {
    if (query.length < 2) {
      setAirportResults([])
      return
    }
    
    setIsSearchingAirports(true)
    try {
      // Using Travelpayouts free autocomplete API
      const response = await fetch(`https://autocomplete.travelpayouts.com/places2?term=${query}&locale=en&types[]=airport`)
      const data = await response.json()
      
      const mapped: Airport[] = data.map((item: any) => ({
        code: item.code,
        name: item.name,
        city: item.city_name,
        country: item.country_name
      }))
      setAirportResults(mapped)
    } catch (error) {
      console.error("Airport search failed:", error)
      // Fallback to local filtering of common airports
      const filtered = COMMON_AIRPORTS.filter(a => 
        a.name.toLowerCase().includes(query.toLowerCase()) || 
        a.city.toLowerCase().includes(query.toLowerCase()) || 
        a.code.toLowerCase().includes(query.toLowerCase())
      )
      setAirportResults(filtered)
    } finally {
      setIsSearchingAirports(false)
    }
  }

  const handleOriginSearch = (val: string) => {
    setOriginSearch(val)
    searchAirports(val)
    setShowOriginResults(true)
  }

  const handleDestSearch = (val: string) => {
    setDestSearch(val)
    searchAirports(val)
    setShowDestResults(true)
  }

  const selectOrigin = (airport: Airport) => {
    setOriginSearch(`${airport.city} (${airport.code})`)
    setOriginCode(airport.code)
    setShowOriginResults(false)
  }

  const selectDest = (airport: Airport) => {
    setDestSearch(`${airport.city} (${airport.code})`)
    setDestCode(airport.code)
    setShowDestResults(false)
  }

  // Filter flights based on trip type and cabin class
  const displayFlights = (results || []).filter(flight => {
    // Direction filter: match selected tripType
    const isRoundTrip = !!flight.metadata?.return
    const directionMatch = tripType === "round-trip" ? isRoundTrip : !isRoundTrip

    // Cabin class filter
    const flightType = (flight.metadata?.type as string)?.toLowerCase() || "economy"
    const cabinMatch = flightType === cabinClass

    return directionMatch && cabinMatch
  })

  const handleSelect = (flight: QuoteItem) => {
    onSelect(flight)
    onClose()
  }

  const handleClose = () => {
    onClose()
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Search Flights</DialogTitle>
        {/* Header */}
        <div className="bg-[var(--primary)] p-4 md:p-6 text-white relative">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Search Flights</h2>
              <p className="text-blue-100 opacity-90 text-sm md:text-base">Prepared for {client?.name || "Client"}</p>
            </div>
            <div className="absolute top-4 right-4 flex flex-col items-end">
              <DialogClose className="text-white/80 hover:text-white transition-colors mb-4">
                <X className="h-6 w-6" />
              </DialogClose>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Search Form */}
          <div className="mb-6 md:mb-8 space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-gray-900">
                 Find the best flights for your trip
               </h3>
            </div>
            
            {/* Trip Type Toggle */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setTripType("one-way")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  tripType === "one-way" 
                    ? "bg-blue-500 text-white" 
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                One-way
              </button>
              <button
                onClick={() => setTripType("round-trip")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  tripType === "round-trip" 
                    ? "bg-blue-500 text-white" 
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Round-trip
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 relative" ref={originRef}>
                <Label className="text-xs text-gray-500">Origin Airport</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={originSearch} 
                    onChange={(e) => handleOriginSearch(e.target.value)}
                    onFocus={() => originSearch.length >= 2 && setShowOriginResults(true)}
                    placeholder="City or Airport Code"
                    className="pl-9 bg-gray-50 border-gray-100 font-medium"
                  />
                </div>
                {showOriginResults && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingAirports ? (
                      <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
                    ) : airportResults.length > 0 ? (
                      airportResults.map((airport) => (
                        <button
                          key={airport.code}
                          className="w-full text-left p-3 hover:bg-gray-50 flex flex-col border-b last:border-0"
                          onClick={() => selectOrigin(airport)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">{airport.city}</span>
                            <span className="text-xs font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{airport.code}</span>
                          </div>
                          <span className="text-xs text-gray-500 truncate">{airport.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500 text-center">No airports found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1.5 relative" ref={destRef}>
                <Label className="text-xs text-gray-500">Destination Airport</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    value={destSearch} 
                    onChange={(e) => handleDestSearch(e.target.value)}
                    onFocus={() => destSearch.length >= 2 && setShowDestResults(true)}
                    placeholder="City or Airport Code"
                    className="pl-9 bg-gray-50 border-gray-100 font-medium"
                  />
                </div>
                {showDestResults && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingAirports ? (
                      <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
                    ) : airportResults.length > 0 ? (
                      airportResults.map((airport) => (
                        <button
                          key={airport.code}
                          className="w-full text-left p-3 hover:bg-gray-50 flex flex-col border-b last:border-0"
                          onClick={() => selectDest(airport)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">{airport.city}</span>
                            <span className="text-xs font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{airport.code}</span>
                          </div>
                          <span className="text-xs text-gray-500 truncate">{airport.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500 text-center">No airports found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Cabin Class</Label>
              <select 
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-100 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="economy">Economy Class</option>
                <option value="business">Business Class</option>
                <option value="first">First Class</option>
              </select>
            </div>

            <Button 
              className="w-full bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white h-11 text-base font-medium mt-2"
              onClick={() => onSearch?.({ from_airport: originCode, to_airport: destCode })}
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search Flight"}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton Loader
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 md:p-5 bg-white animate-pulse">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-24 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-6 w-20 bg-gray-200 rounded ml-auto"></div>
                      <div className="h-3 w-16 bg-gray-100 rounded ml-auto"></div>
                    </div>
                  </div>
                  
                  {/* Segment Skeleton */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                      <div className="space-y-2">
                        <div className="h-3 w-12 bg-gray-100 rounded"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-100 rounded"></div>
                      </div>
                      <div className="flex flex-col items-center w-24 sm:w-32">
                        <div className="h-3 w-16 bg-gray-100 rounded mb-2"></div>
                        <div className="w-full h-px bg-gray-200"></div>
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-3 w-12 bg-gray-100 rounded ml-auto"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded ml-auto"></div>
                        <div className="h-4 w-16 bg-gray-100 rounded ml-auto"></div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-50 my-6" />
                  <div className="flex justify-end">
                    <div className="h-9 w-32 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))
            ) : (
              displayFlights.map((flight, index) => (
                <div key={index} className="border border-blue-100 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow bg-white relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-6 gap-2 sm:gap-0 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden">
                        {flight.metadata?.carrier_logo ? (
                          <img src={flight.metadata.carrier_logo as string} alt={flight.title} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Plane className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{flight.title}</h4>
                        <div className="flex gap-2 text-xs text-gray-500">
                           <span className="capitalize">{(flight.metadata?.type as string) || "Economy"}</span>
                           <span>•</span>
                           <span>{flight.metadata?.source as string || "Duffel"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-bold text-[var(--primary-skyblue)]">${flight.price}</p>
                      <p className="text-[10px] text-gray-400">per person</p>
                    </div>
                  </div>

                  {/* Outbound Segment */}
                  {!!flight.metadata?.outbound && (
                    <FlightSegment 
                      segment={flight.metadata?.outbound as any} 
                      title="Outbound Flight" 
                      tripDetails={tripDetails}
                    />
                  )}

                  {/* Return Segment */}
                  {tripType === "round-trip" && !!flight.metadata?.return && (
                    <>
                      <div className="h-px bg-gray-100 my-6" />
                      <FlightSegment 
                        segment={flight.metadata?.return as any} 
                        title="Return Flight" 
                        isReturn={true}
                        tripDetails={tripDetails}
                      />
                    </>
                  )}

                  <div className="h-px bg-gray-100 mb-4 mt-6" />

                  <div className="flex justify-end">
                    <Button 
                      size="sm"
                      className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] text-white px-8 w-full sm:w-auto"
                      onClick={() => handleSelect(flight)}
                    >
                      Select Flight
                    </Button>
                  </div>
                </div>
              ))
            )}
            {!isLoading && displayFlights.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No flights found for the selected criteria.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
