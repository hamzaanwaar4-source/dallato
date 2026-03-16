"use client";

import { useState } from "react";
import {
  Search,
  Clock,
  MapPin,
  Plane,
  Eye,
  Calendar,
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
import { SuperAdminFlightDetail } from "@/lib/api/dashboard.api";

interface FlightsDataTableProps {
  flights: SuperAdminFlightDetail[];
  onViewDetails: (flight: SuperAdminFlightDetail) => void;
}

export function FlightsDataTable({
  flights,
  onViewDetails,
}: FlightsDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFlights = flights.filter(
    (flight) =>
      flight.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.flight_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flight.source && flight.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header & Search */}
      <div className="p-6 border-b border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-sky-100 rounded-lg flex items-center justify-center">
              <Plane className="h-4 w-4 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold text-[#000E19]">Booked Flights</h2>
          </div>
          <Badge
            variant="secondary"
            className="bg-blue-50 text-[#43ABFF] border-none font-bold">
            {flights.length} Total Flights
          </Badge>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by carrier, flight number or source..."
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
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto w-[300px]">
                Flight Details
              </TableHead>
              {/* <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Aircraft
              </TableHead> */}
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Bookings
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Total Revenue
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider h-auto">
                Source
              </TableHead>
              <TableHead className="px-6 py-5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-right h-auto">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#E2E8F0]">
            {filteredFlights.length > 0 ? (
              filteredFlights.map((flight) => (
                <TableRow
                  key={flight.id}
                  className="group hover:bg-gray-50/80 transition-colors border-b border-gray-100 cursor-pointer"
                  onClick={() => onViewDetails(flight)}>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-100 shadow-sm rounded-lg bg-white p-1">
                        <AvatarImage src={flight.carrier_logo || undefined} className="object-contain" />
                        <AvatarFallback className="bg-sky-50 text-sky-600 font-bold rounded-lg">
                          {flight.carrier.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[15px] font-bold text-[#0F172A] line-clamp-1">
                          {flight.carrier}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5">
                          <Plane className="h-3 w-3 text-gray-400 rotate-45" />
                          <span>{flight.flight_number}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {/* <TableCell className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-700">
                        {flight.aircraft_type || "N/A"}
                      </span>
                    </div>
                  </TableCell> */}
                  <TableCell className="px-6 py-5">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                      {flight.total_bookings} Bookings
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="text-[15px] font-bold text-[#0F172A]">
                      ${flight.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Badge variant="outline" className="text-xs font-medium border-slate-200 text-slate-600">
                      {flight.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(flight);
                      }}
                    >
                      <Eye className="h-4 w-4 text-slate-400 hover:text-sky-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Plane className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">
                      No flights found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
