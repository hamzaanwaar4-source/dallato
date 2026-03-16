"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchSuperAdminFlightsDetails, SuperAdminFlightDetail } from "@/lib/api/dashboard.api";
import { FlightsDataTable } from "@/components/super-admin/flights-data-table";
import { FlightDetailModal } from "@/components/super-admin/flight-detail-modal";

export default function SuperAdminFlightsPage() {
  const [flights, setFlights] = useState<SuperAdminFlightDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<SuperAdminFlightDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSuperAdminFlightsDetails();
      setFlights(data);
    } catch (error) {
      console.error("Failed to load flights:", error);
      toast.error("Failed to load flights data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (flight: SuperAdminFlightDetail) => {
    setSelectedFlight(flight);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-6 gap-6 overflow-hidden">
      <div className="flex flex-col gap-2">
        {/* <h1 className="text-3xl font-bold text-[#000E19] tracking-tight">Flight Bookings</h1> */}
        <p className="text-gray-500 font-medium">
          Detailed view of all flight bookings across all agencies with revenue breakdown.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          </div>
        ) : (
          <FlightsDataTable 
            flights={flights}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>

      <FlightDetailModal 
        flight={selectedFlight}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
