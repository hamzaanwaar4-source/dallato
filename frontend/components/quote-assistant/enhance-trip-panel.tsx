"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, ShieldCheck, Check, ChevronLeft, ChevronRight, Info, MapPin, Thermometer, Plane, CloudRain, Heart, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchTravelInsights } from "@/lib/api/quoteAssistant.api"
import { ApiTripDetails } from "@/lib/types/quoteAssistant"

interface Insight {
  category: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
}

interface TravelInsightsResponse {
  insights: Insight[]
}

interface EnhanceTripPanelProps {
  tripDetails?: ApiTripDetails | null
  quote?: any
}

// Category icon mapping
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'visa':
      return ShieldCheck
    case 'weather':
      return CloudRain
    case 'travel_tip':
      return Plane
    case 'health':
      return Heart
    case 'local_info':
      return Info
    default:
      return Sparkles
  }
}

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700'
    case 'medium':
      return 'bg-orange-100 text-orange-700'
    case 'low':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function EnhanceTripPanel({ tripDetails, quote }: EnhanceTripPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [insightsData, setInsightsData] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const lastFetchedDestinationRef = useRef<string>("")

  useEffect(() => {
    const loadTravelInsights = async () => {
      // Extract origin and destination from available data
      const origin = tripDetails?.origin || quote?.origin || tripDetails?.origin_airport || ""
      const destination = quote?.destination || tripDetails?.destination || ""
      const departureDate = tripDetails?.departure_date || ""
      const returnDate = tripDetails?.return_date || ""

      // Only fetch if we have all required fields
      if (!origin || !destination || !departureDate || !returnDate) {
        return
      }

      // Only fetch if destination has changed
      if (destination === lastFetchedDestinationRef.current) {
        return
      }

      setIsLoading(true)
      try {
        const data = await fetchTravelInsights({
          origin: origin,
          destination: destination,
          departure_date: departureDate,
          return_date: returnDate
        })
        
        // Extract insights array from response
        if (data.insights && Array.isArray(data.insights)) {
          setInsightsData(data.insights)
          lastFetchedDestinationRef.current = destination
        }
      } catch (error) {
        console.error("Failed to fetch travel insights:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTravelInsights()
  }, [tripDetails, quote])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? insightsData.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === insightsData.length - 1 ? 0 : prev + 1))
  }

  const currentInsight = insightsData[currentIndex]
  const CategoryIcon = currentInsight ? getCategoryIcon(currentInsight.category) : Sparkles

  return (
    <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl overflow-hidden border-none ring-1 ring-gray-200">
      <CardHeader className="border-b px-4 py-3 md:px-6 md:py-4 bg-white sticky top-0 z-10">
        <div className="space-y-1">
          <CardTitle className="text-lg md:text-xl font-bold text-gray-900">Enhance Your Trip</CardTitle>
          <p className="text-xs md:text-sm text-gray-500">Add extras to make your journey unforgettable</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/30">
        {/* AI Suggestion Card */}
        <Card className="border-none shadow-sm bg-[#F0F9FF] rounded-2xl overflow-hidden ring-1 ring-blue-100">
          <CardContent className="p-4 md:p-5 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066FF]"></div>
              </div>
            ) : currentInsight ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0066FF] flex items-center justify-center shrink-0 shadow-sm">
                    <CategoryIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-[#1E3A8A] text-sm md:text-base">{currentInsight.title}</h4>
                      <Badge className={`${getPriorityColor(currentInsight.priority)} border-none px-2 py-0.5 text-[10px] font-semibold capitalize`}>
                        {currentInsight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-[#1E40AF] leading-relaxed">
                      {currentInsight.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-0.5 text-[10px] font-medium capitalize">
                        {currentInsight.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-sm"
                    onClick={handlePrevious}
                    disabled={insightsData.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-1.5">
                    {insightsData.slice(0, Math.min(5, insightsData.length)).map((_, idx) => (
                      <div 
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentIndex ? 'w-6 bg-[#0066FF]' : 'w-1.5 bg-blue-200'
                        }`}
                      />
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-sm"
                    onClick={handleNext}
                    disabled={insightsData.length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* <Button className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold h-10 md:h-11 rounded-xl shadow-md transition-all">
                  Learn More
                </Button> */}
              </>
            ) : (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#0066FF] flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-[#1E3A8A] text-sm md:text-base">AI Travel Insights</h4>
                  <p className="text-xs md:text-sm text-[#1E40AF] leading-relaxed">
                    Start a conversation with trip details to get personalized travel insights and recommendations
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Travel Insurance Card */}
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-emerald-100 relative">
          <div className="absolute top-3 right-3">
            <Badge className="bg-[#00A651] hover:bg-[#00A651] text-white border-none px-3 py-1 text-[10px] font-bold rounded-full">
              Recommended
            </Badge>
          </div>
          <CardContent className="p-4 md:p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0 border border-emerald-100">
                <ShieldCheck className="h-6 w-6 text-[#00A651]" />
              </div>
              <div className="space-y-1 pr-20">
                <h4 className="font-bold text-gray-900 text-base md:text-lg">Travel Insurance</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Protect your trip with comprehensive coverage including cancellations, medical emergencies, and lost baggage
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {[
                "Trip cancellation & interruption coverage",
                "Medical & emergency evacuation",
                "Baggage loss & delay protection",
                "24/7 travel assistance"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-gray-600">
                  <Check className="h-4 w-4 text-[#00A651] mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline gap-2 pt-2">
              <span className="text-2xl md:text-3xl font-bold text-[#00A651]">$89</span>
              <span className="text-xs text-gray-400 font-medium">per person</span>
            </div>

            <Button className="w-full bg-[#00A651] hover:bg-[#008C44] text-white font-bold h-10 md:h-11 rounded-xl shadow-md transition-all">
              Add Insurance to Quote
            </Button>
          </CardContent>
        </Card>

        {/* Additional Info / Footer */}
        <div className="p-4 rounded-xl bg-gray-100/50 border border-gray-200 flex items-start gap-3">
          <Info className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            Prices and availability are subject to change. Some enhancements may require additional traveler information.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
