"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pencil,
  Save,
  Calendar,
  Users,
  Copy,
  Trash2,
  Plane,
  Hotel,
  Car,
  MapPin,
  ShieldCheck,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  User,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Plus,
  Lock,
  Loader2,
  Image as ImageIcon,
  RefreshCcw,
} from "lucide-react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Quote, QuoteItem } from "@/lib/types/quotes";
import { Client } from "@/lib/types/clients";
import { ApiTripDetails } from "@/lib/types/quoteAssistant";
import { exportToPDF } from "@/lib/utils/pdfExport";
import { PrintableQuote } from "./printable-quote";
import { toast } from "sonner";
import { fetchItinerary } from "@/lib/api/quoteAssistant.api";

interface PreviewPanelProps {
  quote: Quote;
  onClose: () => void;
  onSave: (quote: Quote) => void;
  client: Client | null;
  tripDetails: ApiTripDetails | null;
  sessionId?: number | null;
  onGenerateItinerary?: () => void;
  onOpenFlightSearch?: () => void;
  onOpenHotelSearch?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isSaving?: boolean;
}

export function PreviewPanel({
  quote,
  onClose,
  onSave,
  client,
  tripDetails,
  onGenerateItinerary,
  onOpenFlightSearch,
  onOpenHotelSearch,
  activeTab: activeTabProp,
  onTabChange,
  isSaving,
}: PreviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Quote>(quote);
  const [activeTab, setActiveTab] = useState(activeTabProp || "overview");
  const [newActivity, setNewActivity] = useState<Record<number, { title: string; cost: string }>>({});
  const [isRegeneratingItinerary, setIsRegeneratingItinerary] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setEditedQuote(quote);
  }, [quote]);

  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onTabChange) onTabChange(value);
  };

  const handleSave = () => {
    onSave(editedQuote);
    setIsEditing(false);
  };

  const handleExport = async () => {
    if (!client) {
      toast.error("No client selected for export");
      return;
    }
    try {
      toast.loading("Generating professional PDF...", { id: "pdf-export" });
      await exportToPDF(
        "printable-quote",
        `Quote_${editedQuote.id || "Draft"}_${client.name.replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
      toast.success("PDF exported successfully!", { id: "pdf-export" });
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF", { id: "pdf-export" });
    }
  };

  const handleInputChange = (field: keyof Quote, value: string) => {
    setEditedQuote((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemPriceChange = (id: string, newPrice: string) => {
    // Only allow max 2 decimal places
    if (newPrice.includes('.') && newPrice.split('.')[1].length > 2) return;

    setEditedQuote((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, price: parseFloat(newPrice) || 0 } : item
      ),
    }));
  };

  const handleReturnPriceChange = (id: string, newPrice: string) => {
    // Only allow max 2 decimal places
    if (newPrice.includes('.') && newPrice.split('.')[1].length > 2) return;

    setEditedQuote((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
           return {
             ...item,
             metadata: {
               ...(item.metadata || {}),
               return_price: parseFloat(newPrice) || 0
             }
           };
        }
        return item;
      }),
    }));
  };

  const calculateTotal = () => {
    // Exclude itinerary items from total cost
    return editedQuote.items
      .filter((item) => item.type !== "Itinerary" && item.type !== "Tour")
      .reduce((sum, item) => {
        let itemTotal = Number(item.price);
        if (item.type === 'Flight') {
           const meta = item.metadata as any;
           if (meta?.return_price !== undefined) {
             itemTotal += Number(meta.return_price);
           } else if (meta?.return?.price_per_seat) {
             itemTotal += Number(meta.return.price_per_seat);
           }
        }
        return sum + itemTotal;
      }, 0);
  };

  const handleAddManualActivity = (dayNumber: number) => {
    const activity = newActivity[dayNumber];
    if (!activity || !activity.title) {
      toast.error("Please provide an activity title");
      return;
    }

    const newItem: QuoteItem = {
      type: "Itinerary",
      title: activity.title,
      description: "activity",
      price: activity.cost ? Number(activity.cost) : 0,
      quantity: 1,
      id: `manual-${Date.now()}`,
      day: dayNumber,
    };

    setEditedQuote((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setNewActivity((prev) => ({
      ...prev,
      [dayNumber]: { title: "", cost: "" },
    }));
    
    toast.success("Activity added");
  };

  const handleRemoveItem = (id: string | undefined) => {
    if (!id) return;
    setEditedQuote((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
    toast.success("Item removed from quote");
  };

  const handleRegenerateItinerary = async () => {
    if (!tripDetails) {
      toast.error("Trip details are required to generate itinerary");
      return;
    }

    setIsRegeneratingItinerary(true);
    const loadingToast = toast.loading("Regenerating itinerary...");

    try {
      const requestBody = {
        dest_name: tripDetails.destination,
        from_airport: tripDetails.origin_airport || tripDetails.from_airport || tripDetails.origin,
        to_airport: tripDetails.destination_airport || tripDetails.to_airport || tripDetails.destination,
        depart_date: tripDetails.departure_date,
        return_date: tripDetails.return_date,
        checkin: tripDetails.departure_date,
        checkout: tripDetails.return_date,
        adults: tripDetails.adults || 2
      };

      const data = await fetchItinerary(requestBody);

      if (data.itinerary) {
        const itineraryItems: QuoteItem[] = [];

        if (data.itinerary.activities && Array.isArray(data.itinerary.activities)) {
          data.itinerary.activities.forEach((activity: any, index: number) => {
            itineraryItems.push({
              type: "Itinerary",
              title: activity.name,
              description: activity.description || activity.category || "Activity",
              price: Number(activity.price) || 0,
              quantity: 1,
              id: `itin-${Date.now()}-${Math.random()}`,
              day: Math.floor(index / 3) + 1,
              metadata: activity
            });
          });
        } else {
          Object.entries(data.itinerary).forEach(([day, activities]: [string, any]) => {
            if (Array.isArray(activities)) {
              activities.forEach((activity: any) => {
                itineraryItems.push({
                  type: "Itinerary",
                  title: activity.time_of_day ? `${day} - ${activity.time_of_day}` : (activity.name || day),
                  description: activity.activity || activity.description,
                  price: Number(activity.price) || 0,
                  quantity: 1,
                  id: `itin-${Date.now()}-${Math.random()}`,
                  day: Number(day.replace('Day ', '')),
                  metadata: activity
                });
              });
            }
          });
        }

        // Replace existing itinerary items with new ones
        setEditedQuote(prev => ({
          ...prev,
          items: [...prev.items.filter(i => i.type !== 'Itinerary'), ...itineraryItems]
        }));

        toast.success(`Itinerary regenerated with ${itineraryItems.length} activities`, { id: loadingToast });
      }
    } catch (error) {
      console.error("Failed to regenerate itinerary:", error);
      toast.error("Failed to regenerate itinerary", { id: loadingToast });
    } finally {
      setIsRegeneratingItinerary(false);
    }
  };

  const flights = editedQuote.items.filter((item) => item.type === "Flight");
  const hotels = editedQuote.items.filter((item) => item.type === "Hotel");
  const itinerary = editedQuote.items.filter(
    (item) => item.type === "Itinerary"
  );

  if (!client) {
    return (
      <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl overflow-hidden border-none ring-1 ring-gray-200 items-center justify-center text-center p-8">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Client Selected
        </h3>
        <p className="text-gray-500 max-w-xs mx-auto">
          Please select a client from the dropdown menu to start building a
          quote.
        </p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl overflow-hidden border-none ring-1 ring-gray-200">
      {/* Dynamic Destination Banner */}
      <div className="relative w-full h-32 md:h-40 overflow-hidden shrink-0">
        <img
          src={`https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000`} // Default travel image
          alt="Trip Banner"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000";
          }}
        />
        {tripDetails?.destination && (
          <img
            src={`https://source.unsplash.com/featured/?${encodeURIComponent(tripDetails.destination)},travel`}
            alt={tripDetails.destination}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            onLoad={(e) => {
              (e.target as HTMLImageElement).style.opacity = "1";
            }}
            style={{ opacity: 0 }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
              {tripDetails?.destination || "Discover Your Next Adventure"}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold leading-tight">
            {tripDetails ? `Trip to ${tripDetails.destination}` : "Your Custom Trip Quote"}
          </h2>
        </div>
      </div>

      <CardHeader className="border-b px-4 py-3 md:px-6 md:py-4 bg-white sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              Trip Quote
            </h2>
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none shrink-0">
              {editedQuote.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            {isEditing ? (
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full sm:w-auto h-7 text-xs">
                <Save className="h-3 w-3" /> Save
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none whitespace-nowrap px-2 h-7 text-xs gap-1">
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                {/* <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none px-2 h-7 text-xs">Edit</Button> */}
                <Button
                  size="sm"
                  onClick={handleExport}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none whitespace-nowrap px-2 h-7 text-xs">
                  Export
                </Button>
              </div>
            )}
          </div>
        </div>

        <TooltipProvider>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg h-9 md:h-10">
              <TabsTrigger
                value="overview"
                className="text-xs md:text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-1 md:px-3">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="flights"
                className="text-xs md:text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-1 md:px-3">
                Flights
              </TabsTrigger>
              <TabsTrigger
                value="hotels"
                className="text-xs md:text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-1 md:px-3">
                Hotels
              </TabsTrigger>

              <TabsTrigger
                value="itinerary"
                className="text-xs md:text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-1 md:px-3">
                Itinerary
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Dates & Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1.5 block">
                  Start Date
                </Label>
                <div className="font-medium">
                  {tripDetails?.departure_date || ""}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1.5 block">
                  End Date
                </Label>
                <div className="font-medium">
                  {tripDetails?.return_date || ""}
                </div>
              </div>
              <div className="col-span-2 bg-white p-4 rounded-xl border shadow-sm">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1.5 block">
                  Destinations
                </Label>
                <div className="font-medium">
                  {tripDetails?.destination || ""}
                </div>
              </div>
            </div>

            {/* Traveler Info */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" /> Traveler Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <Label className="text-xs text-blue-600/70 uppercase font-semibold tracking-wider mb-1 block">
                    Name
                  </Label>
                  <div className="font-medium text-gray-900">{client.name}</div>
                </div>
                <div>
                  <Label className="text-xs text-blue-600/70 uppercase font-semibold tracking-wider mb-1 block">
                    Email
                  </Label>
                  <div className="font-medium text-gray-900 break-all">
                    {client.email || "N/A"}
                  </div>
                </div>
                <div>
                  {/* <Label className="text-xs text-blue-600/70 uppercase font-semibold tracking-wider mb-1 block">
                    Phone
                  </Label>
                  <div className="font-medium text-gray-900">
                    {client.phone || "N/A"}
                  </div> */}
                </div>
                <div>
                  {/* <Label className="text-xs text-blue-600/70 uppercase font-semibold tracking-wider mb-1 block">
                    Status
                  </Label>
                  <div className="font-medium text-gray-900">
                    {client.status || "Active"}
                  </div> */}
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">What's Included</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {flights.length > 0 && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {(() => {
                      const isRoundTrip = flights.some(f => !!(f.metadata as any)?.return);
                      const typeStr = isRoundTrip ? "Round-trip" : "One-way";
                      return tripDetails
                        ? `${typeStr} flights from ${tripDetails.origin} to ${tripDetails.destination}`
                        : `${typeStr} flight`;
                    })()}
                  </li>
                )}
                {hotels.length > 0 && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {tripDetails
                      ? (() => {
                          const start = new Date(tripDetails.departure_date);
                          const end = new Date(tripDetails.return_date);
                          const nights = Math.ceil(
                            (end.getTime() - start.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return `Hotel accommodation (${nights} nights)`;
                        })()
                      : "Hotel accommodation"}
                  </li>
                )}
                {editedQuote.items.some((i) => i.type === "Itinerary") && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Daily itinerary and activities
                  </li>
                )}
                {flights.length === 0 &&
                  hotels.length === 0 &&
                  !editedQuote.items.some((i) => i.type === "Itinerary") && (
                    <li className="text-gray-400 italic">No items added yet</li>
                  )}
              </ul>
            </div>

            {/* Price Summary */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3">
              <h4 className="font-semibold text-purple-900">Price Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Flights ({flights.length})</span>
                  <span className="font-medium text-gray-900">
                    $
                    {flights
                      .reduce((sum, f) => {
                          let total = Number(f.price);
                          const meta = f.metadata as any;
                          if (meta?.return_price !== undefined) {
                              total += Number(meta.return_price);
                          } else if (meta?.return?.price_per_seat) {
                              total += Number(meta.return.price_per_seat);
                          }
                          return sum + total;
                      }, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Hotels ({hotels.length})</span>
                  <span className="font-medium text-gray-900">
                    $
                    {hotels
                      .reduce((sum, h) => sum + Number(h.price), 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>

                {/* <div className="flex justify-between text-gray-600">
                  <span>Itinerary ({itinerary.length} items)</span>
                  <span className="font-medium text-gray-900">${itinerary.reduce((sum, i) => sum + Number(i.price), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div> */}
              </div>
              <div className="pt-3 border-t border-purple-200 flex justify-between items-center">
                <span className="font-bold text-purple-900">
                  Cost
                </span>
                <span className="font-bold text-2xl text-blue-600">
                  $
                  {calculateTotal().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "flights" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Flight Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenFlightSearch}
                className="text-[var(--primary-skyblue)] hover:text-blue-700 hover:bg-blue-50 gap-1 font-semibold">
                <Plus className="h-4 w-4" /> Update Flight
              </Button>
            </div>

            {flights.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
                <Plane className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No flights selected yet.</p>
                <p className="text-sm">
                  Use the "Search Flights" button in the chat to add flights.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {flights.map((flight, index) => {
                  const metadata = (flight.metadata || {}) as any;

                  // Formatting helpers
                  const formatTime = (dateStr: string) => {
                    if (!dateStr) return "";
                    try {
                      return new Date(dateStr).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      });
                    } catch {
                      return "";
                    }
                  };

                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return "";
                    try {
                      return new Date(dateStr).toLocaleDateString([], {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      });
                    } catch {
                      return "";
                    }
                  };

                  const formatDuration = (dur: string | number) => {
                    if (!dur) return "N/A";
                    if (typeof dur === "number") {
                      const hours = Math.floor(dur / 3600);
                      const minutes = Math.floor((dur % 3600) / 60);
                      return `${hours}h ${minutes}m`;
                    }
                    // Handle P1DT0H0M format
                    if (dur.includes("P1DT")) {
                      const match = dur.match(/P1DT(?:(\d+)H)?(?:(\d+)M)?/);
                      if (match) {
                        const hours = match[1] ? `${match[1]}h ` : "";
                        const minutes = match[2] ? `${match[2]}m` : "";
                        return (`1d ` + hours + minutes).trim();
                      }
                    }
                    const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
                    if (match) {
                      const hours = match[1] ? `${match[1]}h ` : "";
                      const minutes = match[2] ? `${match[2]}m` : "";
                      return (hours + minutes).trim() || dur;
                    }
                    return dur.replace("PT", "").toLowerCase();
                  };

                  const renderFlightLeg = (
                    leg: any,
                    type: "OUTBOUND" | "RETURN",
                    price: number,
                    onPriceChange: (val: string) => void
                  ) => {
                    if (!leg) return null;

                    const departure = leg.departure || leg.departure_datetime;
                    const arrival = leg.arrival || leg.arrival_datetime;
                    const duration = leg.duration || metadata.duration;
                    const stops = leg.stops ?? metadata.stops ?? 0;
                    const carrierLogo =
                      leg.carrier_logo || metadata.carrier_logo;

                    return (
                      <div
                        key={type}
                        className={`p-4 ${type === "RETURN" ? "border-t border-dashed border-gray-200" : ""}`}
                      >
                        <div className="flex gap-4 mb-4">
                          <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {carrierLogo ? (
                              <img
                                src={carrierLogo}
                                alt="Airline"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Plane
                                className={`h-5 w-5 ${type === "RETURN" ? "text-purple-600" : "text-blue-600"}`}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 break-words">
                                  {leg.carrier || flight.title || "Flight"}
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] h-4 ${type === "RETURN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                                >
                                  {type}
                                </Badge>
                              </div>
                              {type === "OUTBOUND" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 h-8 w-8 hover:bg-red-50 hover:text-red-600 shrink-0"
                                  onClick={() => handleRemoveItem(flight.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-[10px] text-gray-400 uppercase font-bold">
                              Departure
                            </Label>
                            <div className="font-bold text-sm">
                              {formatTime(departure)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(departure)}
                            </div>
                          </div>
                          <div className="text-center">
                            <Label className="text-[10px] text-gray-400 uppercase font-bold">
                              Duration
                            </Label>
                            <div className="font-bold text-sm text-[var(--primary-skyblue)]">
                              {formatDuration(duration)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {stops === 0 ? "Non-stop" : `${stops} stop(s)`}
                            </div>
                          </div>
                          <div className="text-right">
                            <Label className="text-[10px] text-gray-400 uppercase font-bold">
                              Arrival
                            </Label>
                            <div className="font-bold text-sm">
                              {formatTime(arrival)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(arrival)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-50">
                           <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-right"> Price</Label>
                           <div className="relative">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                             <Input
                               type="number"
                               value={price}
                               onChange={(e) => onPriceChange(e.target.value)}
                               className="w-32 h-8 pl-5 text-right font-mono bg-white text-xs"
                               placeholder="0.00"
                             />
                           </div>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <Card
                      key={index}
                      className="overflow-hidden border-[var(--primary-skyblue)] border bg-white shadow-sm rounded-xl mb-4"
                    >
                      <CardContent className="p-0">
                        {metadata.outbound || metadata.return ? (
                          <>
                            {renderFlightLeg(metadata.outbound, "OUTBOUND", flight.price, (val) => handleItemPriceChange(flight.id!, val))}
                            {renderFlightLeg(
                                metadata.return, 
                                "RETURN", 
                                metadata.return_price !== undefined ? metadata.return_price : (metadata.return?.price_per_seat || 0), 
                                (val) => handleReturnPriceChange(flight.id!, val)
                            )}
                          </>
                        ) : (
                          renderFlightLeg(metadata, "OUTBOUND", flight.price, (val) => handleItemPriceChange(flight.id!, val))
                        )}
                        {/* Removed the global price input since it is now per leg */}
                      </CardContent>
                    </Card>
                  );
                })}

                <div className="bg-[var(--primary-skyblue)] rounded-xl p-4 flex justify-between items-center text-white shadow-md">
                  <span className="font-bold">Total Flight Cost</span>
                  <span className="text-2xl font-bold">
                    $
                    {flights
                      .reduce((sum, f) => {
                        let total = Number(f.price);
                        const meta = f.metadata as any;
                        if (meta?.return_price !== undefined) {
                            total += Number(meta.return_price);
                        } else if (meta?.return?.price_per_seat) {
                            total += Number(meta.return.price_per_seat);
                        }
                        return sum + total;
                      }, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "hotels" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Hotel Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenHotelSearch}
                className="text-[var(--primary-skyblue)] hover:text-blue-700 hover:bg-blue-50 gap-1 font-semibold">
                <Plus className="h-4 w-4" /> Update Hotel
              </Button>
            </div>

            {hotels.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
                <Hotel className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No hotels selected yet.</p>
                <p className="text-sm">
                  Use the "Search Hotels" button in the chat to add
                  accommodation.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {hotels.map((hotel, index) => {
                  const metadata = (hotel.metadata || {}) as any;
                  const rating = metadata.rating !== null && metadata.rating !== undefined ? metadata.rating : "0.0";
                  const reviewCount = metadata.review_count || 0;
                  const starRating = metadata.star_rating || 0;
                  const mainPhoto = metadata.main_photo_url || "";
                  const roomType = metadata.room_type?.[0] || "Standard Room";
                  const checkIn = metadata.checkin_time || "14:00";
                  const checkOut = metadata.checkout_time || "10:00";
                  const guests = tripDetails?.adults || 1;

                  // Calculate nights
                  let nights = 1;
                  if (tripDetails?.departure_date && tripDetails?.return_date) {
                    const start = new Date(tripDetails.departure_date);
                    const end = new Date(tripDetails.return_date);
                    nights = Math.max(
                      1,
                      Math.ceil(
                        (end.getTime() - start.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                  }

                  const pricePerNight = (Number(hotel.price) / nights).toFixed(
                    2
                  );

                  return (
                    <Card
                      key={index}
                      className="overflow-hidden border-[var(--primary-skyblue)] border bg-white shadow-sm rounded-xl">
                      <CardContent className="p-0">
                        <div className="p-4 flex gap-4">
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden shrink-0 bg-blue-50 flex items-center justify-center border border-blue-100">
                            {mainPhoto ? (
                              <img
                                src={mainPhoto}
                                alt={hotel.title}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <Hotel className="h-10 w-10 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg text-gray-900 break-words">
                                  {hotel.title}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {starRating > 0 ? `${starRating}-Star Hotel` : "Hotel"}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">
                                    {metadata.country_code?.toUpperCase() ||
                                      "GB"}
                                    ,{" "}
                                    {tripDetails?.destination || "City Center"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-orange-500 font-bold text-sm">
                                    ★ {rating}
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    ({reviewCount} reviews)
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0"
                                onClick={() => {
                                  const newItems = editedQuote.items.filter(
                                    (i) => i.id !== hotel.id
                                  );
                                  setEditedQuote((prev) => ({
                                    ...prev,
                                    items: newItems,
                                  }));
                                }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 grid grid-cols-3 gap-y-4 gap-x-2 border-y border-blue-100">
                          <div>
                            <Label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                              Room Type
                            </Label>
                            <div className="font-bold text-sm text-gray-900">
                              {roomType}
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                              Duration
                            </Label>
                            <div className="font-bold text-sm text-gray-900">
                              {nights} nights
                            </div>
                          </div>
                          {/* <div>
                            <Label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                              Rooms
                            </Label>
                            <div className="font-bold text-sm text-gray-900">
                              1 room
                            </div>
                          </div> */}
                          <div>
                            <Label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                              Check-in
                            </Label>
                            <div className="font-bold text-sm text-gray-900">
                              {tripDetails?.departure_date || "2026-01-10"}
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                              Check-out
                            </Label>
                            <div className="font-bold text-sm text-gray-900">
                              {tripDetails?.return_date || "2026-01-15"}
                            </div>
                          </div>
                          <div>
                            {/* <Label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 block">
                              Guests
                            </Label>
                            <div className="font-bold text-sm text-gray-900">
                              {guests} adult
                            </div> */}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                               <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Price</Label>
                               <div className="relative">
                                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                 <Input
                                   type="number"
                                   value={hotel.price.toFixed(2)}
                                   onChange={(e) => handleItemPriceChange(hotel.id!, e.target.value)}
                                   className="w-32 h-8 pl-5 text-right font-mono bg-white"
                                 />
                               </div>
                            </div>
                          </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <div className="bg-[var(--primary-skyblue)] rounded-xl p-4 flex justify-between items-center text-white shadow-md">
                  <span className="font-bold">Total Accommodation Cost</span>
                  <span className="text-2xl font-bold">
                    $
                    {hotels
                      .reduce((sum, h) => sum + Number(h.price), 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "itinerary" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {tripDetails
                      ? `Trip to ${tripDetails.destination}`
                      : "Itinerary"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {tripDetails
                      ? `${tripDetails.departure_date} - ${tripDetails.return_date}`
                      : "Draft Itinerary"}
                  </p>
                </div>
              </div>
            </div>
            {tripDetails && (
              <div className="mb-6">
                {editedQuote.items.some((i) => i.type === "Itinerary") ? (
                  <Button
                    onClick={handleRegenerateItinerary}
                    disabled={isRegeneratingItinerary}
                    className="bg-[var(--primary)] w-full text-white shadow-lg">
                    {isRegeneratingItinerary ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Regenerate Itinerary with AI
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={onGenerateItinerary}
                    className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] w-full text-white shadow-lg gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Itinerary
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-8">
              {editedQuote.items.filter((i) => i.type === "Itinerary").length >
              0 ? (
                Object.entries(
                  editedQuote.items
                    .filter((i) => i.type === "Itinerary")
                    .reduce((groups, item) => {
                      const day = item.day || "Unscheduled";
                      if (!groups[day]) groups[day] = [];
                      groups[day].push(item);
                      return groups;
                    }, {} as Record<string, QuoteItem[]>)
                )
                  .sort((a, b) => {
                    // Sort days: Day 1, Day 2, etc.
                    const dayA = parseInt(a[0].replace(/\D/g, "")) || 999;
                    const dayB = parseInt(b[0].replace(/\D/g, "")) || 999;
                    return dayA - dayB;
                  })
                  .map(([day, items]) => {
                    const dayTotal = items.reduce(
                      (sum, item) => sum + Number(item.price || 0),
                      0
                    );

                    return (
                      <div key={day} className="space-y-4">
                        {/* Day Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                          <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[var(--primary-skyblue)]" />
                            {day}
                          </h4>
                          {/* <div className="text-sm font-medium text-gray-600">
                            Total:{" "}
                            <span className="text-green-600 font-bold">
                              ${dayTotal.toLocaleString()}
                            </span>
                          </div> */}
                        </div>

                        {/* Activities for the Day */}
                        <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                          {items.map((item, index, array) => (
                            <div
                              key={item.id || index}
                              className="group border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-[var(--primary-skyblue)] transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0 text-sm">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-900 text-base leading-tight">
                                      {item.title}
                                    </h4>
                                    {/* <div className="font-bold text-green-600 whitespace-nowrap ml-2">
                                      ${item.price?.toLocaleString() || 0}
                                    </div> */}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {item.description}
                                  </p>

                                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                        disabled={index === 0}
                                        onClick={() => {
                                          // Find current and prev item in the main list
                                          const newItems = [
                                            ...editedQuote.items,
                                          ];
                                          const currentItemIndex =
                                            newItems.findIndex(
                                              (i) => i.id === item.id
                                            );
                                          const prevItem = array[index - 1];
                                          const prevItemIndex =
                                            newItems.findIndex(
                                              (i) => i.id === prevItem.id
                                            );

                                          if (
                                            currentItemIndex !== -1 &&
                                            prevItemIndex !== -1
                                          ) {
                                            [
                                              newItems[currentItemIndex],
                                              newItems[prevItemIndex],
                                            ] = [
                                              newItems[prevItemIndex],
                                              newItems[currentItemIndex],
                                            ];
                                            setEditedQuote((prev) => ({
                                              ...prev,
                                              items: newItems,
                                            }));
                                          }
                                        }}>
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                        disabled={index === array.length - 1}
                                        onClick={() => {
                                          // Find current and next item in the main list
                                          const newItems = [
                                            ...editedQuote.items,
                                          ];
                                          const currentItemIndex =
                                            newItems.findIndex(
                                              (i) => i.id === item.id
                                            );
                                          const nextItem = array[index + 1];
                                          const nextItemIndex =
                                            newItems.findIndex(
                                              (i) => i.id === nextItem.id
                                            );

                                          if (
                                            currentItemIndex !== -1 &&
                                            nextItemIndex !== -1
                                          ) {
                                            [
                                              newItems[currentItemIndex],
                                              newItems[nextItemIndex],
                                            ] = [
                                              newItems[nextItemIndex],
                                              newItems[currentItemIndex],
                                            ];
                                            setEditedQuote((prev) => ({
                                              ...prev,
                                              items: newItems,
                                            }));
                                          }
                                        }}>
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 px-2 text-xs gap-1"
                                      onClick={() => {
                                        const newItems =
                                          editedQuote.items.filter(
                                            (i) => i.id !== item.id
                                          );
                                        setEditedQuote((prev) => ({
                                          ...prev,
                                          items: newItems,
                                        }));
                                      }}>
                                      <Trash2 className="h-3.5 w-3.5" /> Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Add Manual Activity Form */}
                          <div className="bg-white/50 p-4 rounded-xl border border-dashed border-gray-200 mt-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Input
                                placeholder="Activity title..."
                                className="h-9 text-sm"
                                value={newActivity[parseInt(day.replace(/\D/g, "")) || 0]?.title || ""}
                                onChange={(e) =>
                                  setNewActivity((prev) => ({
                                    ...prev,
                                    [parseInt(day.replace(/\D/g, "")) || 0]: {
                                      ...prev[parseInt(day.replace(/\D/g, "")) || 0],
                                      title: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <Button
                                size="sm"
                                className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] h-9 px-4"
                                onClick={() => handleAddManualActivity(parseInt(day.replace(/\D/g, "")) || 0)}
                              >
                                <Plus className="h-4 w-4 mr-1.5" /> Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[var(--primary-skyblue)]" />
                      Day 1
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Start building your itinerary by adding an activity.</p>
                  <div className="bg-white/50 p-4 rounded-xl border border-dashed border-gray-200 mt-4">
                     <div className="flex flex-col sm:flex-row gap-3">
                       <Input
                         placeholder="Activity title..."
                         className="h-9 text-sm"
                         value={newActivity[1]?.title || ""}
                         onChange={(e) =>
                           setNewActivity((prev) => ({
                             ...prev,
                             [1]: { ...prev[1], title: e.target.value },
                           }))
                         }
                       />
                       <Button
                         size="sm"
                         className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary)] h-9 px-4"
                         onClick={() => handleAddManualActivity(1)}
                       >
                         <Plus className="h-4 w-4 mr-1.5" /> Add
                       </Button>
                     </div>
                  </div>
                </div>
              )}

              {/* Add Day Button */}
              {(() => {
                 // Calculate total trip days
                 let totalDays = 1;
                 const hasDates = !!(tripDetails?.departure_date && tripDetails?.return_date);
                 
                 if (hasDates) {
                   const start = new Date(tripDetails!.departure_date!);
                   const end = new Date(tripDetails!.return_date!);
                   totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                 }

                 // Find current max day
                 const currentMaxDay = editedQuote.items
                   .filter(i => i.type === "Itinerary")
                   .reduce((max, item) => Math.max(max, item.day || 0), 0);

                 // Show button if we haven't reached the limit OR if dates aren't set
                 if (currentMaxDay > 0 && (!hasDates || currentMaxDay < totalDays)) {
                   const nextDay = currentMaxDay + 1;
                   return (
                     <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2 opacity-50">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            Day {nextDay}
                          </h4>
                          {hasDates && (
                            <span className="text-xs text-gray-400 font-medium">
                              {totalDays - currentMaxDay} days remaining
                            </span>
                          )}
                        </div>
                        <div className="bg-white/50 p-4 rounded-xl border border-dashed border-gray-200">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                              placeholder={`Add activity for Day ${nextDay}...`}
                              className="h-9 text-sm"
                              value={newActivity[nextDay]?.title || ""}
                              onChange={(e) =>
                                setNewActivity((prev) => ({
                                  ...prev,
                                  [nextDay]: { ...prev[nextDay], title: e.target.value },
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-9 px-4"
                              onClick={() => handleAddManualActivity(nextDay)}
                            >
                              <Plus className="h-4 w-4 mr-1.5" /> Add Day {nextDay}
                            </Button>
                          </div>
                       </div>
                     </div>
                   );
                 }
                 return null;
              })()}
            </div>
          </div>
        )}
      </CardContent>

      {/* Hidden Printable Component - kept in DOM for PDF capture but invisible to user */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
        }}>
        <PrintableQuote
          quote={editedQuote}
          client={client}
          tripDetails={tripDetails}
          showCommissions={false}
        />
      </div>
    </Card>
  );
}
