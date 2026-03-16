"use client"

import { useState, useEffect, useRef } from "react"
import { Quote } from "@/lib/types/bookings-quotes"
import { QuotesSidebar } from "@/components/bookings-quotes/quotes-sidebar"
import { QuoteDetailsView } from "@/components/bookings-quotes/quote-details-view"
import { FileText, Loader2 } from "lucide-react"
import { getAgencyQuotes, getAgencyQuoteDetail } from "@/lib/api/quotes.api"
import { authStore } from "@/lib/auth-store"
import { toast } from "sonner"

export default function BookingsQuotesPage() {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchQuotes = async () => {
      try {
        const data = await getAgencyQuotes()
        setQuotes(data)
      } catch (error) {
        // console.error("Failed to fetch quotes:", error)
        toast.error("Failed to load quotes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuotes()
  }, [])


  return (
    <div className="relative flex flex-col md:flex-row min-h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)] gap-6">
      {/* Left Column: List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 h-full ${selectedQuote ? 'hidden md:block' : 'block'}`}>
        <QuotesSidebar 
          quotes={quotes}
          selectedQuoteId={selectedQuote?.id || null}
          onSelectQuote={async (quote) => {
            setSelectedQuote(quote)
            setIsDetailLoading(true)
            try {
              const detailedQuote = await getAgencyQuoteDetail(quote.id)
              setSelectedQuote(detailedQuote)
            } catch (error) {
              // console.error("Failed to fetch quote details:", error)
              toast.error("Failed to load quote details")
            } finally {
              setIsDetailLoading(false)
            }
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Right Column: Details */}
      <div className={`flex-1 h-full md:overflow-hidden overflow-visible ${selectedQuote ? 'block' : 'hidden md:block'}`}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : isDetailLoading ? (
          <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : selectedQuote ? (
          <div className="h-full flex flex-col mb-10">
            <div className="md:hidden mb-4">
              <button 
                onClick={() => setSelectedQuote(null)}
                className="text-sm text-blue-500 font-medium flex items-center gap-1 cursor-pointer"
              >
                ← Back to Quotes
              </button>
            </div>
            <QuoteDetailsView quote={selectedQuote} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Quote Selected</h3>
            <p className="max-w-xs">Select a quote from the left panel to view its details and activity timeline.</p>
          </div>
        )}
      </div>
    </div>
  )
}
