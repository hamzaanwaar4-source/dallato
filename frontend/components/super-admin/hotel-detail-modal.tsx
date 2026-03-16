"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SuperAdminHotelDetail } from "@/lib/api/dashboard.api";
import { MapPin, Star, Building2, Calendar, User, CreditCard } from "lucide-react";

interface HotelDetailModalProps {
  hotel: SuperAdminHotelDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HotelDetailModal({
  hotel,
  isOpen,
  onClose,
}: HotelDetailModalProps) {
  if (!hotel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border border-gray-100 shadow-sm rounded-xl">
              <AvatarImage src={hotel.hotel_image || undefined} className="object-cover" />
              <AvatarFallback className="bg-sky-50 text-sky-600 text-xl font-bold rounded-xl">
                {hotel.hotel_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold text-[#000E19]">
                {hotel.hotel_name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {hotel.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{hotel.address || hotel.country}</span>
                  </div>
                )}
                {hotel.star_rating && (
                  <>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: hotel.star_rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Revenue</p>
            <p className="text-xl font-bold text-[#000E19] mt-1">
              ${hotel.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Bookings</p>
            <p className="text-xl font-bold text-[#000E19] mt-1">
              {hotel.total_bookings}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase">Avg Value</p>
            <p className="text-xl font-bold text-[#000E19] mt-1">
              ${(hotel.total_revenue / hotel.total_bookings).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase">Source</p>
            <p className="text-xl font-bold text-[#000E19] mt-1 truncate">
              {hotel.source}
            </p>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#000E19]">Booking History</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[120px]">Quote</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotel.bookings.map((booking) => (
                  <TableRow key={booking.booking_id}>
                    <TableCell className="font-medium text-sky-600">
                      {booking.quote_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="font-medium">{booking.client_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{booking.agency_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">
                          {new Date(booking.check_in_date).toLocaleDateString()}
                        </span>
                        <span className="text-slate-500">
                          {booking.nights} nights
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {booking.room_type || "Standard"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${booking.price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
