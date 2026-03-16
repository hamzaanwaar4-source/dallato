"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Plane,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Star,
  Gift,
  Briefcase,
  Heart,
  Sailboat,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Client, ClientTrip, ClientQuote } from "@/lib/types/clients";
import { AddClientModal } from "./add-client-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

import { clientsApi } from "@/lib/api/clients.api";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientDetailsProps {
  client: Client;
  onClientUpdated?: () => void;
  onClientDeleted?: () => void;
}

type Tab = "overview" | "trips" | "quotes" | "notes";

export function ClientDetails({
  client,
  onClientUpdated,
  onClientDeleted,
}: ClientDetailsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [notes, setNotes] = useState(client.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [pastTrips, setPastTrips] = useState<ClientTrip[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<ClientTrip[]>([]);
  const [quotes, setQuotes] = useState<ClientQuote[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Update notes when client prop changes
  useEffect(() => {
    setNotes(client.notes || "");
  }, [client.notes]);

  useEffect(() => {
    fetchClientData();
  }, [client.id]);

  const fetchClientData = async () => {
    try {
      setIsLoadingData(true);
      const clientId = parseInt(client.id);

      // Fetch past trips, upcoming trips, and quotes in parallel
      const [pastTripsData, upcomingTripsData, quotesData] = await Promise.all([
        clientsApi.getPastTrips(clientId),
        clientsApi.getUpcomingTrips(clientId),
        clientsApi.getClientQuotes(clientId),
      ])

      // Adapt past trips
      const adaptedPastTrips: ClientTrip[] = pastTripsData.map((trip) => ({
        id: trip.id.toString(),
        destination: `${trip.destination_city}, ${trip.destination_country}`,
        date: trip.start_date,
        status: 'Completed',
        price: 'N/A',
        type: 'flight',
      }));

      // Adapt upcoming trips
      const adaptedUpcomingTrips: ClientTrip[] = upcomingTripsData.map((trip) => ({
        id: trip.id.toString(),
        destination: `${trip.destination_city}, ${trip.destination_country}`,
        date: trip.start_date,
        status: trip.is_booked ? 'Upcoming' : 'Cancelled',
        price: 'N/A',
        type: 'flight',
      }));

      // Adapt quotes
      const adaptedQuotes: ClientQuote[] = quotesData.map((quote) => ({
        id: quote.id.toString(),
        destination: 'N/A',
        date: quote.created_at,
        status: quote.status as ClientQuote['status'],
        price: `${quote.currency} ${quote.ai_base_total}`,
        quoteId: quote.quote_number,
        version: `v${quote.version_number}`,
        travelers: 0,
        validUntil: 'N/A',
        duration: 'N/A',
      }));

      setPastTrips(adaptedPastTrips);
      setUpcomingTrips(adaptedUpcomingTrips);
      setQuotes(adaptedQuotes);
    } catch (error) {
      console.error("Failed to fetch client trips/quotes", error);
      toast.error("Failed to load client data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await clientsApi.updateClient(parseInt(client.id), { notes });
      toast.success("Notes updated successfully");
      
      // Refetch all client data to ensure everything is up to date
      await fetchClientData();
      
      if (onClientUpdated) onClientUpdated();
    } catch (error) {
      console.error("Failed to update notes", error);
      toast.error("Failed to update notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await clientsApi.deleteClient(parseInt(client.id));
      toast.success("Client deleted successfully");
      if (onClientDeleted) onClientDeleted();
    } catch (error) {
      console.error("Failed to delete client", error);
      toast.error("Failed to delete client");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Format trip route display
  const formatTripRoute = (origin?: string, destination?: string) => {
    if (origin && destination) {
      return `${origin} → ${destination}`;
    } else if (destination) {
      return destination;
    } else if (origin) {
      return origin;
    }
    return "Trip";
  };

  return (
    <div className="flex flex-col md:h-full h-auto w-full max-w-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        description={`Are you sure you want to delete ${client.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />

      <AddClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onClientAdded={async () => {
          setIsEditModalOpen(false);
          // Refetch all client data to ensure everything is up to date
          await fetchClientData();
          if (onClientUpdated) onClientUpdated();
        }}
        clientToEdit={client}
      />

      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-medium text-white shrink-0 ${
                client.color.includes("bg-") ? client.color : "bg-blue-500"
              }`}>
              {client.initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 truncate">
                {client.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {client.tags.map((tag) => {
                  let tagColor = "bg-gray-100 text-gray-600";
                  if (tag === "Family Client")
                    tagColor = "bg-green-100 text-green-600";
                  return (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${tagColor}`}>
                      {tag}
                    </span>
                  );
                })}
                {client.membership && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase">
                    {client.membership}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-1.5 min-w-0 max-w-full">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="break-all">{client.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 shrink-0" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {client.location}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 self-end md:self-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-400 hover:text-blue-500 hover:bg-blue-50"
              onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Upcoming Trips
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {client.upcomingTripsCount}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Post Trips
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {client.pastTripsCount}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {client.totalSpent}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Commission
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {client.commissionPercent ? `${client.commissionPercent}%` : '0.00%'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-4 md:px-6 overflow-x-auto">
        <TabButton
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          label="Overview"
        />
        <TabButton
          active={activeTab === "trips"}
          onClick={() => setActiveTab("trips")}
          label="Trips"
        />
        <TabButton
          active={activeTab === "quotes"}
          onClick={() => setActiveTab("quotes")}
          label="Quotes"
        />
        <TabButton
          active={activeTab === "notes"}
          onClick={() => setActiveTab("notes")}
          label="Notes"
        />
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 bg-white md:h-full h-auto">
        <div className="p-4 md:p-6 overflow-x-hidden">
          {activeTab === "overview" && (
            <div className="space-y-6 md:space-y-8">
              {/* Travel Preferences */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Travel Preferences
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 md:p-4 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Budget Range
                    </p>
                    <p className="font-bold text-gray-900 truncate">
                      {client.budgetRange}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 md:p-4 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      Travel Style
                    </p>
                    <p className="font-bold text-gray-900 truncate">
                      {client.travelStyle}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Group Members
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      {client.groupMembers && client.groupMembers.length > 0 ? (
                        client.groupMembers.map((member) => (
                          <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                              <span className="px-3 py-1.5 rounded-[6px] bg-blue-50 text-blue-500 text-xs font-medium whitespace-normal text-center cursor-pointer hover:bg-blue-100 transition-colors">
                                {member.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Relation: {member.relation}
                              </p>
                              {member.ageGroup && (
                                <p className="text-xs text-muted-foreground">
                                  Age Group: {member.ageGroup}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No group members.
                        </p>
                      )}
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Important Dates */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Important Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {client.importantDates.map((date, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-3 md:p-4 flex items-center gap-3 min-w-0">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          date.type === "Birthday"
                            ? "text-blue-500"
                            : "text-yellow-500"
                        }`}>
                        {date.type === "Birthday" ? (
                          <Calendar className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {date.type}
                        </p>
                        <p className="font-bold text-gray-900 truncate">
                          {date.date}
                        </p>
                      </div>
                    </div>
                  ))}
                  {client.importantDates.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">
                      No important dates listed.
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {client.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-3 md:p-4 flex flex-col xs:flex-row xs:items-center justify-between gap-2 md:gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.date}
                        </p>
                      </div>
                      {activity.status && (
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0 self-start xs:self-auto ${activity.statusColor}`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                  ))}
                  {client.recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No recent activity.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "trips" && (
            <div className="space-y-6">
              {isLoadingData ? (
                <p className="text-sm text-muted-foreground">
                  Loading trips...
                </p>
              ) : (
                <>
                  {/* Upcoming Trips Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Upcoming Trips
                    </h3>
                    {upcomingTrips.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingTrips.map((trip) => (
                          <Card
                            key={trip.id}
                            className="border border-gray-200 shadow-sm bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0">
                                  <Plane className="h-8 w-8 px-auto text-gray-800 -rotate-45" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-base font-bold text-gray-900 truncate">
                                    {trip.destination}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1 truncate">
                                    {new Date(trip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left sm:text-right shrink-0 pl-0 sm:pl-0">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  {trip.status}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No upcoming trips.</p>
                    )}
                  </div>

                  {/* Past Trips Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Past Trips
                    </h3>
                    {pastTrips.length > 0 ? (
                      <div className="space-y-3">
                        {pastTrips.map((trip) => (
                          <Card
                            key={trip.id}
                            className="border border-gray-200 shadow-sm bg-white rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0">
                                  <Plane className="h-8 w-8 px-auto text-gray-800 -rotate-45" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-base font-bold text-gray-900 truncate">
                                    {trip.destination}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1 truncate">
                                    {new Date(trip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left sm:text-right shrink-0 pl-0 sm:pl-0">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {trip.status}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No past trips.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "quotes" && (
            <div className="space-y-4">
              {isLoadingData ? (
                <p className="text-sm text-muted-foreground">
                  Loading quotes...
                </p>
              ) : quotes.length > 0 ? (
                quotes.map((quote) => {
                  // Map status to display color
                  const getStatusColor = (status: string) => {
                    switch (status.toUpperCase()) {
                      case 'ACCEPTED':
                        return 'bg-green-100 text-green-700';
                      case 'SENT':
                        return 'bg-blue-100 text-blue-700';
                      case 'DRAFT':
                        return 'bg-gray-100 text-gray-700';
                      case 'REJECTED':
                      case 'DECLINED':
                        return 'bg-red-100 text-red-700';
                      default:
                        return 'bg-yellow-100 text-yellow-700';
                    }
                  };

                  return (
                    <Card
                      key={quote.id}
                      className="border border-gray-200 shadow-sm bg-[#F7F8F8] rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex gap-4 min-w-0 w-full">
                          <div className="mt-1 shrink-0">
                            <DollarSign className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-base font-bold text-gray-900 truncate">
                                {quote.quoteId}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                                {quote.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              Version: {quote.version}
                            </p>
                            <div className="mt-3 space-y-1">
                              <p className="text-sm text-gray-600 truncate">
                                Created: {new Date(quote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                Total Value:{" "}
                                <span className="text-gray-900 font-medium">
                                  {quote.price}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No quotes found.
                </p>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <textarea
                className="w-full h-64 p-4 bg-gray-50 rounded-xl border-none resize-none focus:ring-0 text-sm text-gray-600 placeholder:text-gray-400"
                placeholder="Add notes about this client..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)]/90 text-white font-medium px-6"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}>
                {isSavingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[var(--primary-skyblue)] text-[var(--primary-skyblue)]"
          : "border-transparent text-muted-foreground hover:text-gray-900"
      }`}>
      {label}
    </button>
  );
}
