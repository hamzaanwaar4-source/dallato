"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchSuperAdminHotelsDetails, SuperAdminHotelDetail } from "@/lib/api/dashboard.api";
import { HotelsDataTable } from "@/components/super-admin/hotels-data-table";
import { HotelDetailModal } from "@/components/super-admin/hotel-detail-modal";

export default function SuperAdminHotelsPage() {
  const [hotels, setHotels] = useState<SuperAdminHotelDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState<SuperAdminHotelDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSuperAdminHotelsDetails();
      setHotels(data);
    } catch (error) {
      console.error("Failed to load hotels:", error);
      toast.error("Failed to load hotels data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (hotel: SuperAdminHotelDetail) => {
    setSelectedHotel(hotel);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-6 gap-6 overflow-hidden">
      <div className="flex flex-col gap-2">
        {/* <h1 className="text-3xl font-bold text-[#000E19] tracking-tight">Hotel Bookings</h1> */}
        <p className="text-gray-500 font-medium">
          Detailed view of all hotel bookings across all agencies with revenue breakdown.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          </div>
        ) : (
          <HotelsDataTable 
            hotels={hotels}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>

      <HotelDetailModal 
        hotel={selectedHotel}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
