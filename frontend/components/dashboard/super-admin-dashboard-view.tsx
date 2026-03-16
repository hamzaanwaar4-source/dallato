"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DestinationsChart } from "@/components/dashboard/destinations-chart";
import { RevenueOverview } from "@/components/dashboard/revenue-overview";
import { HotelsBooked } from "@/components/dashboard/hotels-booked";
import { FlightsBooked } from "@/components/dashboard/flights-booked";
import { agenciesApi } from "@/lib/api/agencies.api"
import { AgencyStats } from "@/components/agencies/agency-stats"
import { AgencyStatsSkeleton } from "@/components/agencies/agency-stats-skeleton"

import {
  fetchSuperAdminAgencies,
  fetchSuperAdminAgencyRevenue,
  fetchSuperAdminTopDestinations,
  fetchSuperAdminHotels,
  fetchSuperAdminFlights,
  SuperAdminAgency,
  SuperAdminAgencyRevenue,
  SuperAdminHotelListing,
  SuperAdminFlightListing,
} from "@/lib/api/dashboard.api";
import { ChartDataPoint, SystemHealthData } from "@/lib/types/dashboard";
import { AgencyDashboardStats } from "@/lib/types/agencies";

export function SuperAdminDashboardView() {
  const [agencies, setAgencies] = useState<SuperAdminAgency[]>([]);
  const [revenueAgencyId, setRevenueAgencyId] = useState<string>("");
  const [stats, setStats] = useState<AgencyDashboardStats | null>(null)

  const [destinationsAgencyId, setDestinationsAgencyId] = useState<string>("");
  const [revenueData, setRevenueData] = useState<SuperAdminAgencyRevenue | null>(null);
  const [destinationsData, setDestinationsData] = useState<ChartDataPoint[]>([]);
  const [hotelsData, setHotelsData] = useState<SuperAdminHotelListing[]>([]);
  const [flightsData, setFlightsData] = useState<SuperAdminFlightListing[]>([]);

  const [isLoadingAgencies, setIsLoadingAgencies] = useState(true);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [isLoadingHotels, setIsLoadingHotels] = useState(true);
  const [isLoadingFlights, setIsLoadingFlights] = useState(true);

  // Fetch agencies and health on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingAgencies(true);
        const [agenciesData] = await Promise.all([
          fetchSuperAdminAgencies(),
        ]);
        const [statsData] = await Promise.all([
          agenciesApi.getAgencyStats(),
        ]);

        setAgencies(agenciesData);
        setStats(statsData)


        if (agenciesData.length > 0) {
          const firstAgencyId = agenciesData[0].id.toString();
          setRevenueAgencyId(firstAgencyId);
          setDestinationsAgencyId(firstAgencyId);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsLoadingAgencies(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch hotels and flights data on mount
  useEffect(() => {
    const loadBookingsData = async () => {
      try {
        setIsLoadingHotels(true);
        setIsLoadingFlights(true);
        
        const [hotels, flights] = await Promise.all([
          fetchSuperAdminHotels(),
          fetchSuperAdminFlights(),
        ]);
        
        setHotelsData(hotels);
        setFlightsData(flights);
      } catch (error) {
        console.error("Failed to fetch bookings data:", error);
      } finally {
        setIsLoadingHotels(false);
        setIsLoadingFlights(false);
      }
    };

    loadBookingsData();
  }, []);

  // Fetch revenue when revenue agency is selected
  useEffect(() => {
    if (!revenueAgencyId) {
      setRevenueData(null);
      return;
    }

    const loadRevenueData = async () => {
      try {
        setIsLoadingRevenue(true);
        const revenue = await fetchSuperAdminAgencyRevenue(revenueAgencyId);
        setRevenueData(revenue);
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setIsLoadingRevenue(false);
      }
    };

    loadRevenueData();
  }, [revenueAgencyId]);

  // Fetch destinations when destinations agency is selected (only if not already loaded during init)
  useEffect(() => {
    if (!destinationsAgencyId) {
      setDestinationsData([]);
      return;
    }

    // Skip if data was already loaded during agency selection
    if (destinationsData.length > 0 && isLoadingAgencies) {
      return;
    }

    const loadDestinationsData = async () => {
      try {
        setIsLoadingDestinations(true);
        const destinations = await fetchSuperAdminTopDestinations(destinationsAgencyId);
        setDestinationsData(destinations);
      } catch (error) {
        console.error("Failed to fetch destinations data:", error);
      } finally {
        setIsLoadingDestinations(false);
      }
    };

    loadDestinationsData();
  }, [destinationsAgencyId]);

  // Convert revenue data to format expected by RevenueOverview component
  const revenueOverviewData = revenueData
    ? {
      monthly_revenue: revenueData.current_month_revenue.toString(),
      revenue_change_percent: revenueData.revenue_change_percent.toString(),
      avg_quote_value: revenueData.avg_quote_value.toString(),
      avg_quote_change_percent: "0",
      pending_value: revenueData.pending_value.toString(),
      pending_change_percent: "0",
    }
    : undefined;

  // No global loading block - render structure immediately




  return (
    <div className="space-y-6 p-6 pb-35">
      {/* <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, Super Admin</h1>
        <p className="text-muted-foreground mt-2">
          Platform management and settings dashboard
        </p>
      </div> */}

      {/* Stats Row */}
      {stats ? <AgencyStats stats={stats} /> : <AgencyStatsSkeleton />}


      {/* Revenue and Destinations Charts with Separate Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Overview with Agency Filter */}
        <RevenueOverview
          data={revenueOverviewData}
          isLoading={isLoadingRevenue || isLoadingAgencies}
          agencies={agencies}
          selectedAgencyId={revenueAgencyId}
          onAgencyChange={setRevenueAgencyId}
        />

        {/* Destinations Chart with Agency Filter */}
        <DestinationsChart
          data={destinationsData}
          isLoading={isLoadingDestinations || isLoadingAgencies}
          agencies={agencies}
          selectedAgencyId={destinationsAgencyId}
          onAgencyChange={setDestinationsAgencyId}
        />
      </div>

      {/* Hotels and Flights Booked */}
      <div className="grid gap-4 md:grid-cols-2">
        <HotelsBooked data={hotelsData} isLoading={isLoadingHotels} />
        <FlightsBooked data={flightsData} isLoading={isLoadingFlights} />
      </div>

    </div>
  );
}
