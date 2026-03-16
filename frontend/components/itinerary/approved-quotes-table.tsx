"use client";

import { useState } from "react";
import {
  Search,
  Clock,
  MapPin,
  Trash2,
  ChevronDown,
  Pencil
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { cn } from "@/lib/utils";
import { ApprovedQuote, QuoteStatus } from "@/lib/types/quotes";
import { updateQuoteStatus, mapStatusToBackend } from "@/lib/api/quotes.api";
import { toast } from "sonner";

interface ApprovedQuotesTableProps {
  quotes: ApprovedQuote[];
  onMarkBooked: (id: string) => void;
  onApprove: (id: string) => void;
  onViewDetails: (id: string) => void;
  onExportPDF: (id: string) => void;
  onAIEdit: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  // Approved: "bg-green-50 text-green-600 border-green-100",
  Booked: "bg-blue-50 text-blue-600 border-blue-100",
  "Pending Approval": "bg-yellow-50 text-yellow-600 border-yellow-100",
  "Initial Contact": "bg-purple-50 text-purple-600 border-purple-100",
  "Quote Sent": "bg-indigo-50 text-indigo-600 border-indigo-100",
  "In Negotiation": "bg-orange-50 text-orange-600 border-orange-100",
  booked: "bg-teal-50 text-teal-600 border-teal-100",
};

export function ApprovedQuotesTable({
  quotes,
  onMarkBooked,
  onViewDetails,
  onAIEdit,
}: ApprovedQuotesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localQuotes, setLocalQuotes] = useState<ApprovedQuote[]>(quotes);
  const [updatingQuoteId, setUpdatingQuoteId] = useState<string | null>(null);
  const [quoteToRemove, setQuoteToRemove] = useState<ApprovedQuote | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const filteredQuotes = localQuotes.filter(
    (quote) =>
      quote.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.quoteId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    setUpdatingQuoteId(quoteId);
    try {
      const backendStatus = mapStatusToBackend(newStatus);
      await updateQuoteStatus(parseInt(quoteId), backendStatus);
      
      // Update local state
      setLocalQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q))
      );
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingQuoteId(null);
    }
  };

  const handleRemoveQuote = async () => {
    if (!quoteToRemove) return;
    
    setIsRemoving(true);
    try {
      await updateQuoteStatus(parseInt(quoteToRemove.id), 'REMOVED');
      
      // Remove from local state
      setLocalQuotes((prev) => prev.filter((q) => q.id !== quoteToRemove.id));
      
      toast.success('Quote removed successfully');
      setQuoteToRemove(null);
    } catch (error) {
      console.error('Failed to remove quote:', error);
      toast.error('Failed to remove quote');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header & Search */}
      <div className="p-6 border-b border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#000E19]">Approved Items</h2>
          <Badge
            variant="secondary"
            className="bg-blue-50 text-[#43ABFF] border-none font-bold">
            {quotes.length} Total Items
          </Badge>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by client, destination or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-[#F8F9FA] border-none rounded-xl focus-visible:ring-1 focus-visible:ring-[#43ABFF] placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-[#F7F8F8] sticky top-0 z-10">
            <TableRow className="hover:bg-[#F7F8F8] border-b border-[#E2E8F0]">
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto w-[250px]">
                Client
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Quote ID
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Destination
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Price
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Status
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-right h-auto">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#E2E8F0]">
            {filteredQuotes.length > 0 ? (
              filteredQuotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="group hover:bg-gray-50/80 transition-colors border-b border-gray-100 cursor-pointer"
                  onClick={() => onViewDetails(quote.id)}>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                        <AvatarImage src={quote.clientAvatar} />
                        <AvatarFallback className="bg-[#43ABFF] text-white text-[10px] font-bold">
                          {quote.clientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[15px] font-bold text-[#0F172A]">
                          {quote.clientName}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {quote.date}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#0F172A]">
                        {quote.quoteId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#43ABFF]" />
                      <span className="text-[15px] font-medium text-[#64748B]">
                        {quote.destination}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="text-[15px] font-bold text-[#43ABFF]">
                      {quote.price}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2.5 py-0.5 font-bold border",
                        statusStyles[quote.status]
                      )}>
                      {quote.status === "Approved" ? "Ready" : quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-[140px] text-[11px] font-medium justify-between"
                            disabled={updatingQuoteId === quote.id}>
                            {quote.status}
                            <ChevronDown className="h-3 w-3 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "Initial Contact")}>
                            Initial Contact
                          </DropdownMenuItem> */}
                          <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "Quote Sent")}>
                            Quote Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "In Negotiation")}>
                            In Negotiation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "Booked")}>
                            Booked
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setQuoteToRemove(quote)}
                        disabled={updatingQuoteId === quote.id}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAIEdit(quote.id);
                        }}
                        className="h-8 w-8 text-gray-400 hover:text-purple-600 hover:bg-purple-100">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Clock className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">
                      No approved items found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Remove Confirmation Dialog */}
      <ConfirmationModal
        isOpen={!!quoteToRemove}
        onClose={() => setQuoteToRemove(null)}
        onConfirm={handleRemoveQuote}
        title="Remove Quote"
        description={`Are you sure you want to remove quote ${quoteToRemove?.quoteId} for ${quoteToRemove?.clientName}? This action will mark the quote as removed.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={isRemoving}
      />
    </div>
  );
}
