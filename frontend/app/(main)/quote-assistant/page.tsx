'use client'

import { QuotesStats } from "@/components/quote-assistant/quotes-stats"
import { QuoteAssistant } from "@/components/quote-assistant/quote-assistant"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Quote } from "@/lib/types/quotes"
import { quotesApi } from "@/lib/api/quotes.api"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"

function QuoteAssistantContent() {
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quoteId')
  
  const [initialQuote, setInitialQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchQuote = async () => {
      if (quoteId) {
        setIsLoading(true)
        try {
          const quote = await quotesApi.getQuoteById(quoteId)
          setInitialQuote(quote)
        } catch (error) {
          console.error('Failed to load quote:', error)
          toast.error('Failed to load quote for editing')
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    fetchQuote()
  }, [quoteId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader />
      </div>
    )
  }

  return (
    <QuoteAssistant 
      initialMessage="Hello! I'm your AI Quote Assistant. I can help you create personalized travel quotes by searching for flights, hotels, and building detailed itineraries. How can I assist you today?"
      suggestions={[
        "Create a 7-day trip to Paris",
        "Find flights to Tokyo in March",
        "Plan a honeymoon in Bali"
      ]}
      clients={[]}
      initialQuote={initialQuote}
    />
  )
}

export default function QuotesPage() {
  return (
    <div className="space-y-4 md:space-y-6 xl:h-[calc(100vh-6rem)] flex flex-col">
      {/* Main Content - Full Width Quote Assistant */}
      <div className="flex-1 min-h-0">
        <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader /></div>}>
          <QuoteAssistantContent />
        </Suspense>
      </div>
    </div>
  );
}
