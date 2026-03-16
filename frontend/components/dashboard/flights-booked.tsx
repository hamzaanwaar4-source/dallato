"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plane } from "lucide-react";
import { SuperAdminFlightListing } from "@/lib/api/dashboard.api";

import { useRouter } from "next/navigation";

interface FlightsBookedProps {
  data: SuperAdminFlightListing[];
  isLoading?: boolean;
}

export function FlightsBooked({ data, isLoading }: FlightsBookedProps) {
  const router = useRouter();
  // Calculate growth percentage based on recent vs older bookings
  const calculateGrowth = (bookedDates: string[]): number => {
    if (bookedDates.length < 2) return 0;
    
    const sortedDates = [...bookedDates].sort();
    const midPoint = Math.floor(sortedDates.length / 2);
    const recentBookings = sortedDates.slice(midPoint).length;
    const olderBookings = sortedDates.slice(0, midPoint).length;
    
    if (olderBookings === 0) return 100;
    return Math.round(((recentBookings - olderBookings) / olderBookings) * 100);
  };

  // Get top 10 flights by bookings
  const topFlights = data.slice(0, 10);
  const totalBookings = data.reduce((sum, flight) => sum + flight.total_bookings, 0);

  if (isLoading) {
    return (
      <Card className="bg-white border border-slate-200 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-slate-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-sky-500" />
              <CardTitle className="text-lg font-semibold">Top Flights Booked</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Monthly trends by carrier</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sky-500 hover:text-sky-600 hover:bg-sky-50"
            onClick={() => router.push('/super-admin/flights')}
          >
            View All →
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {topFlights.map((flight, index) => {
          const growth = calculateGrowth(flight.booked_dates);
          
          return (
            <div
              key={`${flight.carrier}-${flight.flight_number}-${index}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Icon */}
              <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                <Plane className="h-5 w-5 text-sky-500" />
              </div>

              {/* Flight Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">
                    {flight.carrier} {flight.flight_number}
                  </h4>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">
                    {flight.total_bookings.toLocaleString()} bookings
                  </p>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                    {flight.source}
                  </Badge>
                </div>
              </div>

              {/* Growth Badge */}
              {growth !== 0 && (
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium ${
                    growth > 0
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}
                >
                  {growth > 0 ? "+" : ""}{growth}%
                </Badge>
              )}
            </div>
          );
        })}

        {/* Total */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {totalBookings.toLocaleString()}
            </span>{" "}
            total flight bookings this month
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
