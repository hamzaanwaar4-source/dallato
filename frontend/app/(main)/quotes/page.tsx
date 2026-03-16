"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QuotesList } from "@/components/quotes/quotes-list";
import { QuoteDetail } from "@/components/quotes/quote-detail";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  getPendingQuotes,
  getDetailedQuote,
  approveQuote,
  deleteQuote,
} from "@/lib/api/quotes.api";
import { Quote } from "@/lib/types/quotes";
import { Client } from "@/lib/types/clients";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Loader } from "@/components/ui/loader";

export default function QuotesPage() {
  const searchParams = useSearchParams();
  const initialQuoteId = searchParams.get("id") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] =
    useState<string>(initialQuoteId);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadQuoteDetail();
  }, [selectedQuoteId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const apiClients = await getPendingQuotes();
      setClients(apiClients || []);

      // Auto-select first quote on desktop if none selected
      if (!selectedQuoteId && window.innerWidth >= 768) {
        const firstClientWithQuotes = apiClients?.find(
          (c) => c.quotes && c.quotes.length > 0
        );
        if (firstClientWithQuotes && firstClientWithQuotes.quotes.length > 0) {
          setSelectedQuoteId(firstClientWithQuotes.quotes[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load clients:", error);
      toast.error("Failed to load quotes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuoteDetail = async () => {
    if (!selectedQuoteId) {
      setSelectedQuote(null);
      return;
    }

    setIsDetailLoading(true);
    try {
      const quote = await getDetailedQuote(selectedQuoteId);
      setSelectedQuote(quote);
    } catch (error) {
      console.error("Failed to load quote detail:", error);
      toast.error("Failed to load quote details");
      setSelectedQuote(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveQuote(id);
      toast.success(`Quote ${id} marked as booked!`);
      // Refresh data
      loadData();
      loadQuoteDetail();
    } catch (error) {
      console.error("Failed to approve quote:", error);
      toast.error("Failed to approve quote");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] p-3 md:p-5 gap-4 md:gap-5 overflow-hidden bg-gray-50/50">
      {/* Left Sidebar - Clients & Quotes List */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 h-full ${
          selectedQuoteId ? "hidden md:block" : "block"
        }`}>
        <QuotesList
          clients={clients}
          selectedQuoteId={selectedQuoteId}
          onSelectQuote={setSelectedQuoteId}
        />
      </div>

      {/* Right Content - Quote Detail */}
      <div
        className={`flex-1 h-full overflow-hidden ${
          selectedQuoteId ? "block" : "hidden md:block"
        }`}>
        {selectedQuoteId ? (
          <div className="h-full flex flex-col">
            <div className="md:hidden mb-4">
              <button
                onClick={() => setSelectedQuoteId("")}
                className="text-sm text-blue-500 font-medium flex items-center gap-1 cursor-pointer">
                ← Back to List
              </button>
            </div>

            {isDetailLoading ? (
              <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-200 relative">
                <Loader />
              </div>
            ) : selectedQuote ? (
              <QuoteDetail
                quote={selectedQuote}
                onApprove={handleApprove}
                onDelete={() => {
                  setSelectedQuoteId("");
                  setSelectedQuote(null);
                  loadData();
                }}
                onStatusUpdate={loadData}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-200 text-gray-400">
                Quote not found
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Quote Selected
            </h3>
            <p className="max-w-xs">
              Select a client from the left panel to view and manage their trip
              quotes and versions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
