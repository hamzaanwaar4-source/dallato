"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { SalesPipelineStat } from "@/lib/api";

interface PipelineStage {
  label: string;
  count: number;
  color: string;
  percentage: number;
}
interface SalesPipelineProps {
  data?: SalesPipelineStat[];
  isLoading?: boolean;
}

// interface SalesPipelineProps {
//   isLoading?: boolean;
// }

// export function SalesPipeline({ isLoading = false }: SalesPipelineProps) {
export function SalesPipeline({
  data = [],
  isLoading = false,
}: SalesPipelineProps) {
  const stages: PipelineStage[] = data.map((item) => ({
    label: item.status,
    count: item.count,
    percentage: Number(item.percentage),
    color:
      item.status === "Confirmed"
        ? "bg-emerald-500"
        : item.status === "In Negotiation"
          ? "bg-amber-500"
          : item.status === "Quote Sent"
            ? "bg-blue-500"
            : "bg-slate-400",
  }));

  if (isLoading) {
    return (
      <Card className="h-full bg-white border border-slate-200 text-slate-900 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded bg-slate-100" />
            <Skeleton className="h-6 w-32 bg-slate-100" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24 bg-slate-50" />
                <Skeleton className="h-4 w-8 bg-slate-50" />
              </div>
              <Skeleton className="h-2 w-full bg-slate-50 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white border border-slate-200 text-slate-900 overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-500" />
          <CardTitle className="text-base font-bold text-slate-800">
            Sales Pipeline
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pt-4 pb-6">
        <div className="space-y-6">
          {stages.map((stage) => (
            <div key={stage.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">
                  {stage.label}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {stage.count}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/manage-bookings"
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            View Full Pipeline
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
