"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ApprovedQuotesTable } from "@/components/itinerary/approved-quotes-table"
import { QuotePreviewModal } from "@/components/itinerary/quote-preview-modal"
import { ApprovedQuote, Quote } from "@/lib/types/quotes"
import { toast } from "sonner"
import { getManagedBookings, createDeal, getDetailedQuote } from "@/lib/api/quotes.api"
import { Loader } from "@/components/ui/loader"
import { exportToPDF } from "@/lib/utils/pdfExport"
import { PrintableQuote } from "@/components/quote-assistant/printable-quote"
import { Client } from "@/lib/types/clients"
import { ApiTripDetails } from "@/lib/types/quoteAssistant"

export default function ManageBookings() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<ApprovedQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [exportData, setExportData] = useState<{
    quote: Quote;
    client: Client;
    tripDetails: ApiTripDetails;
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const data = await getManagedBookings()
      setQuotes(data)
    } catch (error) {
      console.error("Failed to load managed bookings:", error)
      toast.error("Failed to load managed bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkBooked = async (id: string) => {
    const quote = quotes.find(q => q.id === id)
    if (!quote) return

    try {
      await createDeal(quote.clientId, quote.id)
      toast.success(`Successfully marked ${quote.quoteId} as booked`)
      // Refresh data to reflect changes
      loadData()
    } catch (error) {
      console.error("Failed to mark as booked:", error)
      toast.error("Failed to mark as booked")
    }
  }

  const handleApprove = (id: string) => {
    toast.info("Quote is already approved")
  }

  const handleViewDetails = async (id: string) => {
    try {
      setIsFetchingQuote(true)
      const quoteData = await getDetailedQuote(id)
      
      // Find the approved quote to get client name and destination if missing
      const approvedQuote = quotes.find(q => q.id === id)
      if (approvedQuote) {
        quoteData.clientName = approvedQuote.clientName
        quoteData.destination = approvedQuote.destination
      }

      setSelectedQuote(quoteData)
      setIsPreviewOpen(true)
    } catch (error) {
      console.error("Failed to fetch quote details:", error)
      toast.error("Failed to load quote details")
    } finally {
      setIsFetchingQuote(false)
    }
  }

  const handleExportPDF = async (id: string) => {
    try {
      toast.loading("Preparing PDF...", { id: "pdf-export" })
      const quoteData = await getDetailedQuote(id)
      
      // Find the approved quote to get client info
      const approvedQuote = quotes.find(q => q.id === id)
      
      const clientName = (quoteData.clientName && quoteData.clientName !== 'Guest') 
        ? quoteData.clientName 
        : (approvedQuote?.clientName || "Client");

      const client: Client = {
        id: approvedQuote?.clientId || "",
        name: clientName,
        email: "", // We don't have email in ApprovedQuote, but it might be in the detailed response if we update the adapter
        phone: "",
        location: quoteData.destination || approvedQuote?.destination || "",
        initials: clientName.split(' ').map(n => n[0]).join('').toUpperCase(),
        color: "bg-blue-500",
        tags: [],
        notes: "",
        trips: [],
        quotes: [],
        joinedDate: "",
        totalSpent: "0",
        status: "Active",
        lastContact: "",
        clientType: "Individual",
        isFavorite: false,
        budgetRange: "",
        travelStyle: "",
        interests: [],
        loyaltyPrograms: [],
        importantDates: [],
        recentActivity: [],
        upcomingTripsCount: 0,
        pastTripsCount: 0,
        groupMembers: []
      }

      const tripDetails: ApiTripDetails = {
        destination: quoteData.destination || approvedQuote?.destination || "",
        origin: quoteData.fromAirport || "",
        departure_date: quoteData.startDate || "",
        return_date: quoteData.endDate || "",
        adults: quoteData.travelerCount || 1
      }

      setExportData({
        quote: quoteData,
        client,
        tripDetails
      })

      // Wait for state update and render
      setTimeout(async () => {
        try {
          await exportToPDF("printable-quote", `Quote_${quoteData.id}_${client.name.replace(/\s+/g, '_')}.pdf`)
          toast.success("PDF exported successfully!", { id: "pdf-export" })
        } catch (error) {
          console.error("PDF export failed:", error)
          toast.error("Failed to export PDF", { id: "pdf-export" })
        }
      }, 500)

    } catch (error) {
      console.error("Failed to prepare PDF:", error)
      toast.error("Failed to prepare PDF", { id: "pdf-export" })
    }
  }

  const handleAIEdit = async (id: string) => {
    try {
      toast.loading("Opening AI Editor...", { id: "ai-edit" });
      const quoteData = await getDetailedQuote(id);
      
      const queryParams = new URLSearchParams({
        quoteId: quoteData.id.toString(),
        ...(quoteData.sessionId && {
          sessionId: quoteData.sessionId.toString(),
        }),
      });
      
      // Dismiss toast before navigating
      toast.dismiss("ai-edit");
      
      router.push(`/quote-assistant?${queryParams.toString()}`);
    } catch (error) {
      console.error("Failed to open AI Edit:", error);
      toast.error("Failed to open AI Edit", { id: "ai-edit" });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-6 gap-6 overflow-hidden">
      <div className="flex flex-col gap-2">
        {/* <h1 className="text-3xl font-bold text-[#000E19] tracking-tight">Management & Bookings</h1> */}
        <p className="text-gray-500 font-medium">Manage approved quotes and track booking status for your clients.</p>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader size={32} />
          </div>
        ) : (
          <ApprovedQuotesTable 
            quotes={quotes}
            onMarkBooked={handleMarkBooked}
            onApprove={handleApprove}
            onViewDetails={handleViewDetails}
            onExportPDF={handleExportPDF}
            onAIEdit={handleAIEdit}
          />
        )}
      </div>

      <QuotePreviewModal 
        quote={selectedQuote}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onExportPDF={handleExportPDF}
      />

      {/* Hidden Printable Component */}
      {exportData && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0 }}>
          <PrintableQuote 
            quote={exportData.quote} 
            client={exportData.client} 
            tripDetails={exportData.tripDetails} 
            showCommissions={true}
          />
        </div>
      )}

      {isFetchingQuote && (
        <div className="fixed bottom-8 right-8 z-[60]">
          <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <Loader size={20} />
            <p className="text-sm font-bold text-[#000E19]">Fetching details...</p>
          </div>
        </div>
      )}
    </div>
  )
}
