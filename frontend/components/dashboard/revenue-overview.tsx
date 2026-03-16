"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentRevenueOverview, SuperAdminAgency } from "@/lib/api/dashboard.api";
import { AgencySelector } from "@/components/dashboard/agency-selector";

interface RevenueMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

interface RevenueOverviewProps {
  data?: AgentRevenueOverview;
  isLoading?: boolean;
  agencies?: SuperAdminAgency[];
  selectedAgencyId?: string;
  onAgencyChange?: (agencyId: string) => void;
}

export function RevenueOverview({
  data,
  isLoading = false,
  agencies,
  selectedAgencyId,
  onAgencyChange,
}: RevenueOverviewProps) {
  const metrics: RevenueMetric[] = data
    ? [
      {
        label: "Monthly Revenue",
        value: `$${Number(data.monthly_revenue).toLocaleString()}`,
        change: `${Number(data.revenue_change_percent) >= 0 ? "+" : ""}${data.revenue_change_percent}%`,
        trend:
          Number(data.revenue_change_percent) > 0
            ? "up"
            : Number(data.revenue_change_percent) < 0
              ? "down"
              : "neutral",
      },
      {
        label: "Avg Quote Value",
        value: `$${Number(data.avg_quote_value).toLocaleString()}`,
        change: `${Number(data.avg_quote_change_percent) >= 0 ? "+" : ""}${data.avg_quote_change_percent}%`,
        trend:
          Number(data.avg_quote_change_percent) > 0
            ? "up"
            : Number(data.avg_quote_change_percent) < 0
              ? "down"
              : "neutral",
      },
      {
        label: "Pending Value",
        value: `$${Number(data.pending_value).toLocaleString()}`,
        change: `${Number(data.pending_change_percent) >= 0 ? "+" : ""}${data.pending_change_percent}%`,
        trend:
          Number(data.pending_change_percent) > 0
            ? "up"
            : Number(data.pending_change_percent) < 0
              ? "down"
              : "neutral",
      },
    ]
    : [];

  if (isLoading) {
    return (
      <Card className="h-full bg-white border border-slate-200 text-slate-900 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded bg-slate-100" />
              <Skeleton className="h-6 w-32 bg-slate-100" />
            </div>
            {agencies && onAgencyChange && (
              <Skeleton className="h-8 w-[180px]" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24 bg-slate-50" />
                <Skeleton className="h-4 w-8 bg-slate-50" />
              </div>
              <Skeleton className="h-8 w-32 bg-slate-50" />
              {i < 3 && <div className="border-b border-slate-100 pt-2" />}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white border border-slate-200 text-slate-900 overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-base font-bold text-slate-800">
              Revenue Overview
            </CardTitle>
          </div>
          {agencies && onAgencyChange && (
            <AgencySelector
              agencies={agencies}
              selectedAgencyId={selectedAgencyId}
              onSelect={onAgencyChange}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-4">
        <div className="space-y-6">
          {metrics.map((metric, index) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">
                  {metric.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {metric.value}
              </div>
              {index < metrics.length - 1 && (
                <div className="border-b border-slate-100 pt-4" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}