"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  FileText,
  MapPin,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Client } from "@/lib/types/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface QuotesListProps {
  clients: Client[];
  selectedQuoteId: string;
  onSelectQuote: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  Approved: "bg-green-50 text-green-600 border-green-100",
  Accepted: "bg-green-50 text-green-600 border-green-100",
  Confirmed: "bg-green-50 text-green-600 border-green-100",
  Draft: "bg-gray-50 text-gray-600 border-gray-100",
  Pending: "bg-blue-50 text-blue-600 border-blue-100",
  Sent: "bg-blue-50 text-blue-600 border-blue-100",
  Viewed: "bg-purple-50 text-purple-600 border-purple-100",
};

export function QuotesList({
  clients,
  selectedQuoteId,
  onSelectQuote,
}: QuotesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClients, setExpandedClients] = useState<
    Record<string, boolean>
  >({});

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  // Auto-expand client when a quote is selected or when clients/selectedQuoteId changes
  useEffect(() => {
    if (selectedQuoteId) {
      const clientWithQuote = clients.find((c) =>
        c.quotes.some((q) => q.id === selectedQuoteId)
      );
      if (clientWithQuote) {
        setExpandedClients((prev) => ({
          ...prev,
          [clientWithQuote.id]: true,
        }));
      }
    }
  }, [selectedQuoteId, clients]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.quotes.some((quote) =>
        quote.destination.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg sm:text-xl text-[#000E19]">
            All Quotes
          </h2>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-[#F8F9FA] border-none rounded-lg focus-visible:ring-1 focus-visible:ring-[#43ABFF] placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-6 space-y-3 sm:space-y-4">
        {filteredClients.map((client) => (
          <div key={client.id} className="space-y-3">
            {/* Client Card */}
            <div
              onClick={() => toggleClient(client.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                expandedClients[client.id]
                  ? "bg-white border-gray-200 shadow-sm"
                  : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50"
              )}>
              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                <AvatarImage src={client.avatar} />
                <AvatarFallback
                  className={cn(
                    "text-[10px] font-bold text-white bg-[#43ABFF]"
                  )}>
                  {client.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#000E19] truncate">
                  {client.name}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {client.quotes.length} Quotes
                </p>
              </div>

              {expandedClients[client.id] ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>

            {/* Quotes List (Collapsible) */}
            {expandedClients[client.id] && (
              <div className="space-y-3 pl-2">
                {client.quotes.length > 0 ? (
                  client.quotes.map((quote) => (
                    <div
                      key={quote.id}
                      onClick={() => onSelectQuote(quote.id)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer relative group",
                        selectedQuoteId === quote.id
                          ? "bg-[#F0F7FF] border-[#43ABFF] shadow-sm"
                          : "bg-[#F8F9FA] border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm"
                      )}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-[#000E19]">
                          Q-{quote.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] px-1.5 py-0 h-4 font-semibold border",
                            statusStyles[quote.status] ||
                              "bg-gray-50 text-gray-500 border-gray-100"
                          )}>
                          {quote.status}
                        </Badge>
                      </div>

                      <p className="text-[10px] text-gray-400 mb-1.5">
                        {client.name}
                      </p>

                      <p className="font-bold text-xs text-[#000E19] mb-3 truncate">
                        {quote.destination}
                      </p>

                      <div className="flex flex-wrap justify-between items-end gap-2">
                        <span className="text-[#43ABFF] font-bold text-sm sm:text-base">
                          {quote.price}
                        </span>
                        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-gray-400 font-medium">
                          {/* <span>{quote.version}</span>
                          <span>•</span> */}
                          <span>{quote.date}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 italic">
                      No quotes found for this client
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
