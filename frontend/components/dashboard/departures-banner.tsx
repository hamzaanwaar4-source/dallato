"use client";

import { useState } from "react";
import { Plane, ChevronRight, FileText, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DepartureItem, UpcomingDeparturesData } from "@/lib/types/dashboard";
import { DepartureModal } from "./departure-modal";

import { Skeleton } from "@/components/ui/skeleton";

interface DeparturesBannerProps {
  departures?: UpcomingDeparturesData;
  showDetails?: boolean;
  isLoading?: boolean;
}

export function DeparturesBanner({
  departures,
  showDetails = true,
  isLoading = false,
}: DeparturesBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="!bg-[var(--primary-skyblue)]/20 !border !border-[var(--primary-skyblue)] shadow-none cursor-pointer transition-colors hover:bg-[var(--primary-skyblue)] rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
            <div className="flex items-center gap-6 pl-[64px] md:pl-0">
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDepartures = departures?.total || 0;
  const urgentCount = departures?.urgent_count || 0;

  return (
    <>
      <Card className="!bg-[var(--primary-skyblue)]/20 !border !border-[var(--primary-skyblue)] shadow-none cursor-pointer transition-colors hover:bg-[var(--primary-skyblue)] rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Icon Box */}
              <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shrink-0">
                <Plane className="h-6 w-6 text-[var(--primary-skyblue)]" />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-[#000E19] text-base whitespace-nowrap">
                    Upcoming Departures (7d)
                  </h3>
                  <Badge className="bg-[var(--primary-skyblue)] hover:bg-[var(--primary-skyblue)] text-white text-[10px] px-1.5 py-0.5 h-5 font-bold rounded-md shrink-0 border-none">
                    {urgentCount} URGENT
                  </Badge>
                </div>
                <p className="text-[13px] text-[#757D83] mt-1 font-medium truncate">
                  {totalDepartures} departures scheduled • Click to view details
                </p>
              </div>
            </div>

            {/* Right Side Stats */}
            <div className="flex items-center justify-between w-full md:w-auto gap-6 pl-[64px] md:pl-0">
              <div className="text-center">
                <span className="block text-3xl font-bold text-[var(--primary-skyblue)] leading-none">
                  {totalDepartures}
                </span>
                <span className="text-[10px] text-[var(--primary-skyblue)] uppercase font-bold mt-1 block">
                  Total
                </span>
              </div>
              <button
                className="h-9 w-9 rounded-full bg-[var(--primary-skyblue)] flex items-center justify-center hover:bg-[var(--primary-skyblue)]/40 hover:text-white transition-colors shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Departure Cards List */}
          {showDetails && departures?.items && (
            <div className="space-y-4">
              {departures.items.slice(0, 4).map((departure, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-5 border border-[#FFD6C2] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
                    <div className="flex items-start gap-4 w-full sm:w-auto">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 bg-[#43ABFF] text-white">
                        {departure.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h4 className="font-bold text-[#000E19] text-base truncate">
                            {departure.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#757D83] bg-[#F2F4F7] px-2 py-0.5 rounded-md shrink-0">
                            <Plane className="h-3 w-3 text-[#43ABFF]" />
                            {departure.flight}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#757D83] bg-[#F2F4F7] px-2 py-0.5 rounded-md shrink-0">
                            <FileText className="h-3 w-3 text-[#8B5CF6]" />
                            {departure.bookingRef}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-[#757D83] font-medium truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {departure.location}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide border-none shrink-0 self-start sm:self-center ${
                        departure.urgentLevel === "high"
                          ? "bg-[#F43F5E] text-white"
                          : "bg-[#EFF8FF] text-[#43ABFF]"
                      }`}
                    >
                      {departure.statusLabel}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#F2F4F7]/50 rounded-xl p-4 border border-[#F2F4F7]">
                      <p className="text-[10px] text-[#757D83] font-bold uppercase mb-1">
                        Departure
                      </p>
                      <p className="text-sm font-bold text-[#000E19]">
                        {departure.departureDate}
                      </p>
                      <p className="text-[11px] text-[#757D83] font-medium mt-0.5">
                        {departure.time}
                      </p>
                    </div>
                    <div className="bg-[#F2F4F7]/50 rounded-xl p-4 border border-[#F2F4F7]">
                      <p className="text-[10px] text-[#757D83] font-bold uppercase mb-1">
                        Return
                      </p>
                      <p className="text-sm font-bold text-[#000E19]">
                        {departure.returnDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DepartureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departures={departures?.items || []}
      />
    </>
  );
}
